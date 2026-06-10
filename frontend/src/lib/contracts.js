import { formatUnits } from 'viem'

export const ADDRESSES = {
  VelaVault:         import.meta.env.VITE_VAULT_ADDRESS,
  VelaAgentRegistry: import.meta.env.VITE_REGISTRY_ADDRESS,
  VelaStrategy:      import.meta.env.VITE_STRATEGY_ADDRESS,
  USDC:              '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  AavePool:          '0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff',
  ChainlinkETHUSD:   '0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165',
}

export const VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'withdraw',
    type: 'function',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'totalAssets',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'convertToAssets',
    type: 'function',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'totalAaveDeposited',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'totalAgentExecutions',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'totalYieldGenerated',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'emergencyMode',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'getUserInfo',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'assets', type: 'uint256' },
      { name: 'depositedAssets', type: 'uint256' },
      { name: 'yieldEarned', type: 'uint256' },
      { name: 'lastDepositTime', type: 'uint64' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getVaultMetrics',
    type: 'function',
    inputs: [],
    outputs: [
      { name: 'tvl', type: 'uint256' },
      { name: 'liquidBalance', type: 'uint256' },
      { name: 'aaveBalance', type: 'uint256' },
      { name: 'totalDep', type: 'uint256' },
      { name: 'totalWith', type: 'uint256' },
      { name: 'yieldGenerated', type: 'uint256' },
      { name: 'agentExecs', type: 'uint256' },
      { name: 'isEmergency', type: 'bool' },
    ],
    stateMutability: 'view',
  },
]

export const REGISTRY_ABI = [
  {
    name: 'totalLogs',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getExecutionLogs',
    type: 'function',
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'agent', type: 'address' },
          { name: 'actionType', type: 'uint8' },
          { name: 'asset', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'reasoning', type: 'string' },
          { name: 'timestamp', type: 'uint64' },
          { name: 'txHash', type: 'bytes32' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getAllAgents',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'agentAddress', type: 'address' },
          { name: 'agentType', type: 'uint8' },
          { name: 'status', type: 'uint8' },
          { name: 'name', type: 'string' },
          { name: 'registeredAt', type: 'uint256' },
          { name: 'totalExecutions', type: 'uint256' },
          { name: 'lastExecutionAt', type: 'uint256' },
          { name: 'maxSingleTxValue', type: 'uint256' },
          { name: 'canEmergencyExit', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
]

export const STRATEGY_ABI = [
  {
    name: 'applyTemplate',
    type: 'function',
    inputs: [{ name: 'templateId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'setStrategy',
    type: 'function',
    inputs: [
      { name: 'description', type: 'string' },
      { name: 'riskLevel', type: 'uint8' },
      { name: 'aaveAllocation', type: 'uint16' },
      { name: 'stableHoldAlloc', type: 'uint16' },
      { name: 'ethHoldAlloc', type: 'uint16' },
      { name: 'autoRebalance', type: 'bool' },
      { name: 'rebalanceThreshold', type: 'uint256' },
      { name: 'emergencyExitEnabled', type: 'bool' },
      { name: 'stopLossThreshold', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getStrategy',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'description', type: 'string' },
          { name: 'riskLevel', type: 'uint8' },
          { name: 'aaveAllocation', type: 'uint16' },
          { name: 'stableHoldAlloc', type: 'uint16' },
          { name: 'ethHoldAlloc', type: 'uint16' },
          { name: 'autoRebalance', type: 'bool' },
          { name: 'rebalanceThreshold', type: 'uint256' },
          { name: 'emergencyExitEnabled', type: 'bool' },
          { name: 'stopLossThreshold', type: 'uint256' },
          { name: 'updatedAt', type: 'uint64' },
          { name: 'isActive', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getTemplates',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'riskLevel', type: 'uint8' },
          { name: 'aaveAllocation', type: 'uint16' },
          { name: 'stableHoldAlloc', type: 'uint16' },
          { name: 'ethHoldAlloc', type: 'uint16' },
          { name: 'rebalanceThreshold', type: 'uint256' },
          { name: 'stopLossThreshold', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'hasActiveStrategy',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
]

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
]

export const ACTION_LABELS = {
  0: 'DEPLOY → AAVE',
  1: 'WITHDRAW ← AAVE',
  2: 'REBALANCE',
  3: 'EMERGENCY EXIT',
  4: 'HARVEST YIELD',
}

export const ACTION_AGENT = {
  0: 'allocator',
  1: 'allocator',
  2: 'allocator',
  3: 'sentinel',
  4: 'allocator',
}

export function formatVaultMetrics(raw) {
  if (!raw) return null
  return {
    tvl:            parseFloat(formatUnits(raw[0], 6)).toFixed(2),
    liquidBalance:  parseFloat(formatUnits(raw[1], 6)).toFixed(2),
    aaveBalance:    parseFloat(formatUnits(raw[2], 6)).toFixed(2),
    totalDeposited: parseFloat(formatUnits(raw[3], 6)).toFixed(2),
    totalWithdrawn: parseFloat(formatUnits(raw[4], 6)).toFixed(2),
    yieldGenerated: parseFloat(formatUnits(raw[5], 6)).toFixed(4),
    agentExecs:     Number(raw[6]),
    isEmergency:    raw[7],
  }
}

export function formatUserInfo(raw) {
  if (!raw) return null
  return {
    shares:          formatUnits(raw[0], 18),
    assets:          parseFloat(formatUnits(raw[1], 6)).toFixed(2),
    depositedAssets: parseFloat(formatUnits(raw[2], 6)).toFixed(2),
    yieldEarned:     parseFloat(formatUnits(raw[3], 6)).toFixed(4),
    lastDepositTime: Number(raw[4]),
  }
}