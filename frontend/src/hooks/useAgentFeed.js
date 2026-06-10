import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { ADDRESSES, REGISTRY_ABI, ACTION_LABELS, ACTION_AGENT } from '../lib/contracts'
import { formatUnits } from 'viem'

function formatOnchainLog(log, index) {
  const agentType = ACTION_AGENT[log.actionType] || 'scout'
  const action = ACTION_LABELS[log.actionType] || 'ACTION'
  const amount = log.amount > 0n ? `$${parseFloat(formatUnits(log.amount, 6)).toFixed(2)} USDC` : ''
  const ts = Number(log.timestamp) * 1000

  return {
    id: index,
    type: agentType,
    action,
    time: formatRelativeTime(ts),
    ts,
    tx: log.txHash !== '0x0000000000000000000000000000000000000000000000000000000000000000'
      ? log.txHash.slice(0, 10) + '...' + log.txHash.slice(-4)
      : null,
    txFull: log.txHash,
    text: log.reasoning + (amount ? ` · ${amount}` : ''),
    onchain: true,
  }
}

function formatRelativeTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(ts).toLocaleDateString()
}

// WebSocket feed from agent server
function useAgentWebSocket(apiUrl) {
  const [wsEvents, setWsEvents] = useState([])

  useEffect(() => {
    let ws
    try {
      ws = new WebSocket(apiUrl.replace('http', 'ws').replace('https', 'wss'))
      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data)
          if (!event.reasoning && !event.userFacingExplanation) return
          setWsEvents(prev => [{
            id: Date.now(),
            type: event.agentType?.toLowerCase() || 'scout',
            action: event.action || 'UPDATE',
            time: 'just now',
            ts: Date.now(),
            tx: event.txHash ? event.txHash.slice(0, 10) + '...' : null,
            txFull: event.txHash || null,
            text: event.userFacingExplanation || event.reasoning || '',
            onchain: !!event.txHash,
            fresh: true,
          }, ...prev.slice(0, 49)])
        } catch {}
      }
    } catch {}
    return () => ws?.close()
  }, [apiUrl])

  return wsEvents
}

export function useAgentFeed(apiUrl = 'http://localhost:3001') {
  const wsEvents = useAgentWebSocket(apiUrl)

  // Read onchain logs from registry
  const { data: totalLogs } = useReadContract({
    address: ADDRESSES.VelaAgentRegistry,
    abi: REGISTRY_ABI,
    functionName: 'totalLogs',
    chainId: arbitrumSepolia.id,
    watch: true,
  })

  const { data: onchainLogs } = useReadContract({
    address: ADDRESSES.VelaAgentRegistry,
    abi: REGISTRY_ABI,
    functionName: 'getExecutionLogs',
    args: [0n, 50n],
    chainId: arbitrumSepolia.id,
    enabled: totalLogs > 0n,
    watch: true,
  })

  const formattedOnchain = onchainLogs
    ? [...onchainLogs].reverse().map((log, i) => formatOnchainLog(log, i))
    : []

  // Merge: WS events first (live), then onchain (historical)
  const merged = [
    ...wsEvents,
    ...formattedOnchain.filter(oc => !wsEvents.some(ws => ws.txFull === oc.txFull)),
  ]

  return {
    feed: merged,
    totalOnchain: Number(totalLogs || 0),
    hasOnchainData: formattedOnchain.length > 0,
  }
}