const BODIES = { mercury: 199, venus: 299, earth: 399, mars: 499 };

function isoDay(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0, 10);
}

const params = new URLSearchParams({
  format: "text",
  COMMAND: "'499'",
  OBJ_DATA: "'NO'",
  MAKE_EPHEM: "'YES'",
  EPHEM_TYPE: "'VECTORS'",
  CENTER: "'500@10'",
  START_TIME: `'${isoDay(0)}'`,
  STOP_TIME: `'${isoDay(1)}'`,
  STEP_SIZE: "'1 d'",
  VEC_TABLE: "'1'",
  OUT_UNITS: "'AU-D'",
  REF_PLANE: "'ECLIPTIC'",
});

const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
console.log("URL:", url.slice(0, 120), "...");

try {
  const r = await fetch(url, { signal: AbortSignal.timeout(40000) });
  console.log("HTTP", r.status, "| CORS:", r.headers.get("access-control-allow-origin") ?? "(không có)");
  const text = await r.text();
  const block = text.match(/\$\$SOE([\s\S]*?)\$\$EOE/);
  console.log(block ? block[1].trim().split("\n").slice(0, 4).join("\n") : text.slice(0, 400));
  console.log("\nCác id thiên thể dự kiến dùng:", JSON.stringify(BODIES));
} catch (error) {
  console.log("LỖI:", error.name, error.message, error.cause?.code ?? "");
}
