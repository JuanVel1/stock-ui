export interface Stock {
  ticker: string
  company: string
  brokerage?: string
  rating_to: string
  target_to: string
  target_from: string
  price: string
  change: number
  rating?: string
  volatility?: string
  action?: string
  time?: string
  upside?: number
  confidence?: number
}

export interface Toast {
  message: string
  type: 'success' | 'error' | 'info'
}