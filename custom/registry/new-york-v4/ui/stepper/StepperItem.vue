<script setup>
import { reactiveOmit } from "@vueuse/core"
import { StepperItem, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps({
  'class': {
    required: false
  }
})
const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <StepperItem
    v-slot="slotProps"
    v-bind="forwarded"
    :class="cn('flex items-center gap-2 group data-[disabled]:pointer-events-none', props.class)"
  >
    <slot v-bind="slotProps" />
  </StepperItem>
</template>
