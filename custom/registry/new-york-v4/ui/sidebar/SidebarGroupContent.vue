<script setup>
import { cn } from "@/lib/utils"
const props = defineProps({
  'class': {
    required: false
  }
})
</script>

<template>
  <div
    data-slot="sidebar-group-content"
    data-sidebar="group-content"
    :class="cn('w-full text-sm', props.class)"
  >
    <slot />
  </div>
</template>
