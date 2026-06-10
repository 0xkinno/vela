import { arbitrumSepolia } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { createAppKit } from '@reown/appkit/react'

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE'

const metadata = {
  name: 'VELA Protocol',
  description: 'Autonomous DeFi Portfolio Manager on Arbitrum',
  url: 'https://vela.finance',
  icons: [],
}

export const wagmiAdapter = new WagmiAdapter({
  networks: [arbitrumSepolia],
  projectId,
})

export const config = wagmiAdapter.wagmiConfig

createAppKit({
  adapters: [wagmiAdapter],
  networks: [arbitrumSepolia],
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#12B8FF',
    '--w3m-border-radius-master': '6px',
    '--w3m-font-family': 'DM Sans, sans-serif',
  },
})