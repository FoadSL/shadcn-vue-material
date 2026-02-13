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
    data-slot="sidebar-content"
    data-sidebar="content"
    :class="cn('flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden', props.class)"
  >
    <slot />
  </div>
</template>
