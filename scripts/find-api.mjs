const url = "https://testnet.vibevibe.fun/static-v2/indexedDiscovery-DPrEkgti.js";
const c = await (await fetch(url)).text();
console.log("len", c.length);
for (const needle of ["cards?", "tokens", "fields", "curve", "progress"]) {
  const i = c.indexOf(needle);
  if (i >= 0) console.log(needle, c.slice(i, i + 200));
}
