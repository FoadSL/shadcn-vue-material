<script setup>
import { cn } from "@/lib/utils"
const props = defineProps({
  'class': {
    required: false
  }
})
</script>

<template>
  <li
    data-slot="sidebar-menu-sub-item"
    data-sidebar="menu-sub-item"
    :class="cn('group/menu-sub-item relative', props.class)"
  >
    <slot />
  </li>
</template>
