<script setup>
import { ContextMenuSub, useForwardPropsEmits } from "reka-ui"
const props = defineProps()
const emits = defineEmits()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <ContextMenuSub
    data-slot="context-menu-sub"
    v-bind="forwarded"
  >
    <slot />
  </ContextMenuSub>
</template>
