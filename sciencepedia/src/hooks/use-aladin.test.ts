import { test } from "node:test";
import assert from "node:assert/strict";

import { isTileResource, shouldShowStall, STALL_AFTER_MS } from "./use-aladin";

test("isTileResource: nhận diện tile HiPS của CDS theo đoạn /Norder<số>/", () => {
  assert.equal(
    isTileResource(
      "https://alasky.cds.unistra.fr/DSS/DSSColor/Norder7/Dir50000/Npix50001.jpg",
    ),
    true,
  );
  assert.equal(
    isTileResource(
      "https://alasky.cds.unistra.fr/Mellinger/P_Mellinger_color/Norder3/Allsky.jpg",
    ),
    true,
  );
});

test("isTileResource: file properties và truy vấn MocServer không phải tile", () => {
  assert.equal(
    isTileResource("https://alasky.cds.unistra.fr/DSS/DSSColor/properties"),
    false,
  );
  assert.equal(
    isTileResource(
      "https://alasky.unistra.fr/MocServer/query?get=record&fmt=json&ID=*P%2FDSS2%2Fcolor*",
    ),
    false,
  );
});

test("isTileResource: không lệ thuộc máy chủ — tile hành tinh ở host khác vẫn tính", () => {
  assert.equal(
    isTileResource("https://example.org/planetary/Norder5/Dir0/Npix12.png"),
    true,
  );
});

test("shouldShowStall: chưa quá hạn chờ thì không nghẽn, dù chưa có tile nào", () => {
  const changedAt = 100_000;
  assert.equal(shouldShowStall(changedAt, 0, changedAt + STALL_AFTER_MS - 1), false);
});

test("shouldShowStall: quá hạn mà không tile nào thuộc khung hiện tại thì nghẽn", () => {
  const changedAt = 100_000;
  assert.equal(shouldShowStall(changedAt, 0, changedAt + STALL_AFTER_MS), true);
  // Tile gần nhất thuộc về khung nhìn TRƯỚC: vẫn nghẽn.
  assert.equal(
    shouldShowStall(changedAt, changedAt - 5_000, changedAt + STALL_AFTER_MS),
    true,
  );
});

test("shouldShowStall: chỉ cần một tile của khung hiện tại về là hết nghẽn", () => {
  const changedAt = 100_000;
  assert.equal(
    shouldShowStall(
      changedAt,
      changedAt + 3_000,
      changedAt + STALL_AFTER_MS + 60_000,
    ),
    false,
  );
});
