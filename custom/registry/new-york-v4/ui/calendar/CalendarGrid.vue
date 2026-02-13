<script setup>
import { reactiveOmit } from "@vueuse/core"
import { CalendarGrid, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps({
  'class': {
    required: false
  }
})
const delegatedProps = reactiveOmit(props, "class")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <CalendarGrid
    data-slot="calendar-grid"
    :class="cn('w-full border-collapse space-x-1', props.class)"
    v-bind="forwardedProps"
  >
    <slot />
  </CalendarGrid>
</template>
