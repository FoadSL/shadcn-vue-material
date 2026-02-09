# material-design-css

A **configurable** CSS library for Material Design 3 Tokens, with full
TailwindCSS v4 support.

this package allows you to **configure all tokens from outside** using CSS
custom properties.

## Features

- 🎨 **Configurable Colors** - Override all color tokens via CSS variables
- 📝 **Configurable Typography** - Set your own fonts and type scale
- 🔵 **Configurable Shape** - Customize border radius values
- ⚡ **Configurable Motion** - Adjust animation timing and easing
- 🌗 **Light/Dark Mode** - Automatic support with `.dark` class or system
  preference
- 🎯 **TailwindCSS v4** - Full integration with Tailwind's `@theme` directive
- 📦 **Tree-shakeable** - Import only what you need

## Installation

```bash
npm install @vira/material-design-css
# or
pnpm add @vira/material-design-css
```

## Quick Start

### For TailwindCSS v4

```css
@layer theme, md-config, md-resolver, base, components, utilities;

@import "tailwindcss";

/* Your configuration (MUST come before package import) */
:root {
  --md-config-typeface-brand: "Your Font", sans-serif;
  --md-config-color-primary-light: #your-color;
}

/* Import the package */
@import "@vira/material-design-css";
```

### For Plain CSS

```css
/* Your configuration (MUST come before package import) */
:root {
  --md-config-typeface-brand: "Your Font", sans-serif;
}

/* Import preset (includes color scheme) */
@import "@vira/material-design-css/preset.css";

/* Import utilities */
@import "@vira/material-design-css/color/bg-utilities.css";
@import "@vira/material-design-css/color/text-utilities.css";
```

## Configuration

### The Configuration System

This package uses a **three-tier configuration system**:

1. **`--md-config-*`** - Your project configuration (highest priority)
2. **`--md-sys-*`** - System tokens (resolved from config or defaults)
3. **`--color-*`, `--radius-*`, etc.** - Final values used by utilities

### Configurable Tokens

#### Typography

```css
:root {
  /* Font families */
  --md-config-typeface-brand: "Your Display Font", sans-serif;
  --md-config-typeface-plain: "Your Body Font", sans-serif;

  /* Font weights */
  --md-config-typeface-weight-regular: 400;
  --md-config-typeface-weight-medium: 500;
  --md-config-typeface-weight-bold: 700;

  /* Specific type scales */
  --md-config-typescale-display-large-size: 57px;
  --md-config-typescale-body-medium-size: 14px;
}
```

#### Colors

```css
:root {
  /* Primary Colors - Light Mode */
  --md-config-color-primary-light: #607cf0;
  --md-config-color-on-primary-light: #ffffff;
  --md-config-color-primary-container-light: #edebf5;

  /* Primary Colors - Dark Mode */
  --md-config-color-primary-dark: #7b95ff;
  --md-config-color-on-primary-dark: #ffffff;
  --md-config-color-primary-container-dark: #001050;

  /* Same pattern for secondary, tertiary, error, info, success, warning, surface... */
}
```

#### Shape

```css
:root {
  --md-config-shape-none: 0px;
  --md-config-shape-extra-small: 4px;
  --md-config-shape-small: 8px;
  --md-config-shape-medium: 12px;
  --md-config-shape-large: 16px;
  --md-config-shape-extra-large: 28px;
}
```

#### Motion

```css
:root {
  /* Easings */
  --md-config-motion-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --md-config-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);

  /* Durations */
  --md-config-motion-duration-short3: 150ms;
  --md-config-motion-duration-medium2: 300ms;
}
```

### Palette Colors

Override tonal palette values (0-100 scale):

```css
:root {
  --md-config-palette-primary-50: #607cf0;
  --md-config-palette-primary-90: #dfe5ff;
  /* ... */
}
```

## Module Imports

Import individual modules as needed:

```css
/* Configuration (always import first) */
@import "@vira/material-design-css/config";

/* Color tokens & utilities */
@import "@vira/material-design-css/color/tailwind-theme.css";
@import "@vira/material-design-css/color/bg-utilities.css";
@import "@vira/material-design-css/color/text-utilities.css";

/* Palette tokens & utilities */
@import "@vira/material-design-css/palette/tailwind-theme.css";
@import "@vira/material-design-css/palette/bg-utilities.css";
@import "@vira/material-design-css/palette/text-utilities.css";

/* Shape tokens & utilities */
@import "@vira/material-design-css/shape/tailwind-theme.css";
@import "@vira/material-design-css/shape/shape-utilities.css";

/* Typography tokens & utilities */
@import "@vira/material-design-css/typography/tailwind-theme.css";
@import "@vira/material-design-css/typography/tailwind-utilities.css";

/* Motion tokens & utilities */
@import "@vira/material-design-css/motion/tailwind-theme.css";
@import "@vira/material-design-css/motion/transition-utilities.css";
@import "@vira/material-design-css/motion/animation-utilities.css";
```

## Prebuild Color Schemes

Use ready-made color schemes:

```css
/* Apply blue theme */
@import "@vira/material-design-css/prebuild-color/blue.css";

/* Or green, pink, yellow, light-green */
@import "@vira/material-design-css/prebuild-color/green.css";
```

## Usage

### TailwindCSS Classes

```html
<!-- Colors -->
<button class="bg-primary text-on-primary">Primary Button</button>
<div class="bg-surface-container text-on-surface">Card</div>

<!-- Palette -->
<div class="bg-primary-90 text-primary-10">Tonal Palette</div>

<!-- Shape -->
<div class="rounded-medium">Medium Corners</div>
<div class="rounded-large">Large Corners</div>

<!-- Typography -->
<h1 class="display-large">Display Large</h1>
<p class="body-medium">Body text</p>

<!-- Motion -->
<button class="transition-button hover:bg-primary-container">
  Animated Button
</button>
```

### Standalone CSS Classes

```html
<!-- Shape utilities -->
<div class="shape-medium">Medium Corners</div>

<!-- Typography utilities -->
<h1 class="display-large">Heading</h1>
<p class="body-medium">Paragraph</p>
```

## Dark Mode

The package supports dark mode in multiple ways:

1. **Class-based**: Add `.dark` class to `<html>` or any parent element
2. **System preference**: Automatically detects `prefers-color-scheme: dark`
3. **Force light**: Add `.light` class to prevent system-based dark mode

```html
<!-- Force dark mode -->
<html class="dark">
  ...
</html>

<!-- Force light mode (ignores system preference) -->
<html class="light">
  ...
</html>
```

## Comparison with @sandlada/material-design-css

| Feature                                  | @sandlada/material-design-css | @vira/material-design-css |
| ---------------------------------------- | ----------------------------- | ------------------------- |
| TailwindCSS v4                           | ✅                            | ✅                        |
| Configurable Colors                      | ❌                            | ✅                        |
| Configurable Typography                  | ❌                            | ✅                        |
| Configurable Shape                       | ❌                            | ✅                        |
| Configurable Motion                      | ❌                            | ✅                        |
| Dark Mode                                | ✅                            | ✅                        |
| Prebuild Themes                          | ❌                            | ✅                        |
| Extended Colors (Info, Success, Warning) | ❌                            | ✅                        |

## License

MIT
