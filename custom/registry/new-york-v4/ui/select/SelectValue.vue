<script setup>
import { SelectValue } from "reka-ui"

const props = defineProps()
</script>

<template>
  <SelectValue
    data-slot="select-value"
    v-bind="props"
  >
    <slot />
  </SelectValue>
</template>
