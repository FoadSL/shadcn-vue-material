<script setup>
import { SelectGroup } from "reka-ui"
const props = defineProps()
</script>

<template>
  <SelectGroup
    data-slot="select-group"
    v-bind="props"
  >
    <slot />
  </SelectGroup>
</template>
