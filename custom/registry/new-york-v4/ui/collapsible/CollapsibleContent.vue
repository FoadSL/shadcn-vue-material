<script setup>
import { CollapsibleContent } from "reka-ui"
const props = defineProps()
</script>

<template>
  <CollapsibleContent
    data-slot="collapsible-content"
    v-bind="props"
  >
    <slot />
  </CollapsibleContent>
</template>
