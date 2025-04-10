<script setup lang="ts">
import { ref, computed} from 'vue'

// Interfaces
interface Stock {
  ticker: string
  company: string
  price: string
}

interface PortfolioItem {
  stock: Stock
  quantity: number
}

const props = defineProps({
  stocksData: {
    type: Array<Stock>,
    required: true,
  },
})

const availableStocks = computed(() => props.stocksData)
const virtualBalance = ref(10000)
const portfolio = ref<PortfolioItem[]>([])
const selectedStock = ref<Stock | null>(null)
const quantity = ref<number | null>(null)
const selectedBenchmark = ref<string | null>(null)
const comparisonResults = ref(false)
const benchmarkReturn = ref(0)
const diversificationAnalysis = ref<{ isDiversified: boolean } | null>(null)

const addStockToPortfolio = () => {
  if (selectedStock.value && quantity.value && quantity.value > 0) {
    const cost = quantity.value * parseFloat(selectedStock.value.price)
    if (cost <= virtualBalance.value) {
      portfolio.value.push({ stock: selectedStock.value, quantity: quantity.value })
      virtualBalance.value -= cost
      selectedStock.value = null
      quantity.value = null
    } else {
      alert('Saldo insuficiente.')
    }
  }
}

const removeStockFromPortfolio = (index: number) => {
  const itemToRemove = portfolio.value[index]
  virtualBalance.value += itemToRemove.quantity * parseFloat(itemToRemove.stock.price)
  portfolio.value.splice(index, 1)
}

const portfolioValue = computed(() => {
  return portfolio.value.reduce((total, item) => {
    return total + item.quantity * parseFloat(item.stock.price)
  }, 0)
})

const initialInvestment = 10000 // El saldo inicial ficticio

const portfolioReturn = computed(() => {
  if (portfolio.value.length === 0) return 0
  const currentValue = initialInvestment - virtualBalance.value + portfolioValue.value
  return ((currentValue - initialInvestment) / initialInvestment) * 100
})

const compareWithIndex = () => {
  if (selectedBenchmark.value && portfolio.value.length > 0) {
    comparisonResults.value = true
    // Datos históricos del índice seleccionado
    // y calcular el rendimiento durante un período similar al de tu simulación.
    // Para este ejemplo, usaremos valores estáticos.
    switch (selectedBenchmark.value) {
      case 'SP500':
        benchmarkReturn.value = 12.5 // Ejemplo de rendimiento del S&P 500
        break
      case 'NASDAQ':
        benchmarkReturn.value = 18.0 // Ejemplo de rendimiento del NASDAQ
        break
      case 'DOW':
        benchmarkReturn.value = 9.0 // Ejemplo de rendimiento del Dow Jones
        break
      default:
        benchmarkReturn.value = 0
        break
    }
  }
}

const analyzeDiversification = () => {
  if (portfolio.value.length > 0) {
    // lógica para analizar la diversificación.
    // Para este ejemplo, consideraremos que si hay más de 3 stocks diferentes, está diversificada.
    const uniqueTickers = [...new Set(portfolio.value.map((item) => item.stock.ticker))]
    diversificationAnalysis.value = { isDiversified: uniqueTickers.length > 3 }
  }
}
</script>
<template>
  <div class="investment-simulator p-6 bg-zinc-50 rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4">Crea tu Cartera Virtual</h2>

    <div class="mb-4">
      <p class="text-gray-600 mb-2">Saldo disponible: ${{ virtualBalance.toFixed(2) }}</p>
      <div class="flex items-center space-x-2">
        <select v-model="selectedStock" class="border rounded px-2 py-1 border-blue-500 flex-grow">
          <option value="" disabled>Seleccionar Stock</option>
          <option v-for="stock in availableStocks" :key="stock.ticker" :value="stock">
            {{ stock.ticker }} - {{ stock.company }} (${{ stock.price }})
          </option>
        </select>
        <input
          v-model.number="quantity"
          type="number"
          placeholder="Cantidad"
          class="border border-blue-500 rounded px-2 py-1 w-24"
        />
        <button
          @click="addStockToPortfolio"
          :disabled="!selectedStock || !quantity || quantity <= 0"
          class="cursor-pointer rounded-lg bg-blue-900 px-3 py-1 font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Añadir
        </button>
      </div>
      <ul v-if="portfolio.length > 0" class="mt-4 border-t pt-4">
        <li
          v-for="(item, index) in portfolio"
          :key="index"
          class="flex justify-between items-center py-2"
        >
          <div>
            {{ item.stock.ticker }} - {{ item.stock.company }}
            <span class="text-gray-600 text-sm">({{ item.quantity }} acciones)</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm"
              >Costo: ${{ (item.quantity * parseFloat(item.stock.price)).toFixed(2) }}</span
            >
            <button
              @click="removeStockFromPortfolio(index)"
              class="cursor-pointer rounded-md bg-red-700 px-2 py-1 font-semibold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-xs"
            >
              Eliminar
            </button>
          </div>
        </li>
      </ul>
      <p v-else class="text-gray-500 mt-2 text-sm">Tu cartera virtual está vacía.</p>
    </div>

    <div class="mb-4 border-t pt-4">
      <h3 class="text-xl font-semibold mb-2">Rendimiento vs. Índices</h3>
      <div class="flex items-center space-x-2 mb-2">
        <select
          v-model="selectedBenchmark"
          class="border rounded px-2 py-1 border-blue-500 flex-grow text-sm"
        >
          <option value="" disabled>Seleccionar Índice</option>
          <option value="SP500">S&P 500</option>
          <option value="NASDAQ">NASDAQ Composite</option>
          <option value="DOW">Dow Jones Industrial Average</option>
        </select>
        <button
          @click="compareWithIndex"
          :disabled="!selectedBenchmark || portfolio.length === 0"
          class="cursor-pointer rounded-lg bg-green-900 px-3 py-1 font-semibold text-white shadow-sm transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
        >
          Comparar
        </button>
      </div>
      <div v-if="comparisonResults" class="mt-2 text-sm">
        <p>
          Rendimiento de tu cartera (estimado):
          <span class="font-semibold">{{ portfolioReturn.toFixed(2) }}%</span>
        </p>
        <p>
          Rendimiento del {{ selectedBenchmark }}:
          <span class="font-semibold">{{ benchmarkReturn.toFixed(2) }}%</span>
        </p>
        <p v-if="portfolioReturn > benchmarkReturn" class="text-green-600">
          Tu cartera supera al índice.
        </p>
        <p v-else-if="portfolioReturn < benchmarkReturn" class="text-red-600">
          Tu cartera está por debajo del índice.
        </p>
        <p v-else class="text-gray-600">Tu cartera tiene un rendimiento similar al índice.</p>
      </div>
      <p v-else-if="portfolio.length > 0" class="text-gray-500 mt-2 text-sm">
        Selecciona un índice para comparar el rendimiento.
      </p>
    </div>

    <div class="border-t pt-4">
      <h3 class="text-xl font-semibold mb-2">Análisis de Diversificación</h3>
      <button
        @click="analyzeDiversification"
        :disabled="portfolio.length === 0"
        class="hover:bg-amber-200 cursor-pointer rounded-md border border-amber-700 px-3 py-1 disabled:opacity-50 bg-amber-300 text-sm"
      >
        Analizar
      </button>
      <div v-if="diversificationAnalysis" class="mt-2 text-sm">
        <p v-if="diversificationAnalysis.isDiversified" class="text-green-600">
          Tu cartera parece estar bien diversificada.
        </p>
        <p v-else class="text-yellow-600">
          Advertencia: Tu cartera podría no estar suficientemente diversificada. Considera invertir
          en diferentes sectores o tipos de activos.
        </p>
      </div>
      <p v-else-if="portfolio.length > 0" class="text-gray-500 mt-2 text-sm">
        Añade acciones a tu cartera para analizar la diversificación.
      </p>
    </div>
  </div>
</template>

<style scoped>
.investment-simulator {
  max-width: 600px;
  margin: auto;
}

.investment-simulator h3 {
  color: #333;
}

.investment-simulator p {
  color: #666;
}

.investment-simulator button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
