<script setup>
import { PopoverAnchor } from "reka-ui"

const props = defineProps()
</script>

<template>
  <PopoverAnchor
    data-slot="popover-anchor"
    v-bind="props"
  >
    <slot />
  </PopoverAnchor>
</template>
