<script setup>
import { CalendarGridHead } from "reka-ui"

const props = defineProps()
</script>

<template>
  <CalendarGridHead
    data-slot="calendar-grid-head"
    v-bind="props"
  >
    <slot />
  </CalendarGridHead>
</template>
