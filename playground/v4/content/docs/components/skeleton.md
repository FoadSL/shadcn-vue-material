---
title: Skeleton
description: Use to show a placeholder while content is loading.
component: true
---

::component-preview
---
name: SkeletonDemo
description: A skeleton component.
---
::

## Installation

::code-tabs
#cli
```bash
npx shadcn-vue@latest add skeleton
```
#manual
  ::steps
    ::step
    Copy and paste the [GitHub source code](https://github.com/unovue/shadcn-vue/tree/dev/apps/v4/registry/new-york-v4/ui/skeleton) into your project.
    ::

    ::step
    Update the import paths to match your project setup.
    ::
  ::
::
::

## Usage

```vue showLineNumbers
<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <Skeleton class="w-[100px] h-[20px] rounded-full" />
</template>
```
