<script setup>
import { reactiveOmit } from "@vueuse/core"
import { PinInputRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps({
  class: {
    type: [String, Array, Object],
    required: false,
  },
  otp: {
    type: Boolean,
    default: true,
  },
  // All other PinInputRootProps are forwarded via v-bind / useForwardPropsEmits.
}), {
  otp: true,
})
const emits = defineEmits()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <PinInputRoot
    :otp="props.otp"
    data-slot="pin-input"
    v-bind="forwarded" :class="cn('flex items-center gap-2 has-disabled:opacity-50 disabled:cursor-not-allowed', props.class)"
  >
    <slot />
  </PinInputRoot>
</template>
