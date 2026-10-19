"""Allen Human Reference Atlas 3D (2020) → lưới nhân sâu, căn về hệ toạ độ BodyParts3D.

    <python có nibabel, scikit-image, scipy> scripts/allen-hra.py

Đọc  .cache/allen-hra/annotation.nii.gz, voxel_count.csv (cây nhãn), bp3d-landmarks.json
     (xuất bằng `npx tsx scripts/import-allen-hra.ts --export-bp3d`).
Ghi  .cache/allen-hra/out.json             — lưới đã căn (mét, hệ BodyParts3D), cho bước đóng gói
     data/anatomy/registration-allen-hra.json — ma trận MNI→BodyParts3D, mốc, sai số, kiểm tra.
     CIT168 / Neudorfer (cùng không gian MNI) dùng lại đúng ma trận này.

Vì sao affine theo mốc: atlas là không gian MẪU (trung bình 152 não), BodyParts3D là MỘT
người — phép dời cứng không khớp. Mốc là TÂM BỀ MẶT theo diện tích của cùng một cấu trúc ở
hai bộ (so cùng loại: tâm lưới với tâm lưới, không lấy tâm thể tích so trung bình đỉnh). Mốc
trải từ nhân sâu ra hồi, cầu não, tiểu não để affine không phải ngoại suy. Thoát lỗi khi
ma trận có dấu hiệu lật trái/phải, tỉ lệ vô lý, hoặc nhân đồi thị lòi ra ngoài đồi thị.
"""

import csv
import json
import sys
from pathlib import Path

import nibabel as nib
import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree
from skimage import measure

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache/allen-hra"
REG_OUT = ROOT / "data/anatomy/registration-allen-hra.json"

img = nib.load(CACHE / "annotation.nii.gz")
LAB = np.asarray(img.dataobj)
AFF = img.affine
assert nib.aff2axcodes(AFF) == ("R", "A", "S"), nib.aff2axcodes(AFF)

# Allen chỉ vẽ nhãn BÁN CẦU TRÁI (x < 0: 6,97 triệu voxel; x > 0: ~10 nghìn voxel tràn).
# Mẫu ICBM 2009b là mẫu ĐỐI XỨNG → lật nửa trái qua x = 0 là hợp lệ, và cấu trúc đường giữa
# (não thất ba, cầu não…) mới có tâm đúng. Không lật thì affine chỉ có mốc một bên + đường
# giữa lệch trái → dẹt trục x (đã đo: hệ số 0,37) — bộ kiểm dưới đây chặn được.
_x = AFF[0, 0] * np.arange(LAB.shape[0]) + AFF[0, 3]
_mid = int(np.where(np.isclose(_x, 0))[0][0])
LAB = LAB.copy()
for _i in range(_mid + 1, LAB.shape[0]):
    _src = 2 * _mid - _i
    LAB[_i] = LAB[_src] if _src >= 0 else 0

ROWS = {int(r["id"]): r for r in csv.DictReader(open(CACHE / "voxel_count.csv", encoding="utf-8"))}


def leaves(*ids: int) -> list[int]:
    """Nhãn lá trong thể tích thuộc bất kỳ id nào (kể cả con cháu theo structure_id_path)."""
    present = set(int(x) for x in np.unique(LAB) if x)
    out = set()
    for leaf in present:
        path = {int(p) for p in ROWS[leaf]["structure_id_path"].strip("/").split("/")}
        if path & set(ids):
            out.add(leaf)
    return sorted(out)


# ------------------------------------------------------------------ lưới
def taubin(v: np.ndarray, f: np.ndarray, it: int = 12, lam: float = 0.5, mu: float = -0.53) -> np.ndarray:
    n = len(v)
    nb = [[] for _ in range(n)]
    for a, b, c in f:
        nb[a] += [b, c]
        nb[b] += [a, c]
        nb[c] += [a, b]
    nb = [np.unique(x) for x in nb]
    for _ in range(it):
        for k in (lam, mu):
            avg = np.array([v[x].mean(0) if len(x) else v[i] for i, x in enumerate(nb)])
            v = v + k * (avg - v)
    return v


def mesh(ids: list[int], side: str | None, step: int = 1):
    """Mặt của tập nhãn (một bên nếu `side`), toạ độ MNI mm. Bên = dấu x thế giới (RAS: + là phải)."""
    m = np.isin(LAB, ids)
    if side:
        x_world = AFF[0, 0] * np.arange(LAB.shape[0]) + AFF[0, 3]
        keep = x_world < 0 if side == "left" else x_world > 0
        m &= keep[:, None, None]
    if not m.any():
        return None
    sl = ndimage.find_objects(m.astype(np.uint8))[0]
    sl = tuple(slice(max(s.start - 3, 0), s.stop + 3) for s in sl)
    sub = ndimage.gaussian_filter(m[sl].astype(np.float32), 0.6)
    # Khối vài voxel làm mờ xong không chạm 0,5 — lấy nửa cực đại.
    level = 0.5 if sub.max() > 0.6 else sub.max() / 2
    try:
        v, f, _, _ = measure.marching_cubes(sub, level, step_size=step)
    except RuntimeError:
        # step 2 trên khối mỏng có thể trượt mất mặt — thử lại ở độ phân giải đủ.
        v, f, _, _ = measure.marching_cubes(sub, level, step_size=1)
    v = v + np.array([s.start for s in sl])
    v = taubin(v, f)
    w = (AFF @ np.c_[v, np.ones(len(v))].T).T[:, :3]
    return w, f.astype(np.int64)


def surface_centroid(v: np.ndarray, f: np.ndarray) -> np.ndarray:
    a, b, c = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
    area = np.linalg.norm(np.cross(b - a, c - a), axis=1) / 2
    return ((a + b + c) / 3 * area[:, None]).sum(0) / area.sum()


# ------------------------------------------------------------------ mốc
BP3D = json.load(open(CACHE / "bp3d-landmarks.json", encoding="utf-8"))
BP = {}
for p in BP3D:
    v = np.array(p["positions"]).reshape(-1, 3)
    f = np.array(p["indices"]).reshape(-1, 3)
    BP.setdefault(p["name"].lower(), []).append((v, f))


def bp_mesh(name: str):
    parts = BP.get(name.lower())
    if not parts:
        return None
    vs, fs, off = [], [], 0
    for v, f in parts:
        vs.append(v)
        fs.append(f + off)
        off += len(v)
    return np.vstack(vs), np.vstack(fs)


THM = [x for x in leaves(10390) if x not in (10430, 10434, 10452)]  # trừ thể gối ngoài/trong, củ cương
# (khoá, nhãn Allen, tên mảnh BodyParts3D không kèm bên, hai bên?, dùng để fit?)
PAIRS = [
    ("thalamus", THM, "thalamus", True, True),
    ("caudate", [10335, 10336, 10337], "caudate nucleus", True, True),
    ("putamen", [10338, 146034754], "putamen", True, True),
    ("globus-pallidus", [10343, 10344], "globus pallidus", True, True),
    ("hippocampus", [12171, 12173, 12174], "hippocampus", True, True),
    ("amygdala", leaves(10361), "amygdala", True, True),
    ("lateral-ventricle", [10597, 10598, 10599, 10600, 266441657], "lateral ventricle", True, True),
    ("insula", [12177, 12178], "insula", True, True),
    ("precentral", [12114], "precentral gyrus", True, True),
    ("superior-frontal", [12115], "superior frontal gyrus", True, True),
    ("middle-frontal", [12116], "middle frontal gyrus", True, True),
    ("postcentral", [12132], "postcentral gyrus", True, True),
    ("supramarginal", [12135], "supramarginal gyrus", True, True),
    ("angular", [12136], "angular gyrus", True, True),
    ("middle-temporal", [12141], "middle temporal gyrus", True, True),
    ("inferior-temporal", [12142], "inferior temporal gyrus", True, True),
    ("superior-parietal", [12133], "superior parietal lobule", True, True),
    ("cingulate", [12157, 12158], "cingulate gyrus", True, True),
    ("parahippocampal", [12163, 12164], "parahippocampal gyrus", True, True),
    ("fusiform", [12143, 12152, 146034892], "fusiform gyrus", True, True),
    ("occipital-lobe", leaves(*[i for i, r in ROWS.items() if r["acronym"] == "OccL"]), "occipital lobe", True, True),
    ("pons", [12405, 12416], "pons", False, True),
    ("medulla", [12535, 12538, 12600, 12826], "medulla oblongata", False, True),
    ("cerebellum", [10658, 10660, 12384, 12390], "cerebellum", False, True),
    ("corpus-callosum", [10561], "corpus callosum", False, True),
    # Giữ ngoài — chỉ để kiểm.
    ("lateral-geniculate", [10430], "lateral geniculate body", True, False),
    ("medial-geniculate", [10434], "medial geniculate body", True, False),
    ("superior-colliculus", [12292], "superior colliculus", True, False),
    ("inferior-colliculus", [12305], "inferior colliculus", True, False),
    ("red-nucleus", [12247], "red nucleus", True, False),
    ("third-ventricle", [10602], "third ventricle", False, False),
    ("fourth-ventricle", [12805], "fourth ventricle", False, False),
    ("aqueduct", [12369], "cerebral aqueduct", False, False),
]

src, dst, keys, fit_mask = [], [], [], []
for key, ids, bp_name, paired, use in PAIRS:
    for side in (["left", "right"] if paired else [None]):
        name = f"{side} {bp_name}" if side else bp_name
        b = bp_mesh(name)
        a = mesh(ids, side, step=2)
        if b is None or a is None:
            print(f"  bỏ mốc {name}: thiếu {'BodyParts3D' if b is None else 'Allen'}")
            continue
        src.append(surface_centroid(*a))
        dst.append(surface_centroid(*b))
        keys.append(name)
        fit_mask.append(use)
src, dst, fit_mask = np.array(src), np.array(dst), np.array(fit_mask)


def fit(s: np.ndarray, d: np.ndarray) -> np.ndarray:
    X = np.c_[s, np.ones(len(s))]
    M, *_ = np.linalg.lstsq(X, d, rcond=None)
    return M  # 4x3: d ≈ [s,1] @ M


def apply(M: np.ndarray, p: np.ndarray) -> np.ndarray:
    return np.c_[p, np.ones(len(p))] @ M


use = fit_mask.copy()
dropped = []
for _ in range(6):
    M = fit(src[use], dst[use])
    r = np.linalg.norm(apply(M, src) - dst, axis=1) * 1000
    med = np.median(r[use])
    worst = int(np.argmax(np.where(use, r, -1)))
    if r[worst] > max(3 * med, 6.0) and use.sum() > 20:
        use[worst] = False
        dropped.append(keys[worst])
    else:
        break
M = fit(src[use], dst[use])
res = np.linalg.norm(apply(M, src) - dst, axis=1) * 1000

# Bỏ-một-ra trên các mốc đã fit.
loo = []
for i in np.where(use)[0]:
    u = use.copy()
    u[i] = False
    loo.append(np.linalg.norm(apply(fit(src[u], dst[u]), src[i : i + 1]) - dst[i]) * 1000)

# ------------------------------------------------------------------ kiểm ma trận
L = M[:3].T  # d = L s + t (s: mm, d: m)
U, S, Vt = np.linalg.svd(L * 1000)
R = U @ Vt
# Hệ BodyParts3D: +x = TRÁI người (đo trên thể thuỷ tinh), +y = trên. Trước/sau: dấu z của hồi trán trên so với thuỳ chẩm.
front = np.mean([dst[keys.index(k)] for k in keys if "superior frontal" in k], axis=0)
back = np.mean([dst[keys.index(k)] for k in keys if "occipital lobe" in k], axis=0)
az = 1.0 if front[2] > back[2] else -1.0
E = np.array([[-1, 0, 0], [0, 0, 1], [0, az, 0]], dtype=float)  # MNI (R,A,S) → (x,y,z) BodyParts3D
angle = np.degrees(np.arccos(np.clip((np.trace(E.T @ R) - 1) / 2, -1, 1)))
checks = {
    "det_sign_matches_expected": bool(np.sign(np.linalg.det(L)) == np.sign(np.linalg.det(E))),
    "rotation_deg_from_expected_axes": round(float(angle), 2),
    "singular_values": [round(float(x), 4) for x in S],
    "anisotropy": round(float(S.max() / S.min()), 4),
}
print("ma trận:", checks)
# Lệch trục ~18° là tư thế đầu (MNI theo đường AC–PC, người mẫu BodyParts3D cúi khác) — ngưỡng
# 25°; lật gương thì định thức đổi dấu, tỉ lệ vô lý thì giá trị kỳ dị lệch xa 1.
ok = checks["det_sign_matches_expected"] and angle < 25 and 0.75 < S.min() and S.max() < 1.15 and checks["anisotropy"] < 1.2


# ------------------------------------------------------------------ tinh chỉnh cục bộ
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
        cur = (T[:3, :3] @ src_v.T).T + T[:3, 3]
        _, i1 = td.query(cur)
        _, i2 = cKDTree(cur).query(dst_v)
        a = np.vstack([cur, cur[i2]])
        b = np.vstack([dst_v[i1], dst_v])
        T = umeyama(a, b) @ T
    return T


def tf(T: np.ndarray, p: np.ndarray) -> np.ndarray:
    return (T[:3, :3] @ p.T).T + T[:3, 3]


def union_mesh(meshes):
    meshes = [m for m in meshes if m is not None]
    v = np.vstack([m[0] for m in meshes])
    off = np.cumsum([0] + [len(m[0]) for m in meshes[:-1]])
    f = np.vstack([m[1] + o for m, o in zip(meshes, off)])
    return v, f


MIDBRAIN_ALLEN = leaves(12195, 12330, 12292, 12305, 12181, 12369)  # chỏm, cuống đại não, gò, vùng trước mái, cống
MIDBRAIN_BP = ["midbrain", "peduncle of midbrain", "interpeduncular fossa", "left superior colliculus", "right superior colliculus", "left inferior colliculus", "right inferior colliculus"]
REGIONS = {}
for side in ("left", "right", None):
    sides = [side] if side else ["left", "right"]
    a = union_mesh([mesh(THM + [10430, 10434], s, step=2) for s in sides])
    b = union_mesh([bp_mesh(f"{s} {n}") for s in sides for n in ("thalamus", "lateral geniculate body", "medial geniculate body")])
    REGIONS[("thalamus", side)] = (icp(apply(M, a[0]), b[0]), b)
a = mesh(MIDBRAIN_ALLEN, None, step=2)
b = union_mesh([bp_mesh(n) for n in MIDBRAIN_BP])
REGIONS[("midbrain", None)] = (icp(apply(M, a[0]), b[0]), b)
a = mesh([10658, 10660, 12384, 12390], None, step=2)
b = bp_mesh("cerebellum")
REGIONS[("cerebellum", None)] = (icp(apply(M, a[0]), b[0]), b)
local = {f"{k} {s or 'both'}": {"scale": round(float(np.cbrt(np.linalg.det(T[:3, :3]))), 4), "shift_mm": round(float(np.linalg.norm(T[:3, 3] + (T[:3, :3] - np.eye(3)) @ b[0].mean(0)) * 1000), 2)} for (k, s), (T, b) in REGIONS.items()}
print("tinh chỉnh cục bộ:", local)

# ------------------------------------------------------------------ lưới xuất
OUT_PARTS = [
    ("anterior-thalamic-nuclei", leaves(10392), "anterior nuclear complex of thalamus", True),
    ("lateral-dorsal-nucleus", [10396], "lateral dorsal nucleus of thalamus", True),
    ("mediodorsal-nucleus", [10398], "mediodorsal nucleus of thalamus", True),
    ("lateral-posterior-nucleus", [10408], "lateral posterior nucleus of thalamus", True),
    ("pulvinar", [10409], "pulvinar of thalamus", True),
    ("ventral-anterior-nucleus", [10417], "ventral anterior nucleus of thalamus", True),
    ("ventral-lateral-nucleus", [10420], "ventral lateral nucleus of thalamus", True),
    ("ventral-posterior-lateral-nucleus", [10424], "ventral posterior lateral nucleus of thalamus", True),
    ("ventral-posterior-medial-nucleus", [10425], "ventral posterior medial nucleus of thalamus", True),
    ("centromedian-nucleus", [10449], "centromedian nucleus of thalamus", True),
    ("parafascicular-nucleus", [10450], "parafascicular nucleus of thalamus", True),
    # Nhân hợp nhất và phức hợp nhân đường giữa KHÔNG xuất: nằm ở khe giữa hai đồi thị, nơi
    # BodyParts3D để trống (đo: 62–83% đỉnh ngoài vỏ, lòi 5 mm) — dễ nằm lọt vào não thất ba.
    ("substantia-nigra", [12251], "substantia nigra", True),
    ("subthalamic-nucleus", [10466], "subthalamic nucleus", True),
    ("zona-incerta", [10463], "zona incerta", True),
    ("cerebellar-deep-nuclei", [10660], "cerebellar deep nuclei", True),
]
THALAMIC = {k for k, *_ in OUT_PARTS[:11]}


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


parts_out, containment, part_regions, edge = [], {}, {}, {}
for key, ids, name, paired in OUT_PARTS:
    for side in (["left", "right"] if paired else [None]):
        r = mesh(ids, side, step=1)
        if r is None:
            continue
        v, f = r
        if key in THALAMIC:
            region = ("thalamus", side)
        elif key == "cerebellar-deep-nuclei":
            region = ("cerebellum", None)
        else:  # chất đen, nhân dưới đồi thị, vùng bất định: trung não + gian não dưới
            region = ("midbrain", None)
        T, (cv, cf) = REGIONS[region]
        part_regions[f"{side or 'mid'} {key}"] = f"{region[0]} {region[1] or 'both'}"
        vb = tf(T, apply(M, v))
        if key in ("subthalamic-nucleus", "zona-incerta"):
            # Gian não dưới: kẹp giữa đồi thị và trung não, không có vỏ chứa riêng. Thử phép của trung
            # não, của đồi thị và trung bình hai phép; chọn phép KHÔNG lọt vào đồi thị đục (≤ 5% đỉnh)
            # và chìm trong trung não ít nhất. Không phép nào đạt → bỏ (trống hơn sai). Đo 2026-10-19:
            # chỉ dùng phép trung não thì vùng bất định lọt 71–78% vào đồi thị.
            th = union_mesh([bp_mesh(f"{s} thalamus") for s in ("left", "right")])
            mb = REGIONS[("midbrain", None)][1]
            Tm, Tt = REGIONS[("midbrain", None)][0], REGIONS[("thalamus", None)][0]
            tries = {}
            for label, Tc in (("midbrain", Tm), ("thalamus", Tt), ("midpoint", (Tm + Tt) / 2)):
                pts = tf(Tc, apply(M, v))
                tries[label] = (float(inside(pts, *th).mean()), float(inside(pts, *mb).mean()), pts)
            ok_tries = {k: x for k, x in tries.items() if x[0] <= 0.05}
            edge[f"{side} {key}"] = {k: {"inside_thalamus": round(x[0], 3), "inside_midbrain": round(x[1], 3)} for k, x in tries.items()}
            if not ok_tries:
                edge[f"{side} {key}"]["chosen"] = None
                part_regions.pop(f"{side or 'mid'} {key}")
                continue
            choice = min(ok_tries, key=lambda k: ok_tries[k][1])
            edge[f"{side} {key}"]["chosen"] = choice
            part_regions[f"{side or 'mid'} {key}"] = {"midbrain": "midbrain both", "thalamus": "thalamus both", "midpoint": "mean(midbrain both, thalamus both)"}[choice]
            vb = ok_tries[choice][2]
        parts_out.append({"key": key, "name": name, "side": side, "positions": vb.round(6).ravel().tolist(), "indices": f.ravel().tolist()})
        # Kiểm "nằm trong" ở nơi có vỏ chứa thật: nhân đồi thị trong đồi thị + thể gối, chất đen
        # trong trung não + cuống, nhân sâu trong tiểu não. Nhân dưới đồi thị, vùng bất định nằm
        # dưới đồi thị — BodyParts3D không có lưới vùng dưới đồi thị để làm vỏ.
        if key in THALAMIC or key in ("substantia-nigra", "cerebellar-deep-nuclei"):
            ins = inside(vb, cv, cf)
            dist = cKDTree(cv).query(vb[~ins])[0] * 1000 if (~ins).any() else np.array([0.0])
            containment[f"{side or 'mid'} {key}"] = {"outside_fraction": round(float((~ins).mean()), 3), "max_protrusion_mm": round(float(dist.max()), 2)}

tot = sum(len(p["positions"]) // 3 for p in parts_out)
print(f"{len(parts_out)} lưới, {tot} đỉnh")
outside = np.mean([c["outside_fraction"] for c in containment.values()])
max_prot = max(c["max_protrusion_mm"] for c in containment.values())
for k, c in containment.items():
    print(f"  {k}: {c['outside_fraction']:.0%} đỉnh ngoài vỏ, lòi tối đa {c['max_protrusion_mm']} mm")
print(f"trung bình {outside:.1%} đỉnh ngoài vỏ chứa, lòi ra tối đa {max_prot:.1f} mm")

# Kiểm độc lập ở góc ngoại suy: hành + dải khứu Allen so với nét khứu giác Z-Anatomy.
olf = {}
for side in ("left", "right"):
    a = mesh([10307, 12073], side, step=2)
    z = bp_mesh(f"{side} olfactory nerve (i)")
    if a and z is not None:
        olf[side] = round(float(np.median(cKDTree(apply(M, a[0])).query(z[0])[0]) * 1000), 2)
print("nét khứu giác ZA cách hành+dải khứu Allen (trung vị, mm):", olf)
print("nhân dưới đồi thị / vùng bất định:", edge)

report = {
    "source": "Allen Human Reference Atlas - 3D, 2020 (annotation.nii.gz, ICBM 2009b NLin Sym, RAS, mm)",
    "target": "BodyParts3D 4.0 frame (m; +x subject left, +y superior)",
    "matrix_4x3_rowvector": M.round(9).tolist(),
    "landmarks": [
        {"name": k, "fit": bool(u), "residual_mm": round(float(x), 2)} for k, u, x in zip(keys, use, res)
    ],
    "dropped_as_outliers": dropped,
    "fit_residual_median_mm": round(float(np.median(res[use])), 2),
    "leave_one_out_median_mm": round(float(np.median(loo)), 2),
    "held_out_median_mm": round(float(np.median(res[~fit_mask])), 2),
    "checks": checks,
    # Phép áp cho từng phần = regional[vùng] ∘ affine toàn não (nhân với toạ độ đã qua matrix_4x3).
    "regional_refinement_4x4_column": {
        f"{k} {s or 'both'}": {
            "matrix": T.round(9).tolist(),
            "scale": round(float(np.cbrt(np.linalg.det(T[:3, :3]))), 4),
        }
        for (k, s), (T, _) in REGIONS.items()
    },
    "part_regions": part_regions,
    # Tỉ lệ đỉnh ngoài vỏ chứa SAU tinh chỉnh — gần như do cách dựng (ICP khớp đúng vỏ ấy), không
    # phải số đo độ chính xác. Số độc lập: held_out_median_mm và olfactory_za_vs_allen_median_mm.
    "containment_after_refinement": containment,
    "subthalamic_zona_incerta_check": edge,
    "olfactory_za_vs_allen_median_mm": olf,
}
REG_OUT.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
(CACHE / "out.json").write_text(json.dumps({"parts": parts_out}), encoding="utf-8")
print("fit trung vị", report["fit_residual_median_mm"], "mm · bỏ-một-ra", report["leave_one_out_median_mm"], "mm · giữ ngoài", report["held_out_median_mm"], "mm · loại", dropped)
for lm in report["landmarks"]:
    if not lm["fit"]:
        print(f"  giữ ngoài/loại {lm['name']}: {lm['residual_mm']} mm")
if not ok:
    print("✗ ma trận không đạt kiểm tra (lật/tỉ lệ/xoắn) — không dùng")
    sys.exit(1)
