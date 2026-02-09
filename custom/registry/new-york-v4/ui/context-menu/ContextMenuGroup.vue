<script setup>
import { ContextMenuGroup } from "reka-ui"

const props = defineProps()
</script>

<template>
  <ContextMenuGroup
    data-slot="context-menu-group"
    v-bind="props"
  >
    <slot />
  </ContextMenuGroup>
</template>
