"""CIT168 (chất đen phần đặc / phần lưới) + Neudorfer (nhân vùng dưới đồi) → lưới trong hệ BodyParts3D.

    <python có nibabel, scikit-image, scipy> scripts/mni-subcortical.py

Đọc  .cache/cit168/prob.nii.gz          CIT168 Reinforcement Learning Atlas v1.1.0, bản MNI152 2009c
                                         (OSF jkzwp, CC BY 4.0) — atlas xác suất 16 lớp, 1 mm
     .cache/neudorfer/MNI152b_atlas_labels_0.25mm.nii.gz   Neudorfer et al. 2020 (Zenodo 3942115,
                                         CC BY 4.0) — nhãn 0,25 mm trên MNI152 2009b
     data/anatomy/registration-allen-hra.json   phép căn MNI → BodyParts3D (allen-hra.py)
Ghi  .cache/cit168/out.json, .cache/neudorfer/out.json  — lưới đã căn, cho import-mni-atlases.ts
     data/anatomy/registration-mni-subcortical.json      — độ khớp chéo + kiểm "nằm trong"

Vì sao DÙNG LẠI phép căn của Allen thay vì fit riêng: hai atlas này chỉ có vài cấu trúc sâu — không
đủ mốc trải khắp não để fit affine (sẽ ngoại suy). Cả ba đều ở họ mẫu MNI ICBM 2009 (Allen 2009b
đối xứng, Neudorfer 2009b, CIT168 2009c bất đối xứng); khác biệt giữa các bản mẫu nhỏ hơn nhiều so
với sai số căn (~6 mm). Điều đó ĐO ĐƯỢC chứ không giả định: tâm cùng cấu trúc ở ba atlas, trong
không gian MNI, lệch nhau — script dừng nếu lệch > 3 mm.
"""

import json
import sys
from pathlib import Path

import nibabel as nib
import numpy as np
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mni_atlas import apply, bp_mesh, containment, hemisphere, load_registration, surface, tf, union_mesh  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache"
OUT = ROOT / "data/anatomy/registration-mni-subcortical.json"
M, REG = load_registration()
for need in ("midbrain both", "hypothalamus both"):
    assert need in REG, f"thiếu vùng tinh chỉnh '{need}' — chạy lại allen-hra.py"


def load(path: Path):
    img = nib.load(path)
    assert nib.aff2axcodes(img.affine) == ("R", "A", "S"), (path, nib.aff2axcodes(img.affine))
    return np.asarray(img.dataobj), img.affine


def centroid_mm(mask: np.ndarray, aff: np.ndarray) -> np.ndarray:
    ijk = np.argwhere(mask)
    return (aff @ np.c_[ijk, np.ones(len(ijk))].T).T[:, :3].mean(0)


def upsample(vol: np.ndarray, aff: np.ndarray, factor: int = 2, support: np.ndarray | None = None):
    """Nội suy tuyến tính lên lưới mịn hơn `factor` lần, quanh vùng khác 0 — atlas 1 mm cho lưới bậc thang.

    `support`: cắt theo cùng một hộp cho nhiều lớp, để lưới mịn của chúng trùng nhau từng voxel.
    """
    sl = ndimage.find_objects(((vol if support is None else support) > 0).astype(np.uint8))[0]
    sl = tuple(slice(max(s.start - 3, 0), min(s.stop + 3, n)) for s, n in zip(sl, vol.shape))
    sub = vol[sl]
    grid = np.mgrid[tuple(slice(0, n - 1 + 1e-9, 1 / factor) for n in sub.shape)]
    up = ndimage.map_coordinates(sub, grid, order=1)
    a = aff.copy()
    a[:3, 3] = (aff @ np.r_[[s.start for s in sl], 1])[:3]
    a[:3, :3] = aff[:3, :3] / factor
    return up, a


# ------------------------------------------------------------------ dữ liệu
CIT, CIT_AFF = load(CACHE / "cit168/prob.nii.gz")
NEU, NEU_AFF = load(CACHE / "neudorfer/MNI152b_atlas_labels_0.25mm.nii.gz")
# Tệp lưu float64 (4,4 GB trong bộ nhớ); nhãn là số nguyên ≤ 54 → uint8, rồi lấy hộp từng nhãn MỘT lần.
NEU = np.rint(NEU).astype(np.uint8)
NEU_BOXES = ndimage.find_objects(NEU)


def neu_label(label: int):
    """(mặt nạ đã cắt, affine của phần cắt) cho một nhãn Neudorfer."""
    sl = NEU_BOXES[label - 1]
    if sl is None:
        return None, None
    sl = tuple(slice(max(s.start - 4, 0), min(s.stop + 4, n)) for s, n in zip(sl, NEU.shape))
    a = NEU_AFF.copy()
    a[:3, 3] = (NEU_AFF @ np.r_[[s.start for s in sl], 1])[:3]
    return NEU[sl] == label, a
ALLEN, ALLEN_AFF = load(CACHE / "allen-hra/annotation.nii.gz")
SNC, SNR, RN_C, STH_C = 6, 8, 7, 15  # chỉ số lớp CIT168 theo labels.txt (0 = Pu)

# ------------------------------------------------------------------ độ khớp chéo (không gian MNI, bán cầu trái)
left = lambda m, aff: m & hemisphere(m.shape[0], aff, "left")[:, None, None]  # noqa: E731
pairs = {
    "substantia nigra": [("allen", ALLEN == 12251, ALLEN_AFF), ("cit168", (CIT[..., SNC] >= 0.5) | (CIT[..., SNR] >= 0.5), CIT_AFF), ("neudorfer", NEU == 16, NEU_AFF)],
    "red nucleus": [("allen", ALLEN == 12247, ALLEN_AFF), ("cit168", CIT[..., RN_C] >= 0.5, CIT_AFF), ("neudorfer", NEU == 18, NEU_AFF)],
    "subthalamic nucleus": [("allen", ALLEN == 10466, ALLEN_AFF), ("cit168", CIT[..., STH_C] >= 0.5, CIT_AFF), ("neudorfer", NEU == 14, NEU_AFF)],
}
agreement = {}
for name, items in pairs.items():
    cs = {k: centroid_mm(left(m, a), a) for k, m, a in items}
    agreement[name] = {f"{k}_vs_allen_mm": round(float(np.linalg.norm(c - cs["allen"])), 2) for k, c in cs.items() if k != "allen"}
print("độ khớp chéo (MNI, mm):", agreement)
worst = max(v for d in agreement.values() for v in d.values())
if worst > 3.0:
    print(f"✗ atlas lệch Allen {worst} mm trong không gian MNI — không dùng lại phép căn")
    sys.exit(1)

T_MID, T_HTH = REG["midbrain both"], REG["hypothalamus both"]
MIDBRAIN_SHELL = union_mesh([bp_mesh(n) for n in ["midbrain", "peduncle of midbrain", "interpeduncular fossa", "left superior colliculus", "right superior colliculus", "left inferior colliculus", "right inferior colliculus"]])
HTH_SHELL = union_mesh([bp_mesh(n) for n in ["hypothalamus", "tuber cinereum", "mammillary body"]])
checks = {}


def place(points_mm: np.ndarray, T: np.ndarray) -> np.ndarray:
    return tf(T, apply(M, points_mm))


# ------------------------------------------------------------------ CIT168: chất đen
cit_parts = []
both = CIT[..., SNC] + CIT[..., SNR]
up_c, aff_c = upsample(CIT[..., SNC], CIT_AFF, support=both)
up_r, aff_r = upsample(CIT[..., SNR], CIT_AFF, support=both)
assert np.allclose(aff_c, aff_r) and up_c.shape == up_r.shape
# Hai lớp xen nhau: mỗi voxel về lớp xác suất cao hơn → hai lưới không đâm xuyên nhau.
for key, name, mine, other in (("compacta", "pars compacta of substantia nigra", up_c, up_r), ("reticulata", "pars reticulata of substantia nigra", up_r, up_c)):
    mask = (mine >= 0.5) & (mine >= other)
    for side in ("left", "right"):
        r = surface(mask, aff_c, side, step=1, sigma=0.8)
        if r is None:
            continue
        v = place(r[0], T_MID)
        cit_parts.append({"key": f"substantia-nigra-{key}", "name": name, "side": side, "positions": v.round(6).ravel().tolist(), "indices": r[1].ravel().tolist()})
        checks[f"cit168 {side} {key}"] = containment(v, MIDBRAIN_SHELL)

# ------------------------------------------------------------------ Neudorfer: nhân vùng dưới đồi
# (nhãn phải, nhãn trái, khoá, tên). Bỏ: cấu trúc ngoài vùng dưới đồi (mép trước, dải chéo Broca, vòm,
# bó vú–đồi thị, thể vú — đã có ở BodyParts3D —, nhân dưới đồi thị, chất đen, nhân đỏ, nhân giường
# vân tận cùng, nhân nền Meynert, vùng bất định, cuống đồi thị dưới).
NUCLEI = [
    (19, 20, "medial-preoptic-nucleus", "medial preoptic nucleus"),
    (53, 54, "anterior-hypothalamic-area", "anterior hypothalamic area"),
    (47, 48, "suprachiasmatic-nucleus", "suprachiasmatic nucleus"),
    (45, 46, "supraoptic-nucleus", "supraoptic nucleus"),
    (21, 22, "paraventricular-nucleus", "paraventricular nucleus of hypothalamus"),
    (31, 32, "periventricular-nucleus", "periventricular nucleus of hypothalamus"),
    (23, 24, "dorsal-periventricular-nucleus", "dorsal periventricular nucleus of hypothalamus"),
    (27, 28, "ventromedial-nucleus", "ventromedial nucleus of hypothalamus"),
    (37, 38, "dorsomedial-nucleus", "dorsomedial nucleus of hypothalamus"),
    (29, 30, "arcuate-nucleus", "arcuate nucleus of hypothalamus"),
    (25, 26, "lateral-hypothalamic-area", "lateral hypothalamic area"),
    (51, 52, "posterior-hypothalamic-nucleus", "posterior nucleus of hypothalamus"),
    (49, 50, "tuberomammillary-nucleus", "tuberomammillary nucleus"),
]
neu_parts = []
for right_label, left_label, key, name in NUCLEI:
    for side, label in (("right", right_label), ("left", left_label)):
        mask, aff = neu_label(label)
        r = surface(mask, aff, None, step=2, sigma=1.0) if mask is not None else None
        if r is None:
            print(f"  bỏ {side} {name}: nhãn rỗng")
            continue
        v = place(r[0], T_HTH)
        neu_parts.append({"key": key, "name": name, "side": side, "positions": v.round(6).ravel().tolist(), "indices": r[1].ravel().tolist()})
        checks[f"neudorfer {side} {key}"] = containment(v, HTH_SHELL)

for k, c in checks.items():
    print(f"  {k}: {c['outside_fraction']:.0%} ngoài vỏ, lòi {c['max_protrusion_mm']} mm")
print(f"CIT168 {len(cit_parts)} lưới · Neudorfer {len(neu_parts)} lưới")

(CACHE / "cit168/out.json").write_text(json.dumps({"parts": cit_parts}), encoding="utf-8")
(CACHE / "neudorfer/out.json").write_text(json.dumps({"parts": neu_parts}), encoding="utf-8")
OUT.write_text(
    json.dumps(
        {
            "reuses": "registration-allen-hra.json — matrix_4x3 + regional 'midbrain both' (CIT168), 'hypothalamus both' (Neudorfer)",
            "templates": {"allen": "ICBM 2009b NLin Sym", "cit168": "MNI152 NLin 2009c Asym (v1.1.0)", "neudorfer": "MNI152 2009b"},
            "cross_atlas_centroid_offset_mni_mm": agreement,
            # Như ở Allen: tỉ lệ "nằm trong" sau tinh chỉnh vùng phần lớn do cách dựng, không phải số đo độ chính xác.
            "containment_after_refinement": checks,
        },
        ensure_ascii=False,
        indent=1,
    )
    + "\n",
    encoding="utf-8",
)
