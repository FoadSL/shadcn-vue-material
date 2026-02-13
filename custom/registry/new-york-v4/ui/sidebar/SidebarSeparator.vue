<script setup>
import { cn } from "@/lib/utils"
import { Separator } from "@/registry/new-york-v4/ui/separator"
const props = defineProps({
  'class': {
    required: false
  }
})
</script>

<template>
  <Separator
    data-slot="sidebar-separator"
    data-sidebar="separator"
    :class="cn('bg-sidebar-border mx-2 w-auto', props.class)"
  >
    <slot />
  </Separator>
</template>
