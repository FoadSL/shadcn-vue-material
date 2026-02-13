<script setup>
import { TooltipTrigger } from "reka-ui"
const props = defineProps()
</script>

<template>
  <TooltipTrigger
    data-slot="tooltip-trigger"
    v-bind="props"
  >
    <slot />
  </TooltipTrigger>
</template>
