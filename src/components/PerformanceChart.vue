<template>
  <div class="h-full w-full rounded-md bg-white p-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-medium text-gray-900">Rendimiento Histórico</h3>
      <div class="flex gap-2">
        <button
          @click="chartType = 'line'"
          :class="{
            'bg-blue-100 text-blue-700': chartType === 'line',
            'bg-gray-100 text-gray-700': chartType !== 'line',
          }"
          class="rounded-md px-3 py-1 text-xs transition-colors"
        >
          Línea
        </button>
        <button
          @click="chartType = 'bar'"
          :class="{
            'bg-blue-100 text-blue-700': chartType === 'bar',
            'bg-gray-100 text-gray-700': chartType !== 'bar',
          }"
          class="rounded-md px-3 py-1 text-xs transition-colors"
        >
          Barras
        </button>
      </div>
    </div>

    <div class="performance-chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

// Registra todos los componentes de Chart.js
Chart.register(...registerables)

const props = defineProps<{
  timeRange: string
}>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chartType = ref<'line' | 'bar'>('line')
let chartInstance: Chart | null = null

// Datos de prueba generados dinámicamente
const generateSampleData = () => {
  const data = []
  const now = new Date()
  let days = 30 // Por defecto 1 mes

  if (props.timeRange === '6M') days = 180
  else if (props.timeRange === '1Y') days = 365

  let baseValue = 100 + Math.random() * 50

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Simula fluctuaciones de precio más realistas
    const variation = (Math.random() - 0.5) * 10
    baseValue += variation
    baseValue = Math.max(50, Math.min(200, baseValue)) // Mantiene entre 50 y 200

    data.push({
      date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      value: parseFloat(baseValue.toFixed(2)),
    })
  }
  return data
}

const createChart = () => {
  if (!chartCanvas.value) return

  // Destruye el gráfico anterior si existe
  if (chartInstance) {
    chartInstance.destroy()
  }

  const data = generateSampleData()
  const backgroundColors = data.map((_, index) => {
    if (index === 0) return 'rgba(59, 130, 246, 0.5)'
    const current = data[index].value
    const previous = data[index - 1].value
    return current >= previous ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
  })

  chartInstance = new Chart(chartCanvas.value, {
    type: chartType.value,
    data: {
      labels: data.map((item) => item.date),
      datasets: [
        {
          label: 'Valor',
          data: data.map((item) => item.value),
          borderColor: '#3b82f6', // Azul
          backgroundColor: chartType.value === 'bar' ? backgroundColors : 'rgba(59, 130, 246, 0.1)',
          borderWidth: chartType.value === 'line' ? 2 : 0,
          tension: chartType.value === 'line' ? 0.4 : 0,
          fill: chartType.value === 'line',
          pointRadius: chartType.value === 'line' ? 0 : 3,
          pointHoverRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: $${context.raw}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
        y: {
          position: 'right',
          grid: {
            color: '#e5e7eb', // Gris claro
          },
          ticks: {
            callback: (value) => `$${value}`,
          },
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
    },
  })
}

// Observadores para recrear el gráfico cuando cambian los parámetros
watch([() => props.timeRange, chartType], () => {
  createChart()
})

onMounted(() => {
  createChart()
})
</script>

<style scoped>
.performance-chart-container {
  position: relative;
  height: 200px;
  width: 100%;
}
</style>
