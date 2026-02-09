<script setup>
import { SplitterPanel, useForwardExpose, useForwardPropsEmits } from "reka-ui"

const props = defineProps()
const emits = defineEmits()

const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef } = useForwardExpose()
</script>

<template>
  <SplitterPanel
    :ref="forwardRef"
    v-slot="slotProps"
    data-slot="resizable-panel"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </SplitterPanel>
</template>
