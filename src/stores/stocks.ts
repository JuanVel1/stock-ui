import { defineStore } from 'pinia'
import axios from 'axios'

interface Stock {
  ticker: string
  company: string
  price: string
  brokerage?: string
  rating_to: string
  target_to: string
  target_from: string
  action?: string
  time?: string
  volatility?: string
  change: number
  upside?: number
  confidence?: number
}

interface State {
  stocks: Stock[]
  loading: boolean
  error: string | null
  recommendations: Stock[]
  loadingRecommendations: boolean
  errorRecommendations: string | null
}

// Helper functions
const calculateChange = (stock: Stock): number => {
  return (
    ((parseFloat(stock.target_to) - parseFloat(stock.target_from)) /
      parseFloat(stock.target_from)) *
    100
  )
}

export const useStocksStore = defineStore('stocks', {
  state: (): State => ({
    stocks: [],
    loading: false,
    error: null,
    recommendations: [],
    loadingRecommendations: false,
    errorRecommendations: null,
  }),
  getters: {
    availableStocks: (state) => state.stocks,
    topPicks: (state) => state.recommendations,
  },
  actions: {
    async fetchStocks() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('http://localhost:8081/api/stocks')
        this.stocks = response.data.map((stock: any) => ({
          // Ajusta el mapeo según tu API
          ticker: stock.ticker,
          company: stock.company,
          price: stock.target_to,
          change: parseFloat(calculateChange(stock).toFixed(2)),
          rating: stock.rating_to,
          volatility:
            Math.abs(calculateChange(stock)) > 10
              ? 'Alta'
              : Math.abs(calculateChange(stock)) > 5
                ? 'Media'
                : 'Baja',
        }))
      } catch (error: any) {
        this.error = 'Error loading stock data'
        console.error('Error fetching stocks:', error)
      } finally {
        this.loading = false
      }
    },
    async fetchRecommendations() {
      this.loadingRecommendations = true
      this.errorRecommendations = null
      try {
        const response = await axios.get('http://localhost:8081/api/recommendations')
        this.recommendations = response.data.map((stock: any) => ({
          ticker: stock.ticker,
          company: stock.company,
          upside: this.calculateUpside(stock), // Usa this para acceder a otras acciones/getters si es necesario
          confidence: this.calculateConfidence(stock),
        }))
      } catch (error: any) {
        this.errorRecommendations = 'Error loading recommendations'
        console.error('Error fetching recommendations:', error)
      } finally {
        this.loadingRecommendations = false
      }
    },
    // Helper functions (puedes mantenerlas aquí o en un archivo de utilidad)
    calculateUpside(stock: any): number {
      const to = parseFloat(stock.target_to)
      const from = parseFloat(stock.target_from)
      return ((to - from) / from) * 100
    },
    calculateConfidence(stock: any): number {
      switch (stock.rating_to) {
        case 'Buy':
          return 5
        case 'Hold':
          return 3
        case 'Sell':
          return 1
        default:
          return 3
      }
    },
  },
})
