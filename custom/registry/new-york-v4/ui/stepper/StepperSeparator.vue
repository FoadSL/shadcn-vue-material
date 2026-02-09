<script setup>
import { reactiveOmit } from "@vueuse/core"
import { StepperSeparator, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <StepperSeparator
    v-bind="forwarded"
    :class="cn(
      'bg-muted',
      // Disabled
      'group-data-[disabled]:bg-muted group-data-[disabled]:opacity-50',
      // Completed
      'group-data-[state=completed]:bg-accent',
      props.class,
    )"
  />
</template>
