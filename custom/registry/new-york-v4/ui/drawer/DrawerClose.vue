<script setup>
import { DrawerClose } from "vaul-vue"

const props = defineProps()
</script>

<template>
  <DrawerClose
    data-slot="drawer-close"
    v-bind="props"
  >
    <slot />
  </DrawerClose>
</template>
