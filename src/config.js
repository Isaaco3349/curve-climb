/** Robinhood Chain Testnet — vibe/vibe V6 factory (run15) */
export const CHAIN = {
  id: 46630,
  name: "Robinhood Chain Testnet",
  rpc: "https://rpc.testnet.chain.robinhood.com",
};

export const V6_FACTORY = "0xe794217880011f9cA6961340eD5c16EC9559Fea0";

/** Demo token (VIBEVIBE pair) until you paste your launch address */
export const DEMO_TOKEN = "0x35750D0EC4000a92f49274631D6c4BA9E714d8B8";

export const LINKS = {
  vibeCreate: "https://testnet.vibevibe.fun/create",
  vibeFaucet: "https://testnet.vibevibe.fun/faucet",
  robinhoodFaucet: "https://faucet.testnet.chain.robinhood.com",
  docs: "https://testnet.vibevibe.fun/docs/#start-here/builders",
};

export function tokenPageUrl(address) {
  return `https://testnet.vibevibe.fun/token/${address}`;
}

export function parseTokenFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("token")?.trim();
  if (!raw || !/^0x[a-fA-F0-9]{40}$/.test(raw)) return null;
  return raw;
}
