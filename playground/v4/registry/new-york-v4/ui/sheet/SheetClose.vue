<script setup>
import { DialogClose } from "reka-ui"
const props = defineProps()
</script>

<template>
  <DialogClose
    data-slot="sheet-close"
    v-bind="props"
  >
    <slot />
  </DialogClose>
</template>
