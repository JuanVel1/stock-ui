<script setup lang="ts">
import { defineProps } from 'vue'
import type { Stock } from '@/types'

defineProps<{
  stocks: Stock[]
  loading: boolean
}>()
</script>

<template>
  <!-- Tu código de tabla actual -->
</template>