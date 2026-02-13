<script setup>
import { reactiveOmit } from "@vueuse/core"
import { ToggleGroupRoot, useForwardPropsEmits } from "reka-ui"
import { provide } from "vue"
import { cn } from "@/lib/utils"
const props = defineProps({
  'class': {
    required: false
  },
  variant: {
    required: false
  },
  size: {
    required: false
  },
  spacing: {
    type: Number,
    required: false,
    default: 0
  }
})
const emits = defineEmits()
provide("toggleGroup", {
  variant: props.variant,
  size: props.size,
  spacing: props.spacing
})
const delegatedProps = reactiveOmit(props, "class", "size", "variant")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ToggleGroupRoot
    v-slot="slotProps"
    data-slot="toggle-group"
    :data-size="size"
    :data-variant="variant"
    :data-spacing="spacing"
    :style="{
      '--gap': spacing,
    }"
    v-bind="forwarded"
    :class="cn('group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=default]:data-[variant=outline]:shadow-xs', props.class)"
  >
    <slot v-bind="slotProps" />
  </ToggleGroupRoot>
</template>
