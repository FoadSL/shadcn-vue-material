<script setup>
import { DropdownMenuRoot, useForwardPropsEmits } from "reka-ui"
const props = defineProps()
const emits = defineEmits()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DropdownMenuRoot
    v-slot="slotProps"
    data-slot="dropdown-menu"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </DropdownMenuRoot>
</template>
