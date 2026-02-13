<script setup>
import { reactiveOmit } from "@vueuse/core"
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { badgeVariants } from "."
const props = defineProps({
  as: {
    required: false
  },
  asChild: {
    type: Boolean,
    required: false
  },
  variant: {
    required: false
  },
  'class': {
    required: false
  }
})
const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <Primitive
    data-slot="badge"
    :class="cn(badgeVariants({ variant }), props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </Primitive>
</template>
