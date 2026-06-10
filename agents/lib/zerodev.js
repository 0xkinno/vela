// ZeroDev session key execution
// For hackathon demo, this wraps direct viem wallet calls
// Full ZeroDev integration requires ZERODEV_PROJECT_ID

import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'
import { VAULT_ABI, ADDRESSES } from './contracts.js'

const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY)

export const walletClient = createWalletClient({
  account,
  chain: arbitrumSepolia,
  transport: http(process.env.ARBITRUM_SEPOLIA_RPC),
})

export async function executeDeployToAave(amount) {
  console.log(`[ZeroDev] Executing deployToAave: ${amount}`)
  const hash = await walletClient.writeContract({
    address: ADDRESSES.VelaVault,
    abi: VAULT_ABI,
    functionName: 'deployToAave',
    args: [BigInt(amount)],
  })
  console.log(`[ZeroDev] tx: ${hash}`)
  return hash
}

export async function executeWithdrawFromAave(amount) {
  console.log(`[ZeroDev] Executing withdrawFromAave: ${amount}`)
  const hash = await walletClient.writeContract({
    address: ADDRESSES.VelaVault,
    abi: VAULT_ABI,
    functionName: 'withdrawFromAave',
    args: [BigInt(amount)],
  })
  console.log(`[ZeroDev] tx: ${hash}`)
  return hash
}

export async function executeRebalance() {
  console.log(`[ZeroDev] Executing rebalance`)
  const hash = await walletClient.writeContract({
    address: ADDRESSES.VelaVault,
    abi: VAULT_ABI,
    functionName: 'rebalance',
    args: [],
  })
  console.log(`[ZeroDev] tx: ${hash}`)
  return hash
}

export async function executeEmergencyExit() {
  console.log(`[ZeroDev] EMERGENCY EXIT`)
  const hash = await walletClient.writeContract({
    address: ADDRESSES.VelaVault,
    abi: VAULT_ABI,
    functionName: 'emergencyExit',
    args: [],
  })
  return hash
}