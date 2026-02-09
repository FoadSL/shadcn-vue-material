<script setup>
import { DropdownMenuGroup } from "reka-ui"

const props = defineProps()
</script>

<template>
  <DropdownMenuGroup
    data-slot="dropdown-menu-group"
    v-bind="props"
  >
    <slot />
  </DropdownMenuGroup>
</template>
