<script setup>
import { reactiveOmit } from "@vueuse/core"
import { PaginationListItem } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/registry/new-york-v4/ui/button"
const props = defineProps({
  size: {
    required: false,
    default: "icon"
  },
  'class': {
    required: false
  },
  isActive: {
    type: Boolean,
    required: false
  }
})
const delegatedProps = reactiveOmit(props, "class", "size", "isActive")
</script>

<template>
  <PaginationListItem
    data-slot="pagination-item"
    v-bind="delegatedProps"
    :class="cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
      }),
      props.class)"
  >
    <slot />
  </PaginationListItem>
</template>
