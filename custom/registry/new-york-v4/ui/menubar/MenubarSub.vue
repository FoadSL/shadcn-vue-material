<script setup>
import { MenubarSub, useForwardPropsEmits } from "reka-ui"
const props = defineProps({
  defaultOpen: {
    type: Boolean,
    required: false
  },
  open: {
    type: Boolean,
    required: false
  }
})
const emits = defineEmits()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <MenubarSub
    v-slot="slotProps"
    data-slot="menubar-sub"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </MenubarSub>
</template>
