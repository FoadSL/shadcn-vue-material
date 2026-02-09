<script setup>
import { ContextMenuTrigger, useForwardProps } from "reka-ui"

const props = defineProps()

const forwardedProps = useForwardProps(props)
</script>

<template>
  <ContextMenuTrigger
    data-slot="context-menu-trigger"
    v-bind="forwardedProps"
  >
    <slot />
  </ContextMenuTrigger>
</template>
