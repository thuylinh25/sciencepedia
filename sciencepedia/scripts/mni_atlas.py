"""Phần dùng chung cho atlas thể tích ở không gian MNI → lưới trong hệ toạ độ BodyParts3D.

Dùng bởi `allen-hra.py` (fit phép căn, lưu vào data/anatomy/registration-allen-hra.json) và
`mni-subcortical.py` (CIT168, Neudorfer — DÙNG LẠI phép căn đó, không fit lại).
"""

import json
from pathlib import Path

import numpy as np
from scipy import ndimage, sparse
from scipy.spatial import cKDTree
from skimage import measure

ROOT = Path(__file__).resolve().parent.parent
REGISTRATION = ROOT / "data/anatomy/registration-allen-hra.json"
LANDMARKS = ROOT / ".cache/allen-hra/bp3d-landmarks.json"


# ------------------------------------------------------------------ lưới
def taubin(v: np.ndarray, f: np.ndarray, it: int = 12, lam: float = 0.5, mu: float = -0.53) -> np.ndarray:
    """Làm trơn Taubin (không co lưới). Ma trận kề thưa — vòng lặp Python từng đỉnh mất hàng phút."""
    n = len(v)
    i = np.concatenate([f[:, 0], f[:, 1], f[:, 2], f[:, 1], f[:, 2], f[:, 0]])
    j = np.concatenate([f[:, 1], f[:, 2], f[:, 0], f[:, 0], f[:, 1], f[:, 2]])
    A = sparse.coo_matrix((np.ones(len(i)), (i, j)), shape=(n, n)).tocsr()
    A.data[:] = 1.0  # cạnh lặp (hai tam giác chung cạnh) đếm một lần, như tập láng giềng
    deg = np.asarray(A.sum(1)).ravel()
    W = sparse.diags(np.where(deg > 0, 1 / np.maximum(deg, 1), 0)) @ A
    keep = deg == 0
    for _ in range(it):
        for k in (lam, mu):
            avg = W @ v
            avg[keep] = v[keep]
            v = v + k * (avg - v)
    return v


def hemisphere(shape0: int, aff: np.ndarray, side: str) -> np.ndarray:
    """Mặt nạ theo trục i: bán cầu theo dấu x thế giới (RAS: + là phải)."""
    x_world = aff[0, 0] * np.arange(shape0) + aff[0, 3]
    return x_world < 0 if side == "left" else x_world > 0


def surface(field: np.ndarray, aff: np.ndarray, side: str | None = None, step: int = 1, sigma: float = 0.6, level: float = 0.5):
    """Mặt đẳng trị của `field` (mặt nạ bool, hoặc xác suất 0–1), toạ độ thế giới mm.

    Mặt nạ được làm mờ Gauss rồi lấy mức 0,5; xác suất (atlas xác suất) lấy thẳng mức `level`.
    """
    # Cắt hộp TRƯỚC khi đổi sang số thực: khối 0,25 mm (Neudorfer) có 555 triệu voxel — đổi cả khối
    # cho mỗi nhân là hàng GB bộ nhớ và hàng chục phút.
    support = field > 0
    if side:
        support = support & hemisphere(field.shape[0], aff, side)[:, None, None]
    objs = ndimage.find_objects(support.astype(np.uint8))
    if not objs or objs[0] is None:
        return None
    sl = tuple(slice(max(s.start - 3, 0), min(s.stop + 3, n)) for s, n in zip(objs[0], field.shape))
    sub = field[sl].astype(np.float32) * support[sl]
    if field.dtype == bool:
        sub = ndimage.gaussian_filter(sub, sigma)
    # Khối vài voxel làm mờ xong không chạm mức — lấy nửa cực đại.
    lv = level if sub.max() > level * 1.2 else sub.max() / 2
    try:
        v, f, _, _ = measure.marching_cubes(sub, lv, step_size=step)
    except RuntimeError:
        # step 2 trên khối mỏng có thể trượt mất mặt — thử lại ở độ phân giải đủ.
        v, f, _, _ = measure.marching_cubes(sub, lv, step_size=1)
    v = v + np.array([s.start for s in sl])
    v = taubin(v, f)
    w = (aff @ np.c_[v, np.ones(len(v))].T).T[:, :3]
    return w, f.astype(np.int64)


def surface_centroid(v: np.ndarray, f: np.ndarray) -> np.ndarray:
    a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
    area = np.linalg.norm(np.cross(b - a, c - a), axis=1) / 2
    return ((a + b + c) / 3 * area[:, None]).sum(0) / area.sum()


def union_mesh(meshes):
    meshes = [m for m in meshes if m is not None]
    v = np.vstack([m[0] for m in meshes])
    off = np.cumsum([0] + [len(m[0]) for m in meshes[:-1]])
    f = np.vstack([m[1] + o for m, o in zip(meshes, off)])
    return v, f


# ------------------------------------------------------------------ mốc BodyParts3D
_BP: dict | None = None


def bp_mesh(name: str):
    """Lưới BodyParts3D (đã gộp bản bổ sung) theo tên, xuất bởi `import-mni-atlases.ts --export-bp3d`."""
    global _BP
    if _BP is None:
        _BP = {}
        for p in json.load(open(LANDMARKS, encoding="utf-8")):
            v = np.array(p["positions"]).reshape(-1, 3)
            f = np.array(p["indices"]).reshape(-1, 3)
            _BP.setdefault(p["name"].lower(), []).append((v, f))
    parts = _BP.get(name.lower())
    if not parts:
        return None
    return union_mesh(parts)


# ------------------------------------------------------------------ biến đổi
def apply(M: np.ndarray, p: np.ndarray) -> np.ndarray:
    """Affine 4x3 dạng vector hàng: mm MNI → m BodyParts3D."""
    return np.c_[p, np.ones(len(p))] @ M


def tf(T: np.ndarray, p: np.ndarray) -> np.ndarray:
    """Ma trận 4x4 tác dụng lên cột."""
    return (T[:3, :3] @ p.T).T + T[:3, 3]


def umeyama(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Phép đồng dạng (xoay + tỉ lệ đều + dời) a → b, ma trận 4x4 tác dụng lên cột."""
    ma, mb = a.mean(0), b.mean(0)
    A, B = a - ma, b - mb
    U, D, Vt = np.linalg.svd(B.T @ A / len(a))
    Sg = np.eye(3)
    if np.linalg.det(U) * np.linalg.det(Vt) < 0:
        Sg[2, 2] = -1
    Rr = U @ Sg @ Vt
    s = np.trace(np.diag(D) @ Sg) / (A**2).sum(1).mean()
    T = np.eye(4)
    T[:3, :3] = s * Rr
    T[:3, 3] = mb - s * Rr @ ma
    return T


def icp(src_v: np.ndarray, dst_v: np.ndarray, iters: int = 40) -> np.ndarray:
    """ICP đồng dạng hai chiều (điểm nguồn → đích và đích → nguồn) để vỏ không co về một phía."""
    T = np.eye(4)
    td = cKDTree(dst_v)
    for _ in range(iters):
        cur = tf(T, src_v)
        _, i1 = td.query(cur)
        _, i2 = cKDTree(cur).query(dst_v)
        T = umeyama(np.vstack([cur, cur[i2]]), np.vstack([dst_v[i1], dst_v])) @ T
    return T


def inside(points: np.ndarray, v: np.ndarray, f: np.ndarray) -> np.ndarray:
    """Chẵn lẻ số lần tia +x cắt mặt (Möller–Trumbore), tia hơi lệch để tránh trúng cạnh."""
    d = np.array([1.0, 1e-3, 2e-3])
    d /= np.linalg.norm(d)
    a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
    e1, e2 = b - a, c - a
    h = np.cross(d, e2)
    det = (e1 * h).sum(1)
    inv = 1 / np.where(np.abs(det) < 1e-15, 1e-15, det)
    out = np.zeros(len(points), dtype=bool)
    for i in range(0, len(points), 256):
        p = points[i : i + 256, None, :]
        s = p - a[None]
        u = (s * h[None]).sum(2) * inv
        q = np.cross(s, e1[None])
        w = (q * d).sum(2) * inv
        t = (q * e2[None]).sum(2) * inv
        hit = (u >= 0) & (w >= 0) & (u + w <= 1) & (t > 0) & (np.abs(det) > 1e-15)
        out[i : i + 256] = hit.sum(1) % 2 == 1
    return out


def containment(points: np.ndarray, shell) -> dict:
    """Tỉ lệ đỉnh ngoài vỏ + độ lòi tối đa (mm)."""
    ins = inside(points, *shell)
    dist = cKDTree(shell[0]).query(points[~ins])[0] * 1000 if (~ins).any() else np.array([0.0])
    return {"outside_fraction": round(float((~ins).mean()), 3), "max_protrusion_mm": round(float(dist.max()), 2)}


def load_registration():
    """(M 4x3, {tên vùng: T 4x4}) đã fit bởi allen-hra.py."""
    r = json.load(open(REGISTRATION, encoding="utf-8"))
    M = np.array(r["matrix_4x3_rowvector"])
    T = {k: np.array(v["matrix"]) for k, v in r["regional_refinement_4x4_column"].items()}
    return M, T
