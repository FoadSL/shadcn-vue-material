/**
 * transform-ts-to-js.js
 *
 * Robust TS → JS conversion module for Vue SFCs and plain TypeScript files.
 * Uses TypeScript's transpileModule for type stripping and Babel AST for
 * Vue macro conversion.
 *
 * Exported functions:
 *   - stripTypescript(code)
 *   - convertVueMacrosToRuntime(code, options?)
 *   - cleanImports(code)
 *   - removeTypeAssertionsFromTemplate(sfcSource)
 *   - convertVueSfc(source, filename)
 *   - convertTsFile(source, filename)
 */

import { parse as babelParse } from '@babel/parser'
import _traverse from '@babel/traverse'
import _generate from '@babel/generator'
import * as t from '@babel/types'
import ts from 'typescript'
import { parse as sfcParse } from '@vue/compiler-sfc'

// Handle CJS/ESM interop for Babel packages
const traverse = _traverse.default || _traverse
const generate = _generate.default || _generate

// ---------------------------------------------------------------------------
// Known external type props
// ---------------------------------------------------------------------------
// When the converter encounters an external type reference in defineProps
// that can't be resolved from the local file, it checks this map.
// This handles types like PrimitiveProps from reka-ui whose props are
// directly referenced in Vue templates.
//
// Format: TypeName → [{ name, type (runtime constructor name or null), optional }]
const KNOWN_EXTERNAL_PROPS = new Map([
  ['PrimitiveProps', [
    { name: 'as', type: null, optional: true },
    { name: 'asChild', type: 'Boolean', optional: true },
  ]],
])

/**
 * Create a Babel AST ObjectExpression for runtime props from a known external type.
 * @param {Array<{ name: string, type: string|null, optional: boolean }>} propDefs
 * @returns {object} Babel AST ObjectExpression
 */
function createPropsFromKnownType(propDefs) {
  const properties = propDefs.map(def => {
    const propDefProps = []
    if (def.type) {
      propDefProps.push(t.objectProperty(t.identifier('type'), t.identifier(def.type)))
    }
    propDefProps.push(
      t.objectProperty(t.identifier('required'), t.booleanLiteral(!def.optional))
    )
    const key = t.isValidIdentifier(def.name)
      ? t.identifier(def.name)
      : t.stringLiteral(def.name)
    return t.objectProperty(key, t.objectExpression(propDefProps))
  })
  return t.objectExpression(properties)
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Detect whether the source code predominantly uses semicolons.
 * Returns true if semicolons are common, false otherwise.
 * @param {string} code
 * @returns {boolean}
 */
function detectSemicolons(code) {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  let withSemi = 0
  let withoutSemi = 0
  for (const line of lines) {
    // Skip comments, blank lines, opening/closing braces/brackets, template literals
    if (/^\/\/|^\/\*|^\*|^{|^}|^<|^`/.test(line)) continue
    if (line.endsWith(';')) withSemi++
    else withoutSemi++
  }
  return withSemi > withoutSemi
}

/**
 * Remove trailing semicolons from statement-ending positions.
 * Only affects semicolons at end-of-line, not inside for-loops etc.
 * @param {string} code
 * @returns {string}
 */
function removeSemicolons(code) {
  return code.replace(/;(\s*$)/gm, '$1')
}

/**
 * Extract generic parameter names from a `generic="..."` attribute value.
 * e.g. "T extends Record<string, any>" → ["T"]
 *      "T, U extends Foo" → ["T", "U"]
 * @param {string|undefined} genericAttr
 * @returns {string[]}
 */
function extractGenericParamNames(genericAttr) {
  if (!genericAttr) return []
  // Split by comma, then take the first word (the param name) from each segment
  return genericAttr
    .split(',')
    .map(s => s.trim().split(/\s/)[0])
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Type conversion helpers (AST)
// ---------------------------------------------------------------------------

/**
 * Convert a TypeScript type annotation AST node to a Vue runtime type
 * identifier or array of identifiers.
 * @param {object} typeNode - Babel AST type node
 * @param {string[]} genericParams - names of generic type parameters to treat as unknown
 * @returns {object} Babel AST node (Identifier, ArrayExpression, or NullLiteral)
 */
function convertTypeAnnotationToRuntime(typeNode, genericParams = []) {
  if (!typeNode) return t.nullLiteral()

  // Primitive keywords
  if (t.isTSStringKeyword(typeNode)) return t.identifier('String')
  if (t.isTSNumberKeyword(typeNode)) return t.identifier('Number')
  if (t.isTSBooleanKeyword(typeNode)) return t.identifier('Boolean')
  if (t.isTSObjectKeyword(typeNode)) return t.identifier('Object')
  if (t.isTSSymbolKeyword(typeNode)) return t.identifier('Symbol')
  if (t.isTSBigIntKeyword(typeNode)) return t.identifier('BigInt')

  // Loose/unknown types → null (accept any value)
  if (t.isTSAnyKeyword(typeNode)) return t.nullLiteral()
  if (t.isTSUnknownKeyword(typeNode)) return t.nullLiteral()
  if (t.isTSNeverKeyword(typeNode)) return t.nullLiteral()
  if (t.isTSNullKeyword(typeNode)) return t.nullLiteral()
  if (t.isTSUndefinedKeyword(typeNode)) return t.nullLiteral()
  if (t.isTSVoidKeyword(typeNode)) return t.nullLiteral()

  // Function types
  if (t.isTSFunctionType(typeNode)) return t.identifier('Function')

  // Array types
  if (t.isTSArrayType(typeNode)) return t.identifier('Array')
  if (t.isTSTupleType(typeNode)) return t.identifier('Array')

  // Type references
  if (t.isTSTypeReference(typeNode)) {
    const name = t.isIdentifier(typeNode.typeName)
      ? typeNode.typeName.name
      : t.isTSQualifiedName(typeNode.typeName)
        ? typeNode.typeName.right.name
        : null

    // Generic type param → unknown
    if (name && genericParams.includes(name)) return t.nullLiteral()

    const runtimeMap = {
      String: 'String',
      Number: 'Number',
      Boolean: 'Boolean',
      Function: 'Function',
      Object: 'Object',
      Symbol: 'Symbol',
      BigInt: 'BigInt',
      Array: 'Array',
      Date: 'Date',
      RegExp: 'RegExp',
      Error: 'Error',
      Map: 'Object',
      Set: 'Object',
      WeakMap: 'Object',
      WeakSet: 'Object',
      Record: 'Object',
      Partial: 'Object',
      Required: 'Object',
      Readonly: 'Object',
      Pick: 'Object',
      Omit: 'Object',
      Exclude: 'Object',
      Extract: 'Object',
      Promise: 'Object',
      HTMLElement: 'Object',
      Element: 'Object',
      Event: 'Object',
      Ref: 'Object',
      ComputedRef: 'Object',
      MaybeRef: 'Object',
      MaybeRefOrGetter: 'Object',
    }

    if (name && runtimeMap[name]) return t.identifier(runtimeMap[name])

    // Unknown imported type → null
    return t.nullLiteral()
  }

  // Union types: string | number → [String, Number]
  if (t.isTSUnionType(typeNode)) {
    // Filter out null/undefined from unions (they indicate optionality, not type)
    const nonNullTypes = typeNode.types.filter(
      tn => !t.isTSNullKeyword(tn) && !t.isTSUndefinedKeyword(tn)
    )
    if (nonNullTypes.length === 0) return t.nullLiteral()
    if (nonNullTypes.length === 1) return convertTypeAnnotationToRuntime(nonNullTypes[0], genericParams)

    const runtimeTypes = nonNullTypes
      .map(tn => convertTypeAnnotationToRuntime(tn, genericParams))
      .filter(rt => rt && !t.isNullLiteral(rt))

    if (runtimeTypes.length === 0) return t.nullLiteral()
    if (runtimeTypes.length === 1) return runtimeTypes[0]

    // Deduplicate
    const seen = new Set()
    const unique = runtimeTypes.filter(rt => {
      const key = t.isIdentifier(rt) ? rt.name : 'null'
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    if (unique.length === 1) return unique[0]
    return t.arrayExpression(unique)
  }

  // Intersection types → Object
  if (t.isTSIntersectionType(typeNode)) return t.identifier('Object')

  // Literal types: 'foo' → String, 42 → Number, true → Boolean
  if (t.isTSLiteralType(typeNode)) {
    if (t.isStringLiteral(typeNode.literal)) return t.identifier('String')
    if (t.isNumericLiteral(typeNode.literal)) return t.identifier('Number')
    if (t.isBooleanLiteral(typeNode.literal)) return t.identifier('Boolean')
    if (t.isBigIntLiteral(typeNode.literal)) return t.identifier('BigInt')
    if (t.isTemplateLiteral(typeNode.literal)) return t.identifier('String')
    return t.nullLiteral()
  }

  // Inline object type → Object
  if (t.isTSTypeLiteral(typeNode)) return t.identifier('Object')

  // Indexed access type: Foo['bar'] → null (too complex to resolve)
  if (t.isTSIndexedAccessType(typeNode)) return t.nullLiteral()

  // Conditional type → null
  if (t.isTSConditionalType(typeNode)) return t.nullLiteral()

  // Mapped type → Object
  if (t.isTSMappedType(typeNode)) return t.identifier('Object')

  // Parenthesized type
  if (t.isTSParenthesizedType(typeNode)) {
    return convertTypeAnnotationToRuntime(typeNode.typeAnnotation, genericParams)
  }

  // Type query: typeof Foo → null
  if (t.isTSTypeQuery(typeNode)) return t.nullLiteral()

  // Keyof → null
  if (t.isTSTypeOperator(typeNode)) return t.nullLiteral()

  // Fallback
  return t.nullLiteral()
}

/**
 * Convert a TSTypeLiteral or TSInterfaceBody to a Vue runtime props ObjectExpression.
 * @param {object} typeLiteral - Babel AST TSTypeLiteral or TSInterfaceBody node
 * @param {string[]} genericParams
 * @param {Map<string, object>} [localTypes] - locally defined interfaces/type aliases
 * @returns {object} Babel AST ObjectExpression
 */
function convertTypeLiteralToProps(typeLiteral, genericParams, localTypes = new Map()) {
  // TSInterfaceBody uses .body, TSTypeLiteral uses .members
  const members = t.isTSInterfaceBody(typeLiteral)
    ? typeLiteral.body
    : typeLiteral.members
  const properties = []

  for (const member of members) {
    if (!t.isTSPropertySignature(member) || !member.key) continue

    const keyName = t.isIdentifier(member.key)
      ? member.key.name
      : t.isStringLiteral(member.key)
        ? member.key.value
        : null
    if (!keyName) continue

    const isOptional = !!member.optional
    const typeAnnotation = member.typeAnnotation?.typeAnnotation

    const runtimeType = typeAnnotation
      ? convertTypeAnnotationToRuntime(typeAnnotation, genericParams)
      : t.nullLiteral()

    const propDefProps = []

    // Only add type if it's not null (null = accept any)
    if (!t.isNullLiteral(runtimeType)) {
      propDefProps.push(t.objectProperty(t.identifier('type'), runtimeType))
    }

    propDefProps.push(
      t.objectProperty(t.identifier('required'), t.booleanLiteral(!isOptional))
    )

    const key = t.isValidIdentifier(keyName)
      ? t.identifier(keyName)
      : t.stringLiteral(keyName)

    properties.push(t.objectProperty(key, t.objectExpression(propDefProps)))
  }

  return t.objectExpression(properties)
}

/**
 * Convert a type parameter from defineProps<T>() into a runtime props object.
 * Returns null if the type cannot be resolved (external type reference only).
 * Supports resolving local interfaces and type aliases defined in the same file.
 *
 * @param {object} typeNode - Babel AST type node
 * @param {string[]} genericParams
 * @param {Map<string, object>} [localTypes] - locally defined interfaces/type aliases
 * @returns {object|null} Babel AST ObjectExpression or null
 */
function convertTypeToRuntimeProps(typeNode, genericParams, localTypes = new Map()) {
  if (!typeNode) return null

  // Inline object type: defineProps<{ foo: string }>()
  if (t.isTSTypeLiteral(typeNode)) {
    return convertTypeLiteralToProps(typeNode, genericParams, localTypes)
  }

  // Interface body (from local resolution)
  if (t.isTSInterfaceBody(typeNode)) {
    return convertTypeLiteralToProps(typeNode, genericParams, localTypes)
  }

  // Intersection type: defineProps<FooProps & { class?: string }>()
  if (t.isTSIntersectionType(typeNode)) {
    const merged = t.objectExpression([])
    for (const member of typeNode.types) {
      // Try to resolve each part of the intersection
      const resolved = convertTypeToRuntimeProps(member, genericParams, localTypes)
      if (resolved && t.isObjectExpression(resolved)) {
        merged.properties.push(...resolved.properties)
      }
    }
    return merged.properties.length > 0 ? merged : null
  }

  // Type reference — try local resolution, then known external types, then null
  if (t.isTSTypeReference(typeNode)) {
    const name = t.isIdentifier(typeNode.typeName) ? typeNode.typeName.name : null
    if (name && localTypes.has(name)) {
      const local = localTypes.get(name)

      if (local.kind === 'interface') {
        // Convert the interface body's own properties
        const bodyProps = convertTypeLiteralToProps(local.body, genericParams, localTypes)

        // Resolve any `extends` types (e.g. `interface Props extends PrimitiveProps`)
        // and merge their props into the result
        for (const ext of local.extends) {
          const extName = t.isIdentifier(ext.expression) ? ext.expression.name : null
          if (extName) {
            const extTypeRef = t.tsTypeReference(t.identifier(extName), ext.typeParameters)
            const extProps = convertTypeToRuntimeProps(extTypeRef, genericParams, localTypes)
            if (extProps && t.isObjectExpression(extProps)) {
              bodyProps.properties.push(...extProps.properties)
            }
          }
        }
        return bodyProps
      }

      if (local.kind === 'typeAlias') {
        // Type alias → recurse (it could be a literal, intersection, etc.)
        return convertTypeToRuntimeProps(local.typeAnnotation, genericParams, localTypes)
      }
    }

    // Check known external types (e.g. PrimitiveProps from reka-ui)
    if (name && KNOWN_EXTERNAL_PROPS.has(name)) {
      return createPropsFromKnownType(KNOWN_EXTERNAL_PROPS.get(name))
    }

    // Unresolvable external type
    return null
  }

  // Parenthesized
  if (t.isTSParenthesizedType(typeNode)) {
    return convertTypeToRuntimeProps(typeNode.typeAnnotation, genericParams, localTypes)
  }

  return null
}

/**
 * Extract the event name from a function type like (e: 'name', ...) => void
 * @param {object} funcType - TSFunctionType AST node
 * @returns {string[]|null}
 */
function extractEventNameFromFunctionType(funcType) {
  if (funcType.parameters && funcType.parameters.length > 0) {
    const firstParam = funcType.parameters[0]
    const typeAnno = firstParam.typeAnnotation?.typeAnnotation
    if (typeAnno) {
      // Single literal: (e: 'click') => void
      if (t.isTSLiteralType(typeAnno) && t.isStringLiteral(typeAnno.literal)) {
        return [typeAnno.literal.value]
      }
      // Union of literals: (e: 'click' | 'change') => void
      if (t.isTSUnionType(typeAnno)) {
        const names = []
        for (const member of typeAnno.types) {
          if (t.isTSLiteralType(member) && t.isStringLiteral(member.literal)) {
            names.push(member.literal.value)
          }
        }
        return names.length > 0 ? names : null
      }
    }
  }
  return null
}

/**
 * Extract event name from a call signature: { (e: 'name', ...): void }
 * @param {object} callSig - TSCallSignatureDeclaration AST node
 * @returns {string|null}
 */
function extractEventNameFromCallSignature(callSig) {
  if (callSig.parameters && callSig.parameters.length > 0) {
    const firstParam = callSig.parameters[0]
    const typeAnno = firstParam.typeAnnotation?.typeAnnotation
    if (typeAnno && t.isTSLiteralType(typeAnno) && t.isStringLiteral(typeAnno.literal)) {
      return typeAnno.literal.value
    }
  }
  return null
}

/**
 * Extract event names from a defineEmits type parameter.
 * @param {object} typeNode
 * @returns {string[]|null}
 */
function extractEmitNames(typeNode) {
  if (!typeNode) return null

  // External type reference → can't resolve
  if (t.isTSTypeReference(typeNode)) return null

  // Function type: (e: 'name', payload: Type) => void
  if (t.isTSFunctionType(typeNode)) {
    return extractEventNameFromFunctionType(typeNode)
  }

  // Object/interface-like type literal
  if (t.isTSTypeLiteral(typeNode)) {
    const names = []

    for (const member of typeNode.members) {
      // Object property syntax: { 'update:modelValue': [value: string] }
      if (t.isTSPropertySignature(member) && member.key) {
        const name = t.isIdentifier(member.key)
          ? member.key.name
          : t.isStringLiteral(member.key)
            ? member.key.value
            : null
        if (name) names.push(name)
      }

      // Call signature syntax: { (e: 'name', payload: Type): void }
      if (t.isTSCallSignatureDeclaration(member)) {
        const eventName = extractEventNameFromCallSignature(member)
        if (eventName) names.push(eventName)
      }
    }

    return names.length > 0 ? names : null
  }

  // Intersection type
  if (t.isTSIntersectionType(typeNode)) {
    const names = []
    for (const member of typeNode.types) {
      const extracted = extractEmitNames(member)
      if (extracted) names.push(...extracted)
    }
    return names.length > 0 ? names : null
  }

  // Parenthesized
  if (t.isTSParenthesizedType(typeNode)) {
    return extractEmitNames(typeNode.typeAnnotation)
  }

  return null
}

/**
 * Merge default values into a runtime props ObjectExpression.
 * Mutates propsObj in place.
 * @param {object} propsObj - Babel AST ObjectExpression (runtime props)
 * @param {object} defaultsObj - Babel AST ObjectExpression (defaults from withDefaults)
 */
function mergeDefaults(propsObj, defaultsObj) {
  if (!t.isObjectExpression(defaultsObj)) return

  for (const defaultProp of defaultsObj.properties) {
    if (t.isSpreadElement(defaultProp)) continue
    if (!t.isObjectProperty(defaultProp)) continue

    const keyName = t.isIdentifier(defaultProp.key)
      ? defaultProp.key.name
      : t.isStringLiteral(defaultProp.key)
        ? defaultProp.key.value
        : null
    if (!keyName) continue

    // Find the matching prop in the runtime props object
    let found = false
    for (const propEntry of propsObj.properties) {
      if (!t.isObjectProperty(propEntry)) continue

      const propKeyName = t.isIdentifier(propEntry.key)
        ? propEntry.key.name
        : t.isStringLiteral(propEntry.key)
          ? propEntry.key.value
          : null

      if (propKeyName === keyName && t.isObjectExpression(propEntry.value)) {
        // Add default value
        propEntry.value.properties.push(
          t.objectProperty(t.identifier('default'), t.cloneNode(defaultProp.value))
        )
        // Ensure required is false (since it has a default)
        for (const p of propEntry.value.properties) {
          if (
            t.isObjectProperty(p) &&
            t.isIdentifier(p.key, { name: 'required' })
          ) {
            p.value = t.booleanLiteral(false)
          }
        }
        found = true
        break
      }
    }

    // If prop wasn't in the type (comes from an external type reference), add it
    if (!found) {
      const key = t.isValidIdentifier(keyName)
        ? t.identifier(keyName)
        : t.stringLiteral(keyName)

      propsObj.properties.push(
        t.objectProperty(
          key,
          t.objectExpression([
            t.objectProperty(t.identifier('required'), t.booleanLiteral(false)),
            t.objectProperty(t.identifier('default'), t.cloneNode(defaultProp.value)),
          ])
        )
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Strip TypeScript type annotations using the TypeScript compiler.
 * Preserves value-level code, comments, and all value imports.
 *
 * Uses `verbatimModuleSyntax: true` so that value imports are never elided
 * (important for Vue SFCs where template-only imports would otherwise be dropped).
 *
 * @param {string} code - TypeScript source code
 * @param {{ semicolons?: boolean }} [options]
 *   - semicolons: explicit override for semicolon detection.
 *     Pass `false` to force-remove trailing semicolons from the output.
 *     If omitted, auto-detected from the input code.
 * @returns {string} JavaScript code with type annotations removed
 */
export function stripTypescript(code, { semicolons } = {}) {
  const hasSemicolons = semicolons ?? detectSemicolons(code)

  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      // CRITICAL: preserve all non-type imports.
      // Without this, TS removes imports that appear "unused" in the script
      // but are actually referenced in Vue <template> sections.
      verbatimModuleSyntax: true,
      removeComments: false,
      // Preserve JSX since some files might use it
      jsx: ts.JsxEmit.Preserve,
    },
  })

  let output = result.outputText

  // Remove `export {};` lines that TS adds for module detection
  output = output.replace(/^\s*export\s+\{\s*\}\s*;?\s*$/gm, '')

  // Strip semicolons if the source style doesn't use them
  if (!hasSemicolons) {
    output = removeSemicolons(output)
  }

  // ts.transpileModule uses 4-space indentation.
  // Convert groups of 4 leading spaces to 2-space to match shadcn-vue's style.
  // Only matches exact multiples of 4 spaces, leaving other indentation alone.
  output = output.replace(/^(?: {4})+/gm, match => '  '.repeat(match.length / 4))

  // Remove excessive blank lines (max 2 consecutive newlines)
  output = output.replace(/\n{3,}/g, '\n\n')

  return output
}

/**
 * Convert Vue 3 compiler macros from type-only syntax to runtime syntax
 * using Babel AST transformation.
 *
 * Handles:
 *   - defineProps<{...}>()         → defineProps({...})
 *   - withDefaults(defineProps<>(), {...}) → defineProps({...with defaults...})
 *   - defineEmits<{...}>()         → defineEmits([...names])
 *   - defineSlots<{...}>()         → defineSlots()
 *
 * @param {string} code - Script block content (TypeScript)
 * @param {{ genericParams?: string[] }} [options]
 * @returns {string} Code with macros converted to runtime form
 */
export function convertVueMacrosToRuntime(code, { genericParams = [] } = {}) {
  let ast
  try {
    ast = babelParse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'topLevelAwait'],
    })
  } catch (err) {
    console.warn('[transform] Failed to parse code for macro conversion:', err.message)
    return code
  }

  let modified = false

  // Collect locally-defined interfaces and type aliases so that
  // defineProps<LocalInterface>() can be resolved to runtime props.
  // For interfaces we also store the `extends` clause so that
  // `interface Props extends PrimitiveProps { ... }` can be fully resolved.
  const localTypes = new Map()
  traverse(ast, {
    TSInterfaceDeclaration(path) {
      if (path.node.id && t.isIdentifier(path.node.id)) {
        localTypes.set(path.node.id.name, {
          kind: 'interface',
          body: path.node.body, // TSInterfaceBody
          extends: path.node.extends || [], // TSExpressionWithTypeArguments[]
        })
      }
    },
    TSTypeAliasDeclaration(path) {
      if (path.node.id && t.isIdentifier(path.node.id)) {
        localTypes.set(path.node.id.name, {
          kind: 'typeAlias',
          typeAnnotation: path.node.typeAnnotation,
        })
      }
    },
  })

  traverse(ast, {
    CallExpression(path) {
      const { node } = path

      // ---------------------------------------------------------------
      // withDefaults(defineProps<...>(), { ... })
      // ---------------------------------------------------------------
      if (
        t.isIdentifier(node.callee, { name: 'withDefaults' }) &&
        node.arguments.length >= 2 &&
        t.isCallExpression(node.arguments[0]) &&
        t.isIdentifier(node.arguments[0].callee, { name: 'defineProps' }) &&
        node.arguments[0].typeParameters
      ) {
        const definePropsCall = node.arguments[0]
        const defaultsObj = node.arguments[1]
        const typeParam = definePropsCall.typeParameters.params[0]

        let propsObj = convertTypeToRuntimeProps(typeParam, genericParams, localTypes)

        // If type wasn't resolvable but we have defaults, create props from defaults
        if (propsObj === null && t.isObjectExpression(defaultsObj)) {
          propsObj = t.objectExpression([])
        }

        // Merge default values into the props object
        if (propsObj && t.isObjectExpression(defaultsObj)) {
          mergeDefaults(propsObj, defaultsObj)
        }

        // Replace: withDefaults(defineProps<T>(), {...}) → defineProps({...})
        definePropsCall.typeParameters = null
        definePropsCall.arguments = propsObj ? [propsObj] : []
        path.replaceWith(definePropsCall)
        modified = true
        return
      }

      // ---------------------------------------------------------------
      // defineProps<...>()
      // ---------------------------------------------------------------
      if (
        t.isIdentifier(node.callee, { name: 'defineProps' }) &&
        node.typeParameters
      ) {
        const typeParam = node.typeParameters.params[0]
        const propsObj = convertTypeToRuntimeProps(typeParam, genericParams, localTypes)

        node.typeParameters = null
        if (propsObj) {
          node.arguments = [propsObj]
        }
        modified = true
        return
      }

      // ---------------------------------------------------------------
      // defineEmits<...>()
      // ---------------------------------------------------------------
      if (
        t.isIdentifier(node.callee, { name: 'defineEmits' }) &&
        node.typeParameters
      ) {
        const typeParam = node.typeParameters.params[0]
        const emitNames = extractEmitNames(typeParam)

        node.typeParameters = null
        if (emitNames && emitNames.length > 0) {
          node.arguments = [
            t.arrayExpression(emitNames.map(name => t.stringLiteral(name))),
          ]
        }
        // If emitNames is null (external type), leave as defineEmits()
        modified = true
        return
      }

      // ---------------------------------------------------------------
      // defineSlots<...>()
      // ---------------------------------------------------------------
      if (
        t.isIdentifier(node.callee, { name: 'defineSlots' }) &&
        node.typeParameters
      ) {
        node.typeParameters = null
        modified = true
        return
      }
    },
  })

  if (!modified) return code

  const output = generate(ast, {
    retainLines: false,
    comments: true,
    jsescOption: { quotes: 'single' },
  })

  return output.code
}

/**
 * Remove type-only imports and type specifiers from mixed imports.
 *
 * - `import type { Foo } from '...'` → removed entirely
 * - `import { type Foo, cn } from '...'` → `import { cn } from '...'`
 * - Empty imports after cleanup are removed
 *
 * @param {string} code
 * @returns {string}
 */
export function cleanImports(code) {
  let result = code

  // Step 1: Remove `import type { ... } from '...'` and `import type Foo from '...'`
  // Handles single-line and multi-line type-only imports
  result = result.replace(
    /import\s+type\s+(?:\{[\s\S]*?\}|\*\s+as\s+\w+|\w+)\s+from\s+['"][^'"]*['"]\s*;?/g,
    ''
  )

  // Step 2: Remove `type` specifiers from mixed imports
  // e.g. import { type Foo, cn } from '...' → import { cn } from '...'
  result = result.replace(
    /import\s*\{([\s\S]*?)\}\s*from/g,
    (match, specifiers) => {
      const cleaned = specifiers
        .split(',')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('type '))
        .join(', ')

      if (!cleaned) return 'import {} from'
      return `import { ${cleaned} } from`
    }
  )

  // Step 3: Remove now-empty import statements
  result = result.replace(
    /import\s*\{\s*\}\s*from\s+['"][^'"]*['"]\s*;?/g,
    ''
  )

  // Step 4: Clean up excessive blank lines left by removals
  result = result.replace(/\n{3,}/g, '\n\n')

  return result
}

/**
 * Remove TypeScript type assertions and parameter types from the <template>
 * section of a Vue SFC. Does not touch <script> blocks.
 *
 * Handles:
 *   - `(item as SelectItem).value` → `(item).value`
 *   - `as any`, `as unknown`, `as const`
 *   - `as Ref<DateValue>` (with nested generics)
 *   - `(e: Event)` → `(e)` in inline handlers
 *   - `(value: string | number)` → `(value)` in inline handlers
 *
 * @param {string} sfcSource - Full Vue SFC source
 * @returns {string}
 */
export function removeTypeAssertionsFromTemplate(sfcSource) {
  // Find the template region
  const templateOpenMatch = sfcSource.match(/<template(\s[^>]*)?>/)
  if (!templateOpenMatch) return sfcSource

  const templateOpenIdx = sfcSource.indexOf(templateOpenMatch[0])
  const templateOpenEnd = templateOpenIdx + templateOpenMatch[0].length
  const templateCloseStart = sfcSource.lastIndexOf('</template>')
  if (templateCloseStart === -1 || templateCloseStart <= templateOpenEnd) return sfcSource

  const before = sfcSource.slice(0, templateOpenEnd)
  const templateContent = sfcSource.slice(templateOpenEnd, templateCloseStart)
  const after = sfcSource.slice(templateCloseStart)

  let cleaned = templateContent

  // 1. Remove `as const` assertions
  cleaned = cleaned.replace(/\s+as\s+const\b/g, '')

  // 2. Remove simple keyword assertions: as any, as unknown, as never
  cleaned = cleaned.replace(/\s+as\s+(?:any|unknown|never)\b/g, '')

  // 3. Remove type assertions with type names (without generics): `as HTMLElement`
  //    Use negative lookahead to avoid matching `as-child` and similar HTML attributes
  cleaned = cleaned.replace(/\s+as\s+[A-Z]\w*\b(?![<\w-])/g, '')

  // 4. Remove type assertions with generics: `as Ref<DateValue>`, `as Map<string, number>`
  //    Iteratively handle nested angle brackets
  let changed = true
  while (changed) {
    const prev = cleaned
    cleaned = cleaned.replace(
      /\s+as\s+[A-Z]\w*<[^<>]*(?:<[^<>]*(?:<[^<>]*>[^<>]*)*>[^<>]*)*>/g,
      ''
    )
    changed = prev !== cleaned
  }

  // 5. Remove TS parameter types in inline handlers
  //    Matches: (param: UppercaseType), (param: UppercaseType<Generic>)
  cleaned = cleaned.replace(
    /\((\w+)\s*:\s*[A-Z]\w*(?:<[^>]*>)?\s*\)/g,
    '($1)'
  )

  // 6. Handle lowercase built-in types: (e: string), (value: number), etc.
  cleaned = cleaned.replace(
    /\((\w+)\s*:\s*(?:string|number|boolean|any|unknown|void|null|undefined|object|symbol|bigint)\s*\)/g,
    '($1)'
  )

  // 7. Handle union types in parameters: (value: string | number) → (value)
  //    Match: (word: TypeExpr | TypeExpr | ...)
  cleaned = cleaned.replace(
    /\((\w+)\s*:\s*(?:[\w.]+(?:<[^>]*>)?(?:\s*\|\s*[\w.]+(?:<[^>]*>)?)+)\s*\)/g,
    '($1)'
  )

  // 8. Handle remaining cases: (e: any) patterns that might have been missed
  cleaned = cleaned.replace(
    /\((\w+)\s*:\s*(?:any|unknown)\s*\)/g,
    '($1)'
  )

  return before + cleaned + after
}

/**
 * Convert a Vue SFC from TypeScript to JavaScript.
 *
 * Pipeline per script block:
 *   1. convertVueMacrosToRuntime (for <script setup> blocks)
 *   2. cleanImports
 *   3. stripTypescript
 *   4. Clean up artifacts
 *
 * Also removes lang="ts", generic="...", and template type assertions.
 *
 * @param {string} source - Full Vue SFC source
 * @param {string} filename - Filename for diagnostics
 * @returns {Promise<string>} Converted JavaScript SFC
 */
export async function convertVueSfc(source, filename) {
  const { descriptor, errors } = sfcParse(source, { filename })
  if (errors.length > 0) {
    console.warn(`[transform] SFC parse warnings for ${filename}:`, errors.map(e => e.message))
  }

  // Collect script blocks that need conversion
  const scriptBlocks = []
  if (descriptor.script && descriptor.script.lang === 'ts') {
    scriptBlocks.push({ block: descriptor.script, kind: 'script' })
  }
  if (descriptor.scriptSetup && descriptor.scriptSetup.lang === 'ts') {
    scriptBlocks.push({ block: descriptor.scriptSetup, kind: 'scriptSetup' })
  }

  let sfcSource = source

  // If no TS script blocks, just clean up attributes and template
  if (!scriptBlocks.length) {
    // Still remove lang="ts" and generic if somehow present
    sfcSource = sfcSource
      .replace(/(<script\b[^>]*?)\s+lang=(["'])ts\2([^>]*>)/g, '$1$3')
      .replace(/(<script\b[^>]*?)\s+generic=(["'])[^"']*\2([^>]*>)/g, '$1$3')

    if (descriptor.template) {
      sfcSource = removeTypeAssertionsFromTemplate(sfcSource)
    }
    return sfcSource
  }

  // Sort by start offset DESC so later replacements don't disturb earlier offsets
  scriptBlocks.sort((a, b) => b.block.loc.start.offset - a.block.loc.start.offset)

  for (const entry of scriptBlocks) {
    const { block, kind } = entry
    const originalCode = block.content
    // Detect semicolon style from the ORIGINAL source (before any transforms)
    const originalHasSemicolons = detectSemicolons(originalCode)
    let tsCode = originalCode

    try {
      // Step 1: Convert Vue macros to runtime (only for setup scripts)
      if (kind === 'scriptSetup') {
        const genericAttr = block.attrs?.generic
        const genericParams = extractGenericParamNames(
          typeof genericAttr === 'string' ? genericAttr : undefined
        )
        tsCode = convertVueMacrosToRuntime(tsCode, { genericParams })
      }

      // Step 2: Clean imports (remove type-only imports and specifiers)
      tsCode = cleanImports(tsCode)

      // Step 3: Strip remaining TypeScript annotations
      // Pass the original semicolon style so intermediate transforms
      // (Babel, etc.) don't trick the detector
      tsCode = stripTypescript(tsCode, { semicolons: originalHasSemicolons })

      // Step 4: Clean up artifacts
      tsCode = tsCode
        .replace(/^\s*export\s+\{\s*\}\s*;?\s*$/gm, '')  // Remove export {}
        .replace(/\n{3,}/g, '\n\n')                        // Collapse blank lines
        .trim()
    } catch (err) {
      console.warn(`[transform] Error converting <${kind}> in ${filename}:`, err.message)
      // Best-effort fallback: just strip type imports and obvious TS
      tsCode = cleanImports(tsCode)
      tsCode = tsCode
        .replace(/^\s*export\s+\{\s*\}\s*;?\s*$/gm, '')
        .trim()
    }

    // Rebuild <script> tag attributes, dropping lang="ts" and generic="..."
    const attrs = block.attrs ?? {}
    const attrParts = []
    for (const [name, value] of Object.entries(attrs)) {
      if (name === 'lang' || name === 'generic') continue
      if (value === true || value === '') {
        attrParts.push(` ${name}`)
      } else {
        attrParts.push(` ${name}="${value}"`)
      }
    }

    const openTag = `<script${attrParts.join('')}>`
    const newBlock = `${openTag}\n${tsCode}\n</script>`

    // Replace the entire original <script ...>...</script> block
    const contentStart = block.loc.start.offset
    const contentEnd = block.loc.end.offset

    const tagStart = sfcSource.lastIndexOf('<script', contentStart)
    if (tagStart === -1) {
      console.warn(`[transform] Could not find <script> tag for <${kind}> in ${filename}`)
      continue
    }
    const closeIdx = sfcSource.indexOf('</script>', contentEnd)
    if (closeIdx === -1) {
      console.warn(`[transform] Could not find </script> end for <${kind}> in ${filename}`)
      continue
    }
    const tagEnd = closeIdx + '</script>'.length

    sfcSource = sfcSource.slice(0, tagStart) + newBlock + sfcSource.slice(tagEnd)
  }

  // Clean template section
  if (descriptor.template) {
    sfcSource = removeTypeAssertionsFromTemplate(sfcSource)
  }

  return sfcSource
}

/**
 * Convert a plain TypeScript file to JavaScript.
 * Runs cleanImports → stripTypescript.
 *
 * @param {string} source - TypeScript file content
 * @param {string} filename - Filename for diagnostics
 * @returns {Promise<string>} JavaScript content
 */
export async function convertTsFile(source, filename) {
  try {
    const originalHasSemicolons = detectSemicolons(source)
    let code = cleanImports(source)
    code = stripTypescript(code, { semicolons: originalHasSemicolons })
    code = code.trim() + '\n'
    return code
  } catch (err) {
    console.warn(`[transform] Error converting ${filename}:`, err.message)
    return source
  }
}
