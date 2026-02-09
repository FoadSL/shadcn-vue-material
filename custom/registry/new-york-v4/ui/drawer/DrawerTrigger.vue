<script setup>
import { DrawerTrigger } from "vaul-vue"

const props = defineProps()
</script>

<template>
  <DrawerTrigger
    data-slot="drawer-trigger"
    v-bind="props"
  >
    <slot />
  </DrawerTrigger>
</template>
