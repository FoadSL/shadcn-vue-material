<script setup>
import { CollapsibleTrigger } from "reka-ui"
const props = defineProps()
</script>

<template>
  <CollapsibleTrigger
    data-slot="collapsible-trigger"
    v-bind="props"
  >
    <slot />
  </CollapsibleTrigger>
</template>
