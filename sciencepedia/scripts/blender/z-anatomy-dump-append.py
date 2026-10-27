"""Xuất hình học Z-Anatomy ra .cache/z-anatomy/dump/ — bản ÍT NGỐN RAM của z-anatomy-dump.py.

    <blender> -b --factory-startup -noaudio --python scripts/blender/z-anatomy-dump-append.py

Vì sao có bản này: mở thẳng `Startup.blend` (306 MB) bằng open_mainfile dựng
toàn bộ cảnh + depsgraph — máy ít RAM (≤8 GB) bị hệ điều hành giết tiến trình.
Bản này cho cùng một kết quả theo từng đối tượng nhưng nạp theo lô:
  1. Chỉ nạp Scene + cây Collection để dựng lại đường mòn (trail) đúng thứ tự
     duyệt của z-anatomy-dump.py (đối tượng thuộc nhiều collection lấy đường
     mòn gặp đầu tiên).
  2. Với từng collection hệ, nạp riêng các đối tượng của nó, đánh giá lưới đã
     áp modifier (đường cong → lưới, cùng mức chi tiết như bản gốc), ghi vào
     geometry.bin + index.json, rồi dỡ đối tượng khỏi bộ nhớ.

Định dạng ra giống hệt bản gốc để `scripts/import-z-anatomy.ts` dùng chung.
WANT có thêm "4:" (hệ cơ) so với bản gốc — phục vụ đợt nhập cơ vuông thắt
lưng + cơ ngang bụng; z-anatomy-dump.py cũng đã thêm "4:" để hai bản khớp.

CẢNH BÁO (đo ngày 2026-10-27): đánh giá từng đối tượng KHÔNG kèm chuỗi cha
nên đối tượng nào có transform ở empties cha bị đặt SAI vị trí (temporal
plane/falx cerebri lệch ~3,3 m; số đỉnh cũng khác khi modifier tham chiếu
đối tượng khác). CHƯA dùng bản này để tạo lại toàn bộ manifest — trích xuất
ít đối tượng thì dùng za-extract.py (có nạp chuỗi cha).
"""
import bpy, json, os, sys
import numpy as np

BLEND = r".cache/z-anatomy/Z-Anatomy/Startup.blend"
OUT = r".cache/z-anatomy/dump"
os.makedirs(OUT, exist_ok=True)
WANT = ("1:", "4:", "5:", "6:", "7:", "8:")

# --- Pha 1: đường mòn từ cây collection của Scene ---
with bpy.data.libraries.load(BLEND, link=False) as (df, dt):
    scene_names = list(df.scenes)
    dt.scenes = scene_names[:1]
    dt.collections = list(df.collections)
scene = dt.scenes[0] if dt.scenes else None
if scene is None:
    print("KHÔNG có scene trong tệp", flush=True); sys.exit(1)
cols = {}
def walk(c, trail):
    for o in c.objects: cols.setdefault(o.name, trail + [c.name])
    for ch in c.children: walk(ch, trail + [c.name])
walk(scene.collection, [])
targets = {}
for name, full in cols.items():
    if len(full) < 2 or not full[1].startswith(WANT):
        continue
    targets[name] = full[1:]
print("đối tượng thuộc các collection cần xuất:", len(targets), flush=True)
# Giải phóng cây collection/scene đã nạp (chỉ giữ lại tên + đường mòn).
for c in list(bpy.data.collections): bpy.data.collections.remove(c)
for s in list(bpy.data.scenes):
    if s != bpy.context.scene: bpy.data.scenes.remove(s)
# Nạp collection ở pha 1 kéo theo MỌI đối tượng thành viên thành khối dữ liệu.
# Không dỡ hết thì pha 2 nạp trùng tên, Blender tự đổi tên thành ".001" và tra
# cứu đường mòn lệch hẳn (đã gặp: mọi collection ra 0 đối tượng).
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
for me in list(bpy.data.meshes): bpy.data.meshes.remove(me)
for cu in list(bpy.data.curves): bpy.data.curves.remove(cu)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
print("sau dọn pha 1: objects còn", len(bpy.data.objects), flush=True)

by_system = {}
for name, trail in targets.items():
    by_system.setdefault(trail[0], []).append(name)

# --- Pha 2: nạp + đánh giá theo từng collection hệ ---
blob = open(os.path.join(OUT, "geometry.bin"), "wb")
index = []
offset = 0
scene_col = bpy.context.scene.collection
for system in WANT:
    names = sorted(n for sysname, ns in by_system.items() if sysname.startswith(system) for n in ns)
    if not names: continue
    print(f"{system}: {len(names)} tên cần nạp", flush=True)
    with bpy.data.libraries.load(BLEND, link=False) as (df, dt):
        dt.objects = [n for n in names if n in df.objects]
    print(f"{system}: đã nạp {len([o for o in dt.objects if o is not None])} đối tượng", flush=True)
    dg = bpy.context.evaluated_depsgraph_get()
    done = 0
    for o in list(dt.objects):
        if o is None: continue
        trail = targets.get(o.name)
        if trail is None or o.type not in ("MESH", "CURVE"):
            continue
        if o.name not in scene_col.objects:
            scene_col.objects.link(o)
        if o.type == "CURVE":
            o.data.bevel_resolution = min(o.data.bevel_resolution, 1)
            o.data.resolution_u = min(o.data.resolution_u, 4)
            dg.update()
        ev = o.evaluated_get(dg)
        try:
            me = ev.to_mesh()
        except Exception as e:
            print("skip", o.name, e, flush=True)
            ev.to_mesh_clear(); continue
        if me is None or len(me.polygons) == 0:
            ev.to_mesh_clear(); continue
        me.calc_loop_triangles()
        n = len(me.vertices)
        co = np.empty(n * 3, dtype=np.float32); me.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3)
        M = np.array(o.matrix_world, dtype=np.float64)
        co = (co @ M[:3, :3].T + M[:3, 3]).astype(np.float32)
        tri = np.empty(len(me.loop_triangles) * 3, dtype=np.uint32); me.loop_triangles.foreach_get("vertices", tri)
        hidden = bool(o.hide_get() or o.hide_viewport)
        ev.to_mesh_clear()
        b1 = co.tobytes(); b2 = tri.tobytes()
        blob.write(b1); blob.write(b2)
        index.append({"name": o.name, "type": o.type, "trail": trail, "hidden": hidden,
                      "verts": n, "tris": len(tri) // 3, "pos": offset, "idx": offset + len(b1),
                      "min": co.min(0).round(4).tolist(), "max": co.max(0).round(4).tolist()})
        offset += len(b1) + len(b2)
        done += 1
        scene_col.objects.unlink(o)
        data = o.data
        bpy.data.objects.remove(o)
        if data is not None and data.users == 0:
            try:
                if isinstance(data, bpy.types.Mesh): bpy.data.meshes.remove(data)
                elif isinstance(data, bpy.types.Curve): bpy.data.curves.remove(data)
            except Exception: pass
    print(f"{system}: {done} đối tượng, tổng {len(index)}, {offset/1e6:.1f} MB", flush=True)
blob.close()
json.dump(index, open(os.path.join(OUT, "index.json"), "w", encoding="utf-8"), ensure_ascii=False)
print("objects", len(index), "bytes", offset, flush=True)
