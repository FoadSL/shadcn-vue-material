<script setup lang="ts">
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/registry/new-york-v4/ui/tabs'

const { config } = useConfig()
</script>

<template>
  <Tabs
    v-model="config.installationType"
    class="relative mt-6 w-full"
  >
    <TabsList>
      <TabsTrigger value="cli">
        CLI
      </TabsTrigger>
      <TabsTrigger value="manual">
        Manual
      </TabsTrigger>
    </TabsList>
    <TabsContent value="cli">
      <slot name="cli" mdc-unwrap="p" />
    </TabsContent>
    <TabsContent value="manual">
      <slot name="manual" mdc-unwrap="p" />
    </TabsContent>
  </Tabs>
</template>
