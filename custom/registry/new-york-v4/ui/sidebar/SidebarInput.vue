<script setup>
import { cn } from "@/lib/utils"
import { Input } from "@/registry/new-york-v4/ui/input"

const props = defineProps()
</script>

<template>
  <Input
    data-slot="sidebar-input"
    data-sidebar="input"
    :class="cn(
      'bg-background h-8 w-full shadow-none',
      props.class,
    )"
  >
    <slot />
  </Input>
</template>
