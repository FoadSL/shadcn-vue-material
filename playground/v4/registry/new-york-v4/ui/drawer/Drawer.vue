<script setup>
import { useForwardPropsEmits } from "reka-ui"
import { DrawerRoot } from "vaul-vue"
const props = defineProps({
  shouldScaleBackground: {
    required: false,
    default: true
  }
})
const emits = defineEmits()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DrawerRoot
    v-slot="slotProps"
    data-slot="drawer"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </DrawerRoot>
</template>
