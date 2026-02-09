<script setup>
import { Minus } from "lucide-vue-next"
import { Primitive, useForwardProps } from "reka-ui"

const props = defineProps()
const forwardedProps = useForwardProps(props)
</script>

<template>
  <Primitive
    data-slot="pin-input-separator"
    v-bind="forwardedProps"
  >
    <slot>
      <Minus />
    </slot>
  </Primitive>
</template>
