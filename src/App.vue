<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import InvestmentSimulator from './components/InvestmentSimulator.vue' // Importa el componente
import { useStocksStore } from './stores/stocks' // Importa tu store de stocks
import { storeToRefs } from 'pinia'
import PerformanceChart from './components/PerformanceChart.vue'

const stocksStore = useStocksStore()
const { topPicks, loading } = storeToRefs(stocksStore)
const selectedStock = ref<Stock | null>(null)
const isModalOpen = ref(false)

// Tipos de datos
interface Stock {
  ticker: string
  company: string
  brokerage?: string
  rating_to: string
  target_to: string
  target_from: string
  price: string
  change: number
  rating?: string // Marked as optional or added if missing
  volatility?: string
  action?: string
  time?: string
  upside?: number // Added the missing 'upside' property
  confidence?: number // Added the missing 'confidence' property
}

const resetFilters = () => {
  activeFilters.value = {
    rating: [],
    upside: [],
    volatility: [],
  }
  searchQuery.value = ''
  currentPage.value = 1
  showToast('Filtros reiniciados', 'info')
}

// // Data
const currentPage = ref(1)
const itemsPerPage = 10
const sortKey = ref<
  'ticker' | 'company' | 'price' | 'change' | 'rating_to' | 'volatility' | 'rating'
>('ticker') // Include 'rating' in valid keys
const sortDesc = ref(false)
const searchQuery = ref('')
const selectedStocks = ref<
  {
    ticker: string
    company: string
    price: string
    change: number
    rating: string
    volatility: string
    upside: number
  }[]
>([])
const toasts = ref<{ message: string; type: string }[]>([])
const tableColumns: { key: 'ticker' | 'company' | 'price' | 'change' | 'rating'; label: string }[] =
  [
    { key: 'ticker', label: 'Ticker' },
    { key: 'company', label: 'Company' },
    { key: 'price', label: 'Price' },
    { key: 'change', label: 'Δ 24h' },
    { key: 'rating', label: 'Rating' },
  ]
// // Filter options
const filterOptions = {
  rating: ['Buy', 'Hold', 'Sell'],
  upside: ['>10%', '5-10%', '<5%'],
  volatility: ['Alta', 'Media', 'Baja'],
}
// // Active filters
const activeFilters = ref<{
  rating: string[]
  upside: string[]
  volatility: string[]
}>({
  rating: [],
  upside: [],
  volatility: [],
})
// // Computed
const filteredStocks = computed(() => {
  let result = [...stocksStore.stocks]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (stock) =>
        stock.ticker.toLowerCase().includes(query) || stock.company.toLowerCase().includes(query),
    )
  }

  // Apply active filters
  if (activeFilters.value.rating.length > 0) {
    result = result.filter((stock) => activeFilters.value.rating.includes(stock.rating_to))
  }
  if (activeFilters.value.volatility.length > 0) {
    result = result.filter((stock) =>
      activeFilters.value.volatility.includes(stock.volatility ?? ''),
    )
  }
  if (activeFilters.value.upside.length > 0) {
    result = result.filter((stock) => {
      const change = stock.change
      if (activeFilters.value.upside.includes('>10%') && change > 10) return true
      if (activeFilters.value.upside.includes('5-10%') && change >= 5 && change <= 10) return true
      if (activeFilters.value.upside.includes('<5%') && change < 5) return true
      return false
    })
  }
  // Apply sorting
  result.sort((a, b) => {
    let aValue = a[sortKey.value as keyof typeof a] as string | number | undefined
    let bValue = b[sortKey.value as keyof typeof b] as string | number | undefined
    if (sortKey.value === 'price' || sortKey.value === 'change') {
      aValue = parseFloat((aValue ?? 0).toString())
      bValue = parseFloat((bValue ?? 0).toString())
    }
    if ((aValue ?? 0) < (bValue ?? 0)) return sortDesc.value ? 1 : -1
    if ((aValue ?? 0) > (bValue ?? 0)) return sortDesc.value ? -1 : 1
    return 0
  })
  return result
})

watch(
  [searchQuery, activeFilters],
  () => {
    currentPage.value = 1
  },
  { deep: true },
)

const totalPages = computed(() => Math.ceil(filteredStocks.value.length / itemsPerPage))

const paginatedStocks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredStocks.value.slice(start, end)
})

const isAllSelected = computed(() => {
  return (
    paginatedStocks.value.length > 0 &&
    paginatedStocks.value.every((stock) => isStockSelected(stock))
  )
})

// // Methods
const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const isFilterActive = (type: keyof typeof activeFilters.value, value: string) => {
  return activeFilters.value[type].includes(value)
}

const toggleFilter = (type: keyof typeof activeFilters.value, value: string) => {
  const index = activeFilters.value[type].indexOf(value)
  if (index === -1) {
    activeFilters.value[type].push(value)
    showToast(`Filter added: ${value}`, 'success')
  } else {
    activeFilters.value[type].splice(index, 1)
    showToast(`Filter removed: ${value}`, 'info')
  }
  // Reset to first page when filters change
  currentPage.value = 1
}

const getFilterCount = (type: string, value: string) => {
  // In a real app, this would calculate the actual count
  return Math.floor(Math.random() * 10) + 1
}

const sortTable = (key: 'ticker' | 'company' | 'price' | 'change' | 'rating' | 'volatility') => {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value
  } else {
    sortKey.value = key
    sortDesc.value = false
  }
  showToast(`Sorted by ${key}`, 'info')
}

const showStockDetail = (stock: Stock) => {
  selectedStock.value = stock
}

const isStockSelected = (stock: any) => {
  return selectedStocks.value.some((s: any) => s.ticker === stock.ticker)
}

const toggleStockSelection = (stock: any) => {
  if (isStockSelected(stock)) {
    selectedStocks.value = selectedStocks.value.filter((s: any) => s.ticker !== stock.ticker)
  } else {
    selectedStocks.value.push(stock)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedStocks.value = []
  } else {
    selectedStocks.value = paginatedStocks.value.map((stock) => ({
      ticker: stock.ticker,
      company: stock.company,
      price: stock.price,
      change: stock.change,
      rating: stock.rating_to,
      volatility: stock.volatility ?? 'Unknown',
      upside: stock.upside ?? 0,
    }))
  }
}

const showToast = (message: string, p0: string) => {
  const toast = { message, type: 'success' }
  toasts.value.push(toast)

  setTimeout(() => {
    const index = toasts.value.indexOf(toast)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }, 3000)
}

// Variable para controlar la visibilidad del dropdown de sugerencias
const showSuggestions = ref(false)
// Computed que genera la lista de sugerencias
const suggestions = computed(() => {
  if (!searchQuery.value) return []
  const query = searchQuery.value.toLowerCase()

  return stocksStore.stocks
    .filter(
      (stock) =>
        stock.ticker.toLowerCase().includes(query) || stock.company.toLowerCase().includes(query),
    )
    .slice(0, 5) // Limitar a las 5 primeras sugerencias
})

const selectSuggestion = (suggestion: { ticker: string; company: string }) => {
  searchQuery.value = suggestion.ticker
  showSuggestions.value = false
}

onMounted(async () => {
  await stocksStore.fetchRecommendations()
  await stocksStore.fetchStocks()
  showToast('Data loaded successfully', 'success')
})

const exportToCSV = () => {
  if (selectedStocks.value.length === 0) {
    showToast('No stocks selected for export', 'error')
    return
  }

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    selectedStocks.value
      .map((stock: any) => `${stock.ticker},${stock.company},${stock.price},${stock.change}`)
      .join('\n')

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', 'stocks.csv')
  document.body.appendChild(link)
  link.click()
}

const loadNextPage = async () => {
  if (stocksStore.pagination.hasMore) {
    await stocksStore.fetchStocks(stocksStore.pagination.nextOffset)
  }
}

const openModal = (stock: any) => {
  selectedStock.value = stock
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedStock.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Toast Notifications -->
    <div class="fixed right-4 top-4 z-50 flex flex-col gap-2">
      <div
        v-for="(toast, index) in toasts"
        :key="index"
        class="flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg transition-all duration-300"
        :class="toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'"
      >
        <span>{{ toast.message }}</span>
      </div>
    </div>

    <section class="relative h-screen overflow-hidden border-b-4 border-b-blue-950">
      <div class="absolute inset-0 bg-gradient-to-tl from-blue-400 to-blue-800"></div>

      <div class="relative flex h-full items-center justify-center">
        <div
          class="absolute inset-0 mask-gradient"
          style="
            background-image: url('https://images.unsplash.com/photo-1518186285589-2f7649de83e0?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-blend-mode: overlay;
            background-color: rgba(0, 0, 0, 0.5);
          "
        ></div>
        <div class="relative z-10 flex h-full items-center justify-center text-center">
          <div class="container mx-auto px-4 py-20 md:py-32 justify-center">
            <div class="max-w-3xl">
              <h1 class="mb-4 text-6xl font-bold tracking-tight md:text-8xl text-indigo-100">
                Perspectivas del mercado bursátil
              </h1>

              <p class="mb-8 text-2xl text-indigo-100 md:text-2xl lg:text-3xl">
                Datos en tiempo real y recomendaciones basadas en análisis expertos
              </p>
              <button
                @click="scrollToSection('dashboard')"
                class="cursor-pointer rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style="min-height: 48px"
              >
                Ver Stocks Destacados
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section id="dashboard" class="container mx-auto px-4 py-16">
      <div class="mb-8">
        <h2 class="mb-2 text-3xl font-bold text-gray-900">Stock Dashboard</h2>
        <p class="text-lg text-gray-600">
          Explora y filtra datos bursátiles en tiempo real de los principales corredores de bolsa
        </p>
      </div>

      <!-- Search Bar -->
      <div class="relative mb-6">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          @focus="showSuggestions = true"
          type="text"
          placeholder="Buscar AAPL, Tesla o Tecnología..."
          class="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-12 focus:border-b-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          style="min-height: 48px"
        />
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <kbd
            class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
            >/</kbd
          >
        </div>

        <!-- sugerencias -->
        <div
          v-if="showSuggestions.valueOf && suggestions.length > 0"
          class="absolute z-10 w-full rounded-b-lg border border-t-0 bg-white shadow-lg"
        >
          <ul>
            <li
              v-for="(suggestion, index) in suggestions"
              :key="index"
              @mousedown.prevent="selectSuggestion(suggestion)"
              class="cursor-pointer border-b border-gray-200 px-4 py-2 hover:bg-gray-100"
            >
              {{ suggestion.ticker }} - {{ suggestion.company }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Filter Chips -->
      <div class="mb-6 flex flex-wrap gap-2">
        <div class="mr-2 text-sm font-medium text-gray-700">Filters:</div>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="(options, filterType) in filterOptions"
            :key="filterType"
            class="flex flex-wrap gap-1"
          >
            <div
              v-for="option in options"
              :key="`${filterType}-${option}`"
              class="cursor-pointer rounded-full px-3 py-1 text-sm transition-all"
              :class="
                isFilterActive(filterType, option)
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-500'
                  : 'bg-gray-100 text-gray-800 border border-transparent hover:bg-gray-200'
              "
              @click="toggleFilter(filterType, option)"
            >
              {{ option }}
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Table -->
      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th
                  v-for="column in tableColumns"
                  :key="column.key"
                  class="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  @click="sortTable(column.key)"
                >
                  <div class="flex items-center">
                    {{ column.label }}
                    <span v-if="sortKey === column.key" class="ml-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        :class="{ 'rotate-180': !sortDesc }"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody v-if="!loading" class="divide-y divide-gray-200 bg-white">
              <tr v-if="filteredStocks.length === 0">
                <td colspan="7" class="px-4 py-6 text-center">
                  <div class="flex flex-col items-center justify-center space-y-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p class="text-lg font-medium text-gray-500">
                      No se encontraron resultados con los filtros aplicados, intenalo de nuevo
                    </p>
                    <button
                      @click="resetFilters"
                      class="mt-2 text-sm hover:cursor-pointer bg-blue-900 rounded-md px-4 py-2 text-white shadow-lg transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style="min-height: 48px"
                    >
                      Reiniciar filtros
                    </button>
                  </div>
                </td>
              </tr>

              <tr
                v-for="stock in paginatedStocks"
                :key="stock.ticker"
                class="group transition-colors hover:bg-gray-50"
                @click="showStockDetail(stock)"
              >
                <td class="w-10 px-4 py-3" @click.stop>
                  <input
                    type="checkbox"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    :checked="isStockSelected(stock)"
                    @change="toggleStockSelection(stock)"
                  />
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  <div class="flex items-center">
                    <div v-if="stock.rating_to === 'Buy'" class="mr-2 text-lg text-emerald-500">
                      ⭐
                    </div>
                    <div class="text-base font-medium text-gray-900">{{ stock.ticker }}</div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {{ stock.company }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-base font-medium text-gray-900">
                  ${{ stock.price }}
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  <span
                    class="inline-flex rounded-full px-2 py-1 text-sm font-semibold"
                    :class="
                      stock.change > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    "
                  >
                    {{ stock.change > 0 ? '+' : '' }}{{ stock.change }}%
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  <span
                    class="inline-flex rounded-full px-2 py-1 text-sm font-semibold"
                    :class="{
                      'bg-emerald-100 text-emerald-800': stock.rating_to === 'Buy',
                      'bg-amber-100 text-amber-800': stock.rating_to === 'Hold',
                      'bg-rose-100 text-rose-800': stock.rating_to === 'Sell',
                    }"
                  >
                    {{ stock.rating_to }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-right text-sm font-medium" @click.stop>
                  <button
                    class="bg-blue-900 shadow-lg transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer rounded-md px-4 py-1.5 text-white"
                    @click.stop="showStockDetail(stock)"
                  >
                    <i style="font-size: 20px" class="fa">&#xf06e;</i>
                  </button>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-for="i in 5" :key="i">
                <td class="px-4 py-4" colspan="7">
                  <div class="flex animate-pulse space-x-4">
                    <div class="h-4 w-1/4 rounded bg-gray-200"></div>
                    <div class="h-4 w-1/4 rounded bg-gray-200"></div>
                    <div class="h-4 w-1/4 rounded bg-gray-200"></div>
                    <div class="h-4 w-1/4 rounded bg-gray-200"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Paginacion -->
      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          Ves {{ paginatedStocks.length }} de {{ filteredStocks.length }} resultados
        </div>
        <div class="flex gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
          <button
            @click="loadNextPage"
            :disabled="!stocksStore.pagination.hasMore"
            class="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            traer más stocks
          </button>
          <button
            @click="exportToCSV"
            :disabled="selectedStocks.length === 0"
            class="hover:bg-amber-200 hover:cursor-pointer rounded-md border border-amber-700 px-3 py-1 text-sm disabled:opacity-50 bg-amber-300"
          >
            Exportar CSV
          </button>
        </div>
      </div>
    </section>

    <section class="bg-gray-100 py-16">
      <div class="container mx-auto px-4">
        <div class="mb-8">
          <h2 class="mb-2 text-3xl font-bold text-gray-900">Recomendaciones Top</h2>
          <p class="text-lg text-gray-600">
            Las selecciones de mayor confianza de nuestro algoritmo para el crecimiento potencial
          </p>
        </div>

        <!-- Top Picks -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(recommendation, index) in stocksStore.topPicks"
            :key="index"
            class="group overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:scale-105 hover:shadow-md hover:shadow-blue-500/50 hover:cursor-pointer"
            @click="openModal(recommendation)"
          >
            <div class="mb-4 flex items-start justify-between">
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ recommendation.ticker }}</h3>
                <p class="text-sm text-gray-600">{{ recommendation.company }}</p>
              </div>
              <div
                class="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800"
              >
                +{{ recommendation.upside }}%
              </div>
            </div>

            <div
              v-if="(recommendation.upside ?? 0) > 15"
              class="mb-4 inline-block rounded-md bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-800"
            >
              Top Pick
            </div>

            <div class="mb-2 flex items-center">
              <span class="mr-2 text-sm text-gray-600">Confianza:</span>
              <div class="flex">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="h-2 w-8 first:rounded-l-full last:rounded-r-full"
                  :class="i <= (recommendation.confidence ?? 0) ? 'bg-blue-500' : 'bg-gray-200'"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal -->
    <div
      v-if="isModalOpen"
      class="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-50"
    >
      <div class="w-11/12 max-w-xl rounded-lg bg-white p-6 shadow-lg">
        <h2 class="mb-4 text-2xl font-bold">
          {{ selectedStock?.ticker }} - {{ selectedStock?.company }}
        </h2>
        <p>Upside: {{ selectedStock?.upside }}%</p>
        <p>Confidence: {{ selectedStock?.confidence }}</p>

        <!-- Performance Chart -->
        <PerformanceChart timeRange="1Y" 
          :data="{
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
              {
                label: 'Performance',
                data: [65, 59, 80, 81, 56],
                fill: false,
                borderColor: '#4F46E5',
                tension: 0.1,
              },
            ],
          }"
          :options="{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
            },
          }"
          :height="200"
          :width="400"
        />

        <button @click="closeModal" class="mt-4 rounded-md bg-gray-200 px-4 py-2">Cerrar</button>
      </div>
    </div>

    <section class="bg-gray-50 py-16">
      <div class="container mx-auto px-4">
        <h2 class="mb-2 text-3xl font-bold text-gray-900">Simulador de Inversión</h2>
        <p class="text-lg text-gray-600 inset-0">
          Crea carteras ficticias, rastrea tu rendimiento comparado con índices y analiza la
          diversificación.
        </p>

        <div class="flex flex-col md:flex-row mt-2 align-middle justify-center">
          <div class="w-full md:w-1/2 mb-4 md:mb-0">
            <InvestmentSimulator :stocks-data="stocksStore.stocks" />
          </div>
          <div class="w-full md:w-1/2 px-2">
            <img
              src="https://images.pexels.com/photos/7095765/pexels-photo-7095765.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              alt="Imagen de inversion"
              class="w-full rounded-2xl opacity-90"
            />
            <p class="mt-4 text-sm text-gray-500 px-2">
              *Nota: Los resultados son simulaciones y no garantizan rendimientos futuros.
            </p>
          </div>
        </div>
      </div>
    </section>
    <footer
      class="text-white border-t-4 border-t-blue-950 bg-gradient-to-tl from-blue-900 to-blue-500 false py-8"
    >
      <div class="container mx-auto px-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold">Stock Tracker</h3>
            <p class="text-sm">© 2025 Todos los derechos reservados</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="h-3 w-3 rounded-full bg-green-400"></div>
              <span class="text-sm font-medium">API: Online</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-3 w-3 rounded-full bg-green-400"></div>
              <span class="text-sm font-medium">Database: Online</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
