<script setup>
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { sidebarMenuButtonVariants } from "."
const props = defineProps({
  variant: {
    required: false,
    default: "default"
  },
  size: {
    required: false,
    default: "default"
  },
  isActive: {
    type: Boolean,
    required: false
  },
  'class': {
    required: false
  },
  as: {
    required: false,
    default: "button"
  },
  asChild: {
    type: Boolean,
    required: false
  }
})
</script>

<template>
  <Primitive
    data-slot="sidebar-menu-button"
    data-sidebar="menu-button"
    :data-size="size"
    :data-active="isActive"
    :class="cn(sidebarMenuButtonVariants({ variant, size }), props.class)"
    :as="as"
    :as-child="asChild"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
