<script setup>
import { cn } from "@/lib/utils"
import { alertVariants } from "."
const props = defineProps({
  'class': {
    required: false
  },
  variant: {
    required: false
  }
})
</script>

<template>
  <div
    data-slot="alert"
    :class="cn(alertVariants({ variant }), props.class)"
    role="alert"
  >
    <slot />
  </div>
</template>
