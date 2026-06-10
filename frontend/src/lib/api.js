const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const getAgentFeed = (limit = 20) =>
  fetch(`${API}/api/feed?limit=${limit}`).then(r => r.json())

export const getPortfolioData = (address) =>
  fetch(`${API}/api/portfolio/${address}`).then(r => r.json())

export const getMarketState = () =>
  fetch(`${API}/api/market`).then(r => r.json())

export const setUserStrategy = (address, strategy) =>
  fetch(`${API}/api/strategy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, strategy }) }).then(r => r.json())

export const triggerEmergencyExit = (address) =>
  fetch(`${API}/api/emergency-exit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }) }).then(r => r.json())