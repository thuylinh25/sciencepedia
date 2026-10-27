"""Lưới xương bướm BodyParts3D đã khử nhiễu + chia nhỏ → .cache/anatomy/smooth-sphenoid/.

    python3 scripts/smooth-sphenoid.py
    npx tsx --env-file-if-exists=.env scripts/import-smooth-sphenoid.ts [--write [--upload]]

Vì sao: lưới xương bướm gốc (FJ3394, 2.791 đỉnh) là lưới sinh từ phân đoạn ảnh —
bề mặt lổn nhổn (góc nhị diện giữa các mặt kề trung vị ~17–19°) nên trong
viewer trông như giấy vò, kém xa bề mặt điêu khắc của các atlas tham chiếu.
Xử lý ở đây CHỈ làm sạch bề mặt đã có: hàn đỉnh trùng, lọc Taubin (khử nhiễu
tần cao, không co rút), chia nhỏ trung điểm hai bậc, mượt nhẹ lại. Không vẽ
thêm chi tiết giải phẫu nào, không đổi tỉ lệ (hộp bao giữ nguyên) — hình học
vẫn là của BodyParts3D, đúng nguyên tắc của `smooth-skin.py`.

Cần `.cache/anatomy/bp3d/` (atlas.json.gz + khối body-13) — tải tay từ R2.
"""
import gzip, json, os
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), "..")
CACHE = os.path.join(ROOT, ".cache/anatomy/bp3d")
OUT = os.path.join(ROOT, ".cache/anatomy/smooth-sphenoid")
os.makedirs(OUT, exist_ok=True)

atlas = json.loads(gzip.open(os.path.join(CACHE, "atlas.json.gz")).read())
part = next(p for p in atlas["parts"] if p["id"] == "FJ3394")
chunk = atlas["chunks"][part["chunk"]]
raw = gzip.open(os.path.join(CACHE, chunk["gzip"].split("/")[-1])).read()
pos = np.frombuffer(raw, dtype=np.float32, count=part["vertexCount"] * 3, offset=part["positions"]).reshape(-1, 3).astype(np.float64)
idx = np.frombuffer(raw, dtype=np.uint32, count=part["indexCount"], offset=part["indices"]).reshape(-1, 3).astype(np.int64)

# --- Hàn đỉnh trùng vị trí (gốc có ~24% đỉnh tách) ---
key, verts, widx = {}, [], np.empty(len(pos), dtype=np.int64)
for i, v in enumerate(pos):
    t = (v[0], v[1], v[2])
    if t not in key:
        key[t] = len(verts)
        verts.append(v)
    widx[i] = key[t]
V = np.array(verts)
F = widx[idx]
F = F[(F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])]
print(f"hàn đỉnh: {len(V)} đỉnh, {len(F)} tam giác (gốc {len(pos)} đỉnh)")


def taubin(V, F, iters, lam=0.5, mu=-0.53):
    edges = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
    edges = np.unique(np.sort(edges, axis=1), axis=0)
    src = np.concatenate([edges[:, 0], edges[:, 1]])
    dst = np.concatenate([edges[:, 1], edges[:, 0]])
    deg = np.bincount(src, minlength=len(V)).astype(np.float64)
    for _ in range(iters):
        for k in (lam, mu):
            acc = np.zeros_like(V)
            np.add.at(acc, src, V[dst])
            mean = acc / np.maximum(deg, 1)[:, None]
            V = V + k * (mean - V) * (deg > 0)[:, None]
    return V


def subdivide(V, F):
    edge_mid, verts = {}, list(V)

    def mid(a, b):
        e = (a, b) if a < b else (b, a)
        if e not in edge_mid:
            edge_mid[e] = len(verts)
            verts.append((V[a] + V[b]) / 2)
        return edge_mid[e]

    newF = []
    for a, b, c in F:
        ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
        newF += [(a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)]
    return np.array(verts), np.array(newF, dtype=np.int64)


V = taubin(V, F, 12)
V, F = subdivide(V, F)
V, F = subdivide(V, F)
V = taubin(V, F, 2)
print(f"kết quả: {len(V)} đỉnh, {len(F)} tam giác")

V.astype(np.float32).tofile(os.path.join(OUT, "positions.f32"))
F.astype(np.uint32).tofile(os.path.join(OUT, "indices.u32"))
print(f"đã ghi {OUT}/positions.f32 + indices.u32")
