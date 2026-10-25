const url = "https://testnet.vibevibe.fun/static-v2/domain-shared-C_q0maeU.js";
const c = await (await fetch(url)).text();
const idx = c.indexOf("v6Graphs");
const chunk = c.slice(idx, idx + 12000);
for (const key of ["lens", "Lens", "LENS", "curve", "Curve", "reader"]) {
  const i = chunk.indexOf(key);
  if (i >= 0) console.log(key, chunk.slice(i, i + 120));
}
const addrs = [...chunk.matchAll(/0x[a-fA-F0-9]{40}/g)].map((m) => m[0]);
console.log("unique addrs", [...new Set(addrs)]);
