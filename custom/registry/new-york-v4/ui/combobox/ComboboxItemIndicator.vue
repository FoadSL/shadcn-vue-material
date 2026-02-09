<script setup>
import { reactiveOmit } from "@vueuse/core"
import { ComboboxItemIndicator, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxItemIndicator
    data-slot="combobox-item-indicator"
    v-bind="forwarded"
    :class="cn('ml-auto', props.class)"
  >
    <slot />
  </ComboboxItemIndicator>
</template>
