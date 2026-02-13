<script setup>
import { cn } from "@/lib/utils"
const props = defineProps({
  'class': {
    required: false
  }
})
</script>

<template>
  <h3
    data-slot="card-title"
    :class="cn('leading-none font-semibold', props.class)"
  >
    <slot />
  </h3>
</template>
