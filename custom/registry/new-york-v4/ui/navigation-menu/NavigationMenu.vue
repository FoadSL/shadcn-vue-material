<script setup>
import { reactiveOmit } from "@vueuse/core"
import { NavigationMenuRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"
import NavigationMenuViewport from "./NavigationMenuViewport.vue"
const props = defineProps({
  'class': {
    required: false
  },
  viewport: {
    type: Boolean,
    required: false,
    default: true
  }
})
const emits = defineEmits()
const delegatedProps = reactiveOmit(props, "class", "viewport")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <NavigationMenuRoot
    v-slot="slotProps"
    data-slot="navigation-menu"
    :data-viewport="viewport"
    v-bind="forwarded"
    :class="cn('group/navigation-menu relative flex max-w-max flex-1 items-center justify-center', props.class)"
  >
    <slot v-bind="slotProps" />
    <NavigationMenuViewport v-if="viewport" />
  </NavigationMenuRoot>
</template>
