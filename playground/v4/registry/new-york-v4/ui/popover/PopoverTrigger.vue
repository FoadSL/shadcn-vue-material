<script setup>
import { PopoverTrigger } from "reka-ui"
const props = defineProps()
</script>

<template>
  <PopoverTrigger
    data-slot="popover-trigger"
    v-bind="props"
  >
    <slot />
  </PopoverTrigger>
</template>
