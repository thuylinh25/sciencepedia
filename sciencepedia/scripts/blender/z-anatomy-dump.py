"""Xuất hình học Z-Anatomy (đã đánh giá modifier, curve → mesh, toạ độ thế giới) ra .cache/z-anatomy/dump/."""
import bpy, json, struct, os, sys
import numpy as np
bpy.ops.wm.open_mainfile(filepath=r".cache/z-anatomy/Z-Anatomy/Startup.blend", load_ui=False)
OUT = r".cache/z-anatomy/dump"
os.makedirs(OUT, exist_ok=True)
WANT = ("1:", "5:", "6:", "7:", "8:")
cols = {}
def walk(c, trail):
    for o in c.objects: cols.setdefault(o.name, trail + [c.name])
    for ch in c.children: walk(ch, trail + [c.name])
walk(bpy.context.scene.collection, [])
dg = bpy.context.evaluated_depsgraph_get()
index = []
blob = open(os.path.join(OUT, "geometry.bin"), "wb")
offset = 0
for o in bpy.data.objects:
    trail = cols.get(o.name)
    if not trail or len(trail) < 2 or not trail[1].startswith(WANT) or o.type not in ("MESH", "CURVE"):
        continue
    if o.type == "CURVE":
        # Lưới quá mịn cho web: tiết diện 8 cạnh, tối đa 4 đoạn giữa hai điểm điều khiển.
        o.data.bevel_resolution = min(o.data.bevel_resolution, 1)
        o.data.resolution_u = min(o.data.resolution_u, 4)
        dg.update()
    ev = o.evaluated_get(dg)
    try:
        me = ev.to_mesh()
    except Exception as e:
        print("skip", o.name, e); continue
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
    b1 = co.tobytes(); b2 = tri.tobytes()
    blob.write(b1); blob.write(b2)
    index.append({"name": o.name, "type": o.type, "trail": trail[1:], "hidden": bool(o.hide_get() or o.hide_viewport),
                  "verts": n, "tris": len(tri) // 3, "pos": offset, "idx": offset + len(b1),
                  "min": co.min(0).round(4).tolist(), "max": co.max(0).round(4).tolist()})
    offset += len(b1) + len(b2)
blob.close()
json.dump(index, open(os.path.join(OUT, "index.json"), "w", encoding="utf-8"), ensure_ascii=False)
print("objects", len(index), "bytes", offset)
