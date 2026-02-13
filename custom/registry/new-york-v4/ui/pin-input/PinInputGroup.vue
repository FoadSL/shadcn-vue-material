<script setup>
import { reactiveOmit } from "@vueuse/core"
import { Primitive, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps({
  as: {
    required: false
  },
  asChild: {
    type: Boolean,
    required: false
  },
  'class': {
    required: false
  }
})
const delegatedProps = reactiveOmit(props, "class")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <Primitive
    data-slot="pin-input-group"
    v-bind="forwardedProps"
    :class="cn('flex items-center', props.class)"
  >
    <slot />
  </Primitive>
</template>
