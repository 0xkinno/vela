import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import { arbitrumSepolia } from 'wagmi/chains'
import { ADDRESSES, VAULT_ABI, ERC20_ABI, formatVaultMetrics, formatUserInfo } from '../lib/contracts'

export function useVaultMetrics() {
  const { data, isLoading, refetch } = useReadContract({
    address: ADDRESSES.VelaVault,
    abi: VAULT_ABI,
    functionName: 'getVaultMetrics',
    chainId: arbitrumSepolia.id,
    watch: true,
  })
  return { metrics: formatVaultMetrics(data), isLoading, refetch }
}

export function useUserInfo() {
  const { address } = useAccount()
  const { data, isLoading, refetch } = useReadContract({
    address: ADDRESSES.VelaVault,
    abi: VAULT_ABI,
    functionName: 'getUserInfo',
    args: [address],
    chainId: arbitrumSepolia.id,
    enabled: !!address,
    watch: true,
  })
  return { userInfo: formatUserInfo(data), isLoading, refetch }
}

export function useDeposit() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  async function approve(amountUSDC) {
    const amount = parseUnits(amountUSDC.toString(), 6)
    writeContract({
      address: ADDRESSES.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ADDRESSES.VelaVault, amount],
    })
  }

  async function deposit(amountUSDC) {
    const amount = parseUnits(amountUSDC.toString(), 6)
    writeContract({
      address: ADDRESSES.VelaVault,
      abi: VAULT_ABI,
      functionName: 'deposit',
      args: [amount, address],
    })
  }

  return { approve, deposit, hash, isPending, isConfirming, isSuccess, error }
}

export function useWithdraw() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  async function withdraw(amountUSDC) {
    const amount = parseUnits(amountUSDC.toString(), 6)
    writeContract({
      address: ADDRESSES.VelaVault,
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [amount, address, address],
    })
  }

  return { withdraw, hash, isPending, isConfirming, isSuccess, error }
}