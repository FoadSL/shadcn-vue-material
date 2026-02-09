<script setup>
import { ContextMenuPortal } from "reka-ui"

const props = defineProps()
</script>

<template>
  <ContextMenuPortal
    data-slot="context-menu-portal"
    v-bind="props"
  >
    <slot />
  </ContextMenuPortal>
</template>
