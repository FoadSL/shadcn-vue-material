<script setup>
import { Minus } from "lucide-vue-next"
import { Primitive, useForwardProps } from "reka-ui"
const props = defineProps({
  as: {
    required: false
  },
  asChild: {
    type: Boolean,
    required: false
  }
})
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
