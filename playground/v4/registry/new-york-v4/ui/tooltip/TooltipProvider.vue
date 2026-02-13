<script setup>
import { TooltipProvider } from "reka-ui"
const props = defineProps({
  delayDuration: {
    required: false,
    default: 0
  }
})
</script>

<template>
  <TooltipProvider v-bind="props">
    <slot />
  </TooltipProvider>
</template>
