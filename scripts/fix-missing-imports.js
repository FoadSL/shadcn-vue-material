#!/usr/bin/env node

/**
 * Script to fix missing imports in converted Vue components
 * Specifically adds missing `cn` imports and component imports from reka-ui
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@vue/compiler-sfc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const customRegistryRoot = path.resolve(__dirname, "..", "custom", "registry", "new-york-v4", "ui");

// Components that need to be imported from reka-ui (component name -> import name)
const rekaUiComponents = new Map([
  ["Separator", "Separator"],
  ["ScrollAreaRoot", "ScrollAreaRoot"],
  ["ScrollAreaViewport", "ScrollAreaViewport"],
  ["ScrollAreaCorner", "ScrollAreaCorner"],
  ["DialogRoot", "DialogRoot"],
  ["DialogDescription", "DialogDescription"],
  ["AlertDialogTitle", "AlertDialogTitle"],
  ["AlertDialogDescription", "AlertDialogDescription"],
  // Add more as needed
]);

function fixComponentImports(filePath) {
  const source = fs.readFileSync(filePath, "utf-8");
  
  // Check if file uses cn() but doesn't import it
  const usesCn = /cn\(/.test(source);
  const hasCnImport = /import.*cn.*from/.test(source);
  
  // Parse Vue SFC
  let parsed;
  try {
    parsed = parse(source);
  } catch (err) {
    console.warn(`Failed to parse ${filePath}:`, err.message);
    return false;
  }
  
  const scriptBlock = parsed.descriptor.scriptSetup || parsed.descriptor.script;
  if (!scriptBlock) return false;
  
  const scriptContent = scriptBlock.content;
  
  // Check what components are used in template
  const templateContent = parsed.descriptor.template?.content || "";
  const usedComponents = new Set();
  
  // Extract component names from template (simple regex - might need refinement)
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = componentRegex.exec(templateContent)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Check what needs to be imported
  const needsCn = usesCn && !hasCnImport;
  const needsRekaUi = [];
  
  for (const [componentName, importName] of rekaUiComponents.entries()) {
    if (usedComponents.has(componentName)) {
      const hasImport = new RegExp(`import.*${importName}.*from.*reka-ui`).test(scriptContent);
      if (!hasImport) {
        needsRekaUi.push({ componentName, importName });
      }
    }
  }
  
  // If nothing needs fixing, return
  if (!needsCn && needsRekaUi.length === 0) {
    return false;
  }
  
  // Build new imports
  const newImports = [];
  
  if (needsCn) {
    newImports.push(`import { cn } from "@/lib/utils";`);
  }
  
  if (needsRekaUi.length > 0) {
    const importNames = needsRekaUi.map(({ importName }) => importName).join(", ");
    newImports.push(`import { ${importNames} } from "reka-ui";`);
  }
  
  // Find insertion point (after existing imports, before first non-import line)
  const importLines = [];
  const otherLines = [];
  let inImports = true;
  
  const lines = scriptContent.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (inImports && (trimmed.startsWith("import ") || trimmed === "")) {
      importLines.push(line);
    } else {
      inImports = false;
      otherLines.push(line);
    }
  }
  
  // Add new imports
  const updatedScript = [
    ...importLines,
    ...(importLines.length > 0 && importLines[importLines.length - 1].trim() !== "" ? [""] : []),
    ...newImports,
    ...(otherLines.length > 0 && otherLines[0].trim() !== "" ? [""] : []),
    ...otherLines,
  ].join("\n");
  
  // Reconstruct Vue SFC
  let newSource = source;
  
  if (parsed.descriptor.scriptSetup) {
    const start = parsed.descriptor.scriptSetup.loc.start.offset;
    const end = parsed.descriptor.scriptSetup.loc.end.offset;
    newSource = source.slice(0, start) + updatedScript + source.slice(end);
  } else if (parsed.descriptor.script) {
    const start = parsed.descriptor.script.loc.start.offset;
    const end = parsed.descriptor.script.loc.end.offset;
    newSource = source.slice(0, start) + updatedScript + source.slice(end);
  }
  
  fs.writeFileSync(filePath, newSource, "utf-8");
  return true;
}

function walkDir(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".vue")) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const vueFiles = walkDir(customRegistryRoot);
let fixedCount = 0;

for (const file of vueFiles) {
  if (fixComponentImports(file)) {
    console.log(`Fixed: ${path.relative(customRegistryRoot, file)}`);
    fixedCount++;
  }
}

console.log(`\nFixed ${fixedCount} files.`);
