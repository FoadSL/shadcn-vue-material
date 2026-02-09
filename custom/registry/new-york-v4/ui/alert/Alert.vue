<script setup>
import { cn } from "@/lib/utils"
import { alertVariants } from "."

const props = defineProps({
  class: {
    type: [String, Array, Object],
    required: false,
  },
  variant: {
    type: String,
    required: false,
  },
})
</script>

<template>
  <div
    data-slot="alert"
    :class="cn(alertVariants({ variant: props.variant }), props.class)"
    role="alert"
  >
    <slot />
  </div>
</template>
