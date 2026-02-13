<script setup>
import { cn } from "@/lib/utils"
const props = defineProps({
  'class': {
    required: false
  }
})
</script>

<template>
  <tr
    data-slot="table-row"
    :class="cn('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', props.class)"
  >
    <slot />
  </tr>
</template>
