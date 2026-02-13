<script setup>
import { DialogTrigger } from "reka-ui"
const props = defineProps()
</script>

<template>
  <DialogTrigger
    data-slot="sheet-trigger"
    v-bind="props"
  >
    <slot />
  </DialogTrigger>
</template>
