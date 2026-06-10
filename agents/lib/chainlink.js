import { createPublicClient, http, formatUnits } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.ARBITRUM_SEPOLIA_RPC),
})

// Chainlink ETH/USD on Arbitrum Sepolia
const ETH_USD_FEED = '0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165'

const AGGREGATOR_ABI = [
  {
    name: 'latestRoundData',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'roundId',         type: 'uint80'  },
      { name: 'answer',          type: 'int256'  },
      { name: 'startedAt',       type: 'uint256' },
      { name: 'updatedAt',       type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80'  },
    ],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
]

export async function getETHPrice() {
  try {
    const [roundData, decimals] = await Promise.all([
      client.readContract({ address: ETH_USD_FEED, abi: AGGREGATOR_ABI, functionName: 'latestRoundData' }),
      client.readContract({ address: ETH_USD_FEED, abi: AGGREGATOR_ABI, functionName: 'decimals' }),
    ])
    const price = Number(roundData[1]) / Math.pow(10, Number(decimals))
    return { price: price.toFixed(2), updatedAt: Number(roundData[3]) }
  } catch (err) {
    console.error('[Chainlink] Failed to fetch ETH price:', err.message)
    return { price: '1700.00', updatedAt: Date.now() / 1000 } // fallback
  }
}

export async function getPriceFeeds() {
  const eth = await getETHPrice()
  return {
    ETH_USD: parseFloat(eth.price),
    updatedAt: eth.updatedAt,
    source: 'Chainlink',
    network: 'Arbitrum Sepolia',
  }
}