"""Allen Human Reference Atlas 3D (2020) → lưới nhân sâu, căn về hệ toạ độ BodyParts3D.

    <python có nibabel, scikit-image, scipy> scripts/allen-hra.py

Đọc  .cache/allen-hra/annotation.nii.gz, voxel_count.csv (cây nhãn), bp3d-landmarks.json
     (xuất bằng `npx tsx scripts/import-mni-atlases.ts --export-bp3d`).
Ghi  .cache/allen-hra/out.json             — lưới đã căn (mét, hệ BodyParts3D), cho bước đóng gói
     data/anatomy/registration-allen-hra.json — ma trận MNI→BodyParts3D, phép tinh chỉnh từng
     vùng, mốc, sai số, kiểm tra. `mni-subcortical.py` (CIT168, Neudorfer) DÙNG LẠI phép căn này.

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
from scipy.spatial import cKDTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mni_atlas import REGISTRATION, apply, bp_mesh, containment, icp, inside, surface, surface_centroid, tf, union_mesh  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache/allen-hra"

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


def mesh(ids: list[int], side: str | None, step: int = 1):
    """Mặt của tập nhãn (một bên nếu `side`), toạ độ MNI mm."""
    return surface(np.isin(LAB, ids), AFF, side, step)


THM = [x for x in leaves(10390) if x not in (10430, 10434, 10452)]  # trừ thể gối ngoài/trong, cuống tùng
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
MIDBRAIN_ALLEN = leaves(12195, 12330, 12292, 12305, 12181, 12369)  # chỏm, cuống đại não, gò, vùng trước mái, cống
MIDBRAIN_BP = ["midbrain", "peduncle of midbrain", "interpeduncular fossa", "left superior colliculus", "right superior colliculus", "left inferior colliculus", "right inferior colliculus"]
# Vùng dưới đồi: Allen vẽ trọn vùng (4 miền + nhãn chung) → khớp với vùng dưới đồi + củ xám + thể vú
# của BodyParts3D. Dùng cho nhân vùng dưới đồi của Neudorfer — fit bằng cả vùng chứ không bằng tập
# nhân (nhân không lấp kín vùng, ICP đồng dạng trên tập thưa sẽ phóng to).
HYPOTHALAMUS_ALLEN = [10467, 10468, 10473, 10483, 10495]
HYPOTHALAMUS_BP = ["hypothalamus", "tuber cinereum", "mammillary body"]
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
a = mesh(HYPOTHALAMUS_ALLEN, None, step=1)
b = union_mesh([bp_mesh(n) for n in HYPOTHALAMUS_BP])
REGIONS[("hypothalamus", None)] = (icp(apply(M, a[0]), b[0]), b)
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
    # Chất đen KHÔNG xuất từ Allen (2026-10-19): CIT168 tách phần đặc / phần lưới (mni-subcortical.py).
    ("subthalamic-nucleus", [10466], "subthalamic nucleus", True),
    ("zona-incerta", [10463], "zona incerta", True),
    ("cerebellar-deep-nuclei", [10660], "cerebellar deep nuclei", True),
]
THALAMIC = {k for k, *_ in OUT_PARTS[:11]}

parts_out, contained, part_regions, edge = [], {}, {}, {}
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
        else:  # nhân dưới đồi thị, vùng bất định: trung não + gian não dưới
            region = ("midbrain", None)
        T, shell = REGIONS[region]
        part_regions[f"{side or 'mid'} {key}"] = f"{region[0]} {region[1] or 'both'}"
        vb = tf(T, apply(M, v))
        if key in ("subthalamic-nucleus", "zona-incerta"):
            # Gian não dưới: kẹp giữa đồi thị và trung não, không có vỏ chứa riêng. Thử phép của trung
            # não, của đồi thị và trung bình hai phép; chọn phép KHÔNG lọt vào đồi thị đục (≤ 5% đỉnh)
            # và chìm trong trung não ít nhất. Không phép nào đạt → bỏ (trống hơn sai). Đo 2026-10-19:
            # vùng bất định lọt 67–78% vào đồi thị ở mọi phép → không nhập.
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
        # Kiểm "nằm trong" ở nơi có vỏ chứa thật: nhân đồi thị trong đồi thị + thể gối, nhân sâu trong
        # tiểu não. Nhân dưới đồi thị không có lưới vỏ riêng ở BodyParts3D.
        if key in THALAMIC or key == "cerebellar-deep-nuclei":
            contained[f"{side or 'mid'} {key}"] = containment(vb, shell)

tot = sum(len(p["positions"]) // 3 for p in parts_out)
print(f"{len(parts_out)} lưới, {tot} đỉnh")
outside = np.mean([c["outside_fraction"] for c in contained.values()])
max_prot = max(c["max_protrusion_mm"] for c in contained.values())
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
    "containment_after_refinement": contained,
    "subthalamic_zona_incerta_check": edge,
    "olfactory_za_vs_allen_median_mm": olf,
}
REGISTRATION.write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
(CACHE / "out.json").write_text(json.dumps({"parts": parts_out}), encoding="utf-8")
print("fit trung vị", report["fit_residual_median_mm"], "mm · bỏ-một-ra", report["leave_one_out_median_mm"], "mm · giữ ngoài", report["held_out_median_mm"], "mm · loại", dropped)
if not ok:
    print("✗ ma trận không đạt kiểm tra (lật/tỉ lệ/xoắn) — không dùng")
    sys.exit(1)
