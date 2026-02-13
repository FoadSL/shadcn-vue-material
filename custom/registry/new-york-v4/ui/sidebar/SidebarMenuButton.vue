<script setup>
import { reactiveOmit } from "@vueuse/core"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/new-york-v4/ui/tooltip"
import SidebarMenuButtonChild from "./SidebarMenuButtonChild.vue"
import { useSidebar } from "./utils"
defineOptions({
  inheritAttrs: false
})
const props = defineProps({
  tooltip: {
    type: String,
    required: false
  },
  as: {
    required: false,
    default: "button"
  },
  variant: {
    required: false,
    default: "default"
  },
  size: {
    required: false,
    default: "default"
  }
})
const { isMobile, state } = useSidebar()
const delegatedProps = reactiveOmit(props, "tooltip")
</script>

<template>
  <SidebarMenuButtonChild v-if="!tooltip" v-bind="{ ...delegatedProps, ...$attrs }">
    <slot />
  </SidebarMenuButtonChild>

  <Tooltip v-else>
    <TooltipTrigger as-child>
      <SidebarMenuButtonChild v-bind="{ ...delegatedProps, ...$attrs }">
        <slot />
      </SidebarMenuButtonChild>
    </TooltipTrigger>
    <TooltipContent
      side="right"
      align="center"
      :hidden="state !== 'collapsed' || isMobile"
    >
      <template v-if="typeof tooltip === 'string'">
        {{ tooltip }}
      </template>
      <component :is="tooltip" v-else />
    </TooltipContent>
  </Tooltip>
</template>
