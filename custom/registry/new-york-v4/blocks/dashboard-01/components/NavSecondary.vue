<script setup>
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/registry/new-york-v4/ui/sidebar"
defineProps({
  items: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem
          v-for="item in items"
          :key="item.title"
        >
          <SidebarMenuButton as-child>
            <a :href="item.url">
              <component :is="item.icon" v-if="item.icon" />
              {{ item.title }}
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
