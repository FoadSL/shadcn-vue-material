---
title: Collapsible
description: An interactive component which expands/collapses a panel.
component: true
links:
  doc: https://reka-ui.com/docs/components/collapsible
  api: https://reka-ui.com/docs/components/collapsible#api-reference
---

::component-preview
---
name: CollapsibleDemo
description: A collapsible component.
---
::

## Installation

::code-tabs
#cli
```bash
npx shadcn-vue@latest add collapsible
```
#manual
  ::steps
    ::step
    Install the following dependencies:
    ::

    ```bash
    npm install reka-ui
    ```

    ::step
    Copy and paste the [GitHub source code](https://github.com/unovue/shadcn-vue/tree/dev/apps/v4/registry/new-york-v4/ui/collapsible) into your project.
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
</script>

<template>
  <Collapsible>
    <CollapsibleTrigger>Can I use this in my project?</CollapsibleTrigger>
    <CollapsibleContent>
      Yes. Free to use for personal and commercial projects. No attribution
      required.
    </CollapsibleContent>
  </Collapsible>
</template>
```
