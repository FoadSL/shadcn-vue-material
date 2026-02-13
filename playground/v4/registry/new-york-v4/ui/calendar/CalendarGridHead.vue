<script setup>
import { CalendarGridHead } from "reka-ui"
const props = defineProps({
  'class': {
    required: false
  }
})
</script>

<template>
  <CalendarGridHead
    data-slot="calendar-grid-head"
    v-bind="props"
  >
    <slot />
  </CalendarGridHead>
</template>
