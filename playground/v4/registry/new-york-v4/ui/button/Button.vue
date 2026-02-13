<script setup>
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from "."
const props = defineProps({
  variant: {
    required: false
  },
  size: {
    required: false
  },
  'class': {
    required: false
  },
  as: {
    required: false,
    default: "button"
  },
  asChild: {
    type: Boolean,
    required: false
  }
})
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
