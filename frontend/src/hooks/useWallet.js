import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ethBalance } = useBalance({
    address,
    chainId: arbitrumSepolia.id,
  })
  const { data: usdcBalance } = useBalance({
    address,
    token: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    chainId: arbitrumSepolia.id,
  })

  return {
    address,
    isConnected,
    isConnecting,
    disconnect,
    ethBalance: ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0.0000',
    usdcBalance: usdcBalance ? parseFloat(usdcBalance.formatted).toFixed(2) : '0.00',
    shortAddress: address ? `${address.slice(0,6)}…${address.slice(-4)}` : '',
  }
}