<script setup>
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps({
  as: {
    required: false,
    default: "a"
  },
  asChild: {
    type: Boolean,
    required: false
  },
  'class': {
    required: false
  }
})
</script>

<template>
  <Primitive
    data-slot="breadcrumb-link"
    :as="as"
    :as-child="asChild"
    :class="cn('hover:text-foreground transition-colors', props.class)"
  >
    <slot />
  </Primitive>
</template>
