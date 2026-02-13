<script setup>
import { AlertDialogRoot, useForwardPropsEmits } from "reka-ui"
const props = defineProps()
const emits = defineEmits()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <AlertDialogRoot v-slot="slotProps" data-slot="alert-dialog" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </AlertDialogRoot>
</template>
