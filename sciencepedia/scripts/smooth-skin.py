"""Chia nhỏ lưới da BodyParts3D một bậc (Catmull-Clark) bằng Blender → .cache/anatomy/smooth-skin/.

    <python có gói bpy> scripts/smooth-skin.py
    npx tsx --env-file-if-exists=.env scripts/import-smooth-skin.ts [--write [--upload]]

Vì sao: lưới da gốc 44.744 tam giác cho cả cơ thể — vai, ngực, bụng gãy thành
mặt phẳng thấy rõ khi phóng to. Một bậc chia nhỏ = gấp 4 tam giác, mặt cong
liền. Không vẽ thêm chi tiết giải phẫu nào: chỉ nội suy bề mặt có sẵn (co vào
vài phần mười mm ở chỗ cong gắt — da che kín lớp trong nên không lộ gì thêm).
Cần `.cache/anatomy/bp3d/` (atlas.json.gz + khối) — tải bởi scripts khác hoặc tay.
"""
import gzip, json, os
import numpy as np
import bpy

ROOT = os.path.join(os.path.dirname(__file__), "..")
CACHE = os.path.join(ROOT, ".cache/anatomy/bp3d")
OUT = os.path.join(ROOT, ".cache/anatomy/smooth-skin")
os.makedirs(OUT, exist_ok=True)

atlas = json.loads(gzip.open(os.path.join(CACHE, "atlas.json.gz")).read())
part = next(p for p in atlas["parts"] if p["id"] == "FJ2810")
chunk = atlas["chunks"][part["chunk"]]
raw = gzip.open(os.path.join(CACHE, chunk["gzip"].split("/")[-1])).read()
pos = np.frombuffer(raw, dtype=np.float32, count=part["vertexCount"] * 3, offset=part["positions"]).reshape(-1, 3)
idx = np.frombuffer(raw, dtype=np.uint32, count=part["indexCount"], offset=part["indices"]).reshape(-1, 3)

bpy.ops.wm.read_factory_settings(use_empty=True)
me = bpy.data.meshes.new("skin")
me.from_pydata(pos.tolist(), [], idx.tolist())
# Gộp đỉnh trùng vị trí (530 cặp) để bề mặt liền khi chia nhỏ.
import bmesh
bm = bmesh.new(); bm.from_mesh(me)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new("skin", me)
bpy.context.scene.collection.objects.link(ob)
mod = ob.modifiers.new("sub", "SUBSURF")
mod.levels = mod.render_levels = 1
mod.subdivision_type = "CATMULL_CLARK"
dg = bpy.context.evaluated_depsgraph_get()
ev = ob.evaluated_get(dg)
m2 = ev.to_mesh()
m2.calc_loop_triangles()
n = len(m2.vertices)
co = np.empty(n * 3, dtype=np.float32); m2.vertices.foreach_get("co", co)
tri = np.empty(len(m2.loop_triangles) * 3, dtype=np.uint32); m2.loop_triangles.foreach_get("vertices", tri)
ev.to_mesh_clear()
co.tofile(os.path.join(OUT, "positions.f32"))
tri.tofile(os.path.join(OUT, "indices.u32"))
print("đỉnh", n, "tam giác", len(tri) // 3, "(gốc", part["indexCount"] // 3, ")")
