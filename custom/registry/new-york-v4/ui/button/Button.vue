<script setup>
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from "."

const props = defineProps({
  as: {
    type: String,
    default: "button",
  },
  variant: {
    type: String,
    required: false,
  },
  size: {
    type: String,
    required: false,
  },
  class: {
    type: [String, Array, Object],
    required: false,
  },
  asChild: {
    type: Boolean,
    required: false,
  },
})
</script>

<template>
  <Primitive
    data-slot="button"
    :as="props.as"
    :as-child="props.asChild"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
