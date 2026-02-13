<script setup>
import { reactiveOmit } from "@vueuse/core"
import { Toggle, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"
import { toggleVariants } from "."
const props = defineProps({
  'class': {
    required: false
  },
  variant: {
    required: false,
    default: "default"
  },
  size: {
    required: false,
    default: "default"
  },
  disabled: {
    required: false,
    default: false
  }
})
const emits = defineEmits()
const delegatedProps = reactiveOmit(props, "class", "size", "variant")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <Toggle
    v-slot="slotProps"
    data-slot="toggle"
    v-bind="forwarded"
    :class="cn(toggleVariants({ variant, size }), props.class)"
  >
    <slot v-bind="slotProps" />
  </Toggle>
</template>
