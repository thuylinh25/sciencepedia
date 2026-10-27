"""Trích xuất hình học THẾ GIỚI của vài đối tượng Z-Anatomy → .cache/z-anatomy/extract/.

    <blender> -b --factory-startup -noaudio --python scripts/blender/za-extract.py -- "Tên.l" "Tên.r" [...]

Khác z-anatomy-dump*.py (xuất hàng loạt theo collection): bản này nạp ĐÚNG các
đối tượng được gọi tên CÙNG TOÀN BỘ CHUỖI CHA của chúng rồi liên kết cả chuỗi
vào cảnh trước khi đánh giá. Bắt buộc phải vậy: nhiều đối tượng Z-Anatomy mang
toạ độ cục bộ quanh gốc, vị trí thật nằm ở transform của empties cha (".g") —
đánh giá thiếu cha cho bounds quanh (0,0,0), lệch cả mét (đã đo trên temporal
plane/falx khi thử dump theo lô không kèm cha).

Mỗi đối tượng ghi một tệp `<slug>.bin` (float32 xyz thế giới + uint32 tam giác)
và một dòng JSON trong index.json của thư mục ra.
"""
import bpy, json, os, re, sys
import numpy as np

BLEND = r".cache/z-anatomy/Z-Anatomy/Startup.blend"
OUT = r".cache/z-anatomy/extract"
os.makedirs(OUT, exist_ok=True)

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if not argv:
    print("cần tên đối tượng sau --", flush=True); sys.exit(1)

with bpy.data.libraries.load(BLEND, link=False) as (df, dt):
    dt.objects = [n for n in argv if n in df.objects]

scene_col = bpy.context.scene.collection
loaded = {o.name: o for o in dt.objects if o is not None}

def link_with_parents(o):
    chain = []
    p = o
    while p is not None:
        chain.append(p)
        p = p.parent
    for anc in reversed(chain):
        if anc.name not in scene_col.objects:
            scene_col.objects.link(anc)

for o in loaded.values():
    link_with_parents(o)

dg = bpy.context.evaluated_depsgraph_get()
dg.update()
index = []
for name, o in loaded.items():
    if o.type not in ("MESH", "CURVE"):
        print("skip (không phải lưới/đường cong):", name, o.type, flush=True); continue
    if o.type == "CURVE":
        o.data.bevel_resolution = min(o.data.bevel_resolution, 1)
        o.data.resolution_u = min(o.data.resolution_u, 4)
        dg.update()
    ev = o.evaluated_get(dg)
    try:
        me = ev.to_mesh()
    except Exception as e:
        print("skip", name, e, flush=True); ev.to_mesh_clear(); continue
    if me is None or len(me.polygons) == 0:
        ev.to_mesh_clear(); continue
    me.calc_loop_triangles()
    n = len(me.vertices)
    co = np.empty(n * 3, dtype=np.float32); me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    M = np.array(o.matrix_world, dtype=np.float64)
    co = (co @ M[:3, :3].T + M[:3, 3]).astype(np.float32)
    tri = np.empty(len(me.loop_triangles) * 3, dtype=np.uint32); me.loop_triangles.foreach_get("vertices", tri)
    ev.to_mesh_clear()
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    with open(os.path.join(OUT, slug + ".bin"), "wb") as f:
        f.write(co.tobytes()); f.write(tri.tobytes())
    entry = {"name": name, "file": slug + ".bin", "verts": int(n), "tris": int(len(tri) // 3),
             "world_min": co.min(0).round(4).tolist(), "world_max": co.max(0).round(4).tolist()}
    index.append(entry)
    print(json.dumps(entry), flush=True)
json.dump(index, open(os.path.join(OUT, "index.json"), "w", encoding="utf-8"), ensure_ascii=False)
print("extracted", len(index), flush=True)
