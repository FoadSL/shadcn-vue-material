<script setup>
import { AlertDialogTrigger } from "reka-ui"

const props = defineProps()
</script>

<template>
  <AlertDialogTrigger data-slot="alert-dialog-trigger" v-bind="props">
    <slot />
  </AlertDialogTrigger>
</template>
