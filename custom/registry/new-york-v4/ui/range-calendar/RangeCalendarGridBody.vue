<script setup>
import { RangeCalendarGridBody } from "reka-ui"

const props = defineProps()
</script>

<template>
  <RangeCalendarGridBody
    data-slot="range-calendar-grid-body"
    v-bind="props"
  >
    <slot />
  </RangeCalendarGridBody>
</template>
