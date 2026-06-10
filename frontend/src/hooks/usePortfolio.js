import { useState, useEffect } from 'react'
import { getPortfolioData } from '../lib/api'

export function usePortfolio(address) {
  const [portfolio, setPortfolio] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!address) return
    setIsLoading(true)
    getPortfolioData(address).then(data => { setPortfolio(data); setIsLoading(false) }).catch(() => setIsLoading(false))
    const interval = setInterval(() => getPortfolioData(address).then(setPortfolio).catch(console.error), 30000)
    return () => clearInterval(interval)
  }, [address])

  return { portfolio, isLoading }
}