import { createPublicClient, http, parseAbi } from "viem";
import { CHAIN, V6_FACTORY } from "./config.js";

const factoryAbi = parseAbi([
  "function curveOf(address token) view returns (address)",
]);

const curveAbi = parseAbi([
  "function pairPrincipal() view returns (uint128)",
  "function targetPairUnits() view returns (uint256)",
  "function complete() view returns (bool)",
  "function baseTaxBps() view returns (uint256)",
]);

const client = createPublicClient({
  chain: {
    id: CHAIN.id,
    name: CHAIN.name,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [CHAIN.rpc] } },
  },
  transport: http(CHAIN.rpc),
});

/**
 * @returns {{ progress: number, graduated: boolean, baseTaxBps: number }}
 */
export async function fetchCurveState(tokenAddress) {
  const token = tokenAddress.toLowerCase();
  const curve = await client.readContract({
    address: V6_FACTORY,
    abi: factoryAbi,
    functionName: "curveOf",
    args: [token],
  });

  if (curve === "0x0000000000000000000000000000000000000000") {
    throw new Error("No curve for this address on testnet V6 factory.");
  }

  const [principal, target, complete, baseTaxBps] = await Promise.all([
    client.readContract({ address: curve, abi: curveAbi, functionName: "pairPrincipal" }),
    client.readContract({ address: curve, abi: curveAbi, functionName: "targetPairUnits" }),
    client.readContract({ address: curve, abi: curveAbi, functionName: "complete" }),
    client.readContract({ address: curve, abi: curveAbi, functionName: "baseTaxBps" }),
  ]);

  const t = target > 0n ? target : 1n;
  const progress = complete ? 100 : Math.min(99.99, Number((principal * 10000n) / t) / 100);

  return {
    progress,
    graduated: complete,
    baseTaxBps: Number(baseTaxBps),
    curveAddress: curve,
  };
}
