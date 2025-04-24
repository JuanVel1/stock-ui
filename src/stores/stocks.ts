import { defineStore } from 'pinia'
import axios from 'axios'

const db_url = import.meta.env.VITE_DB_URL || ''  

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
  pagination: {
    currentOffset: number
    perPage: number
    total: number
    hasMore: boolean
    nextOffset: number
  }
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
    pagination: {
      currentOffset: 0,
      perPage: 50,
      total: 0,
      hasMore: false,
      nextOffset: 0
    },
    recommendations: [],
    loadingRecommendations: false,
    errorRecommendations: null,
  }),
  getters: {
    availableStocks: (state) => state.stocks,
    topPicks: (state) => state.recommendations,
  },
  actions: {
    async fetchStocks(offset?: number) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${db_url}stocks`, {
          params: {
            next: offset || 0,
            limit: 50
          }
        })
        
        // Convertir los nuevos stocks
        const newStocks = response.data.data.map((stock: any) => ({ 
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

        // Acumular los stocks en lugar de reemplazarlos
        if (offset && offset > 0) {
          this.stocks = [...this.stocks, ...newStocks]
        } else {
          this.stocks = newStocks
        }

        this.pagination = {
          currentOffset: response.data.pagination.current_offset,
          perPage: response.data.pagination.per_page,
          total: response.data.pagination.total,
          hasMore: response.data.pagination.has_more,
          nextOffset: response.data.pagination.next_offset
        }
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
        const response = await axios.get(db_url + 'recommendations')
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
