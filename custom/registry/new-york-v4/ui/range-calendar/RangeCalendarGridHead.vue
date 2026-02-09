<script setup>
import { RangeCalendarGridHead } from "reka-ui"

const props = defineProps()
</script>

<template>
  <RangeCalendarGridHead
    data-slot="range-calendar-grid-head"
    v-bind="props"
  >
    <slot />
  </RangeCalendarGridHead>
</template>
