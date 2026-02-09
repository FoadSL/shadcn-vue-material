<script setup>
import { TooltipProvider } from "reka-ui"

const props = withDefaults(defineProps(), {
  delayDuration: 0,
})
</script>

<template>
  <TooltipProvider v-bind="props">
    <slot />
  </TooltipProvider>
</template>
