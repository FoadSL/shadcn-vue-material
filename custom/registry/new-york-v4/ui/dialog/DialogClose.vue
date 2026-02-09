<script setup>
import { DialogClose } from "reka-ui"

const props = defineProps()
</script>

<template>
  <DialogClose
    data-slot="dialog-close"
    v-bind="props"
  >
    <slot />
  </DialogClose>
</template>
