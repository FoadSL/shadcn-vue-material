<script setup>
import { MenubarGroup } from "reka-ui"
const props = defineProps()
</script>

<template>
  <MenubarGroup
    data-slot="menubar-group"
    v-bind="props"
  >
    <slot />
  </MenubarGroup>
</template>
