<script setup>
import { reactiveOmit } from "@vueuse/core"
import { StepperDescription, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <StepperDescription v-slot="slotProps" v-bind="forwarded" :class="cn('text-xs text-muted-foreground', props.class)">
    <slot v-bind="slotProps" />
  </StepperDescription>
</template>
