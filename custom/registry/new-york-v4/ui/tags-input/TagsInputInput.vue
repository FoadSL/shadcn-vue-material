<script setup>
import { reactiveOmit } from "@vueuse/core"
import { TagsInputInput, useForwardProps } from "reka-ui"
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
  <TagsInputInput v-bind="forwardedProps" :class="cn('text-sm min-h-5 focus:outline-none flex-1 bg-transparent px-1', props.class)" />
</template>
