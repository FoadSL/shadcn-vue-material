<script setup>
import { cn } from "@/lib/utils"
const props = defineProps({
  'class': {
    required: false
  }
})
</script>

<template>
  <div :class="cn('relative [&>[data-slot=input]]:has-[[data-slot=increment]]:pr-5 [&>[data-slot=input]]:has-[[data-slot=decrement]]:pl-5', props.class)">
    <slot />
  </div>
</template>
