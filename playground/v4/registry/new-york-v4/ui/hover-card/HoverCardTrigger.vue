<script setup>
import { HoverCardTrigger } from "reka-ui"
const props = defineProps()
</script>

<template>
  <HoverCardTrigger
    data-slot="hover-card-trigger"
    v-bind="props"
  >
    <slot />
  </HoverCardTrigger>
</template>
