<script setup>
import { reactiveOmit } from "@vueuse/core"
import { SplitterGroup, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps({
  'class': {
    required: false
  }
})
const emits = defineEmits()
const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SplitterGroup
    v-slot="slotProps"
    data-slot="resizable-panel-group"
    v-bind="forwarded"
    :class="cn('flex h-full w-full data-[orientation=vertical]:flex-col', props.class)"
  >
    <slot v-bind="slotProps" />
  </SplitterGroup>
</template>
