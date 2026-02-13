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
    data-slot="alert-dialog-footer"
    :class="
      cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
