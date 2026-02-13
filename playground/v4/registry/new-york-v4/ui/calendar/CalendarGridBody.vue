<script setup>
import { CalendarGridBody } from "reka-ui"
const props = defineProps()
</script>

<template>
  <CalendarGridBody
    data-slot="calendar-grid-body"
    v-bind="props"
  >
    <slot />
  </CalendarGridBody>
</template>
