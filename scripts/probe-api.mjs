const token = "0x35750D0EC4000a92f49274631D6c4BA9E714d8B8";
const params = new URLSearchParams({
  tokens: token,
  limit: "1",
});
const url = `https://testnet.vibevibe.fun/api/v1/chains/eip155:46630/v6/launches/cards?${params}`;
const r = await fetch(url);
console.log(url);
console.log(r.status, await r.text());
