# Zod 3 → Zod 4 Migration Guide

## Table of Contents

- [Install](#install)
- [Error Customization](#error-customization)
- [String Formats](#string-formats)
- [Objects](#objects)
- [Enums](#enums)
- [Numbers](#numbers)
- [Records](#records)
- [Arrays](#arrays)
- [Defaults](#defaults)
- [Functions](#functions)
- [Refinements](#refinements)
- [Error Formatting](#error-formatting)
- [Coercion](#coercion)
- [Removed APIs](#removed-apis)
- [Internal Changes](#internal-changes)

---

## Install

```
npm install zod@^4.0.0
```

Community codemod available: [`zod-v3-to-v4`](https://github.com/nicoespeon/zod-v3-to-v4)

---

## Error Customization

### `message` → `error`

```ts
// Zod 3
z.string().min(5, { message: "Too short" });

// Zod 4
z.string().min(5, { error: "Too short" });
```

`message` still works but is deprecated.

### `invalid_type_error` / `required_error` → `error` function

```ts
// Zod 3
z.string({
  required_error: "Required",
  invalid_type_error: "Not a string",
});

// Zod 4
z.string({
  error: (issue) => issue.input === undefined ? "Required" : "Not a string",
});
```

### `errorMap` → `error` function

```ts
// Zod 3
z.string({
  errorMap: (issue, ctx) => {
    if (issue.code === "too_small") return { message: `Min ${issue.minimum}` };
    return { message: ctx.defaultError };
  },
});

// Zod 4
z.string({
  error: (issue) => {
    if (issue.code === "too_small") return `Min ${issue.minimum}`;
  },
});
```

Error maps can now return plain `string` or `undefined` (yields to next map).

### Error map precedence changed

Schema-level error maps now take priority over contextual (`.parse()`) error maps:

```ts
const s = z.string({ error: () => "Schema" });

// Zod 3: "Contextual"
// Zod 4: "Schema"
s.parse(12, { error: () => "Contextual" });
```

---

## String Formats

### Methods → Top-level functions

```ts
// Zod 3 (deprecated)
z.string().email();
z.string().uuid();
z.string().url();
z.string().ip();
z.string().cidr();

// Zod 4
z.email();
z.uuid();
z.url();
z.ipv4();     // replaces z.string().ip()
z.ipv6();
z.cidrv4();   // replaces z.string().cidr()
z.cidrv6();
```

### `.ip()` → `z.ipv4()` / `z.ipv6()`

No combined `.ip()` anymore. Use `z.union([z.ipv4(), z.ipv6()])` if needed.

### `.cidr()` → `z.cidrv4()` / `z.cidrv6()`

Same pattern as IP.

### Stricter `.uuid()`

Now validates RFC 9562/4122 variant bits. For permissive validation, use `z.guid()`.

### `.base64url()` no padding

Padding characters (`=`) no longer allowed in `z.base64url()`.

---

## Objects

### `.strict()` / `.passthrough()` → `z.strictObject()` / `z.looseObject()`

```ts
// Zod 3
z.object({ name: z.string() }).strict();
z.object({ name: z.string() }).passthrough();

// Zod 4
z.strictObject({ name: z.string() });
z.looseObject({ name: z.string() });
```

Methods still work but are deprecated.

### `.merge()` → `.extend()` or spread

```ts
// Zod 3
A.merge(B);

// Zod 4
A.extend(B.shape);
// or (best tsc performance)
z.object({ ...A.shape, ...B.shape });
```

### `.deepPartial()` removed

No replacement. Was considered anti-pattern.

### `z.unknown()` / `z.any()` optionality changed

```ts
z.object({ a: z.any(), b: z.unknown() });
// Zod 3: { a?: any; b?: unknown }
// Zod 4: { a: any; b: unknown }
```

### Defaults applied within optional fields

```ts
z.object({ a: z.string().default("tuna").optional() }).parse({});
// Zod 3: {}
// Zod 4: { a: "tuna" }
```

---

## Enums

### `z.nativeEnum()` → `z.enum()`

```ts
// Zod 3
enum Color { Red = "red", Green = "green" }
z.nativeEnum(Color);

// Zod 4
z.enum(Color);
```

### `.Enum` / `.Values` removed

```ts
// Zod 3
FishEnum.Enum.Salmon;    // ❌ removed
FishEnum.Values.Salmon;  // ❌ removed

// Zod 4
FishEnum.enum.Salmon;    // ✅ canonical
```

---

## Numbers

### No infinite values

`POSITIVE_INFINITY` and `NEGATIVE_INFINITY` no longer valid for `z.number()`.

### `.int()` → safe integers only

No longer accepts integers outside `Number.MIN_SAFE_INTEGER` to `Number.MAX_SAFE_INTEGER`.

### `.safe()` → same as `.int()`

No longer accepts floats.

---

## Records

### Single argument removed

```ts
// Zod 3
z.record(z.string());         // ✅

// Zod 4
z.record(z.string());         // ❌
z.record(z.string(), z.string()); // ✅
```

### Enum keys now exhaustive

```ts
z.record(z.enum(["a", "b"]), z.number());
// Zod 3: { a?: number; b?: number }
// Zod 4: { a: number; b: number }
```

Use `z.partialRecord()` for old behavior.

---

## Arrays

### `.nonempty()` type change

```ts
z.array(z.string()).nonempty();
// Zod 3: [string, ...string[]]
// Zod 4: string[]  (same as .min(1))
```

For old behavior:
```ts
z.tuple([z.string()], z.string()); // [string, ...string[]]
```

---

## Defaults

### `.default()` expects output type

```ts
// Zod 3: default = input type, gets parsed
z.string().transform(v => v.length).default("tuna");
// parse(undefined) => 4

// Zod 4: default = output type, short-circuits
z.string().transform(v => v.length).default(0);
// parse(undefined) => 0
```

Use `.prefault()` for old behavior:
```ts
z.string().transform(v => v.length).prefault("tuna");
// parse(undefined) => 4
```

---

## Functions

### New API

```ts
// Zod 3
z.function().args(z.string()).returns(z.number());

// Zod 4
z.function({ input: [z.string()], output: z.number() });
```

### `.implementAsync()` for async

```ts
// Zod 4
myFn.implementAsync(async (input) => { /* ... */ });
```

### No longer a Zod schema

`z.function()` result is a standalone function factory, not a parseable schema.

---

## Refinements

### Type predicates ignored

```ts
z.unknown().refine((val): val is string => typeof val === "string");
// Zod 3: infers `string`
// Zod 4: still `unknown`
```

### `ctx.path` removed

No longer available in `.superRefine()` callbacks.

### Function as 2nd argument removed

```ts
// Zod 3 (removed)
z.string().refine(
  (val) => val.length > 10,
  (val) => ({ message: `${val} too short` }),
);
```

---

## Error Formatting

### `.format()` → `z.treeifyError()`

```ts
// Zod 3
zodError.format();

// Zod 4
z.treeifyError(zodError);
```

### `.flatten()` → `z.treeifyError()`

### `.formErrors` removed

### `.addIssue()` / `.addIssues()` deprecated

Push to `err.issues` directly:
```ts
myError.issues.push({ /* ... */ });
```

---

## Coercion

Input type changed to `unknown`:

```ts
const schema = z.coerce.string();
type Input = z.input<typeof schema>;
// Zod 3: string
// Zod 4: unknown
```

---

## Removed APIs

| Zod 3 | Zod 4 |
|---|---|
| `z.ostring()`, `z.onumber()`, etc. | Removed |
| `z.literal(symbol)` | Removed (symbols not literal) |
| `ZodType.create()` | Removed (use factory functions) |
| `.nonstrict()` | Removed |
| `z.promise()` | Deprecated (just `await` before parsing) |
| `.and()` method | Use `z.intersection()` |
| `.or()` method | Use `z.union()` |
| `z.string().ip()` | Use `z.ipv4()` / `z.ipv6()` |
| `z.string().cidr()` | Use `z.cidrv4()` / `z.cidrv6()` |

---

## Internal Changes

### Generics simplified

```ts
// Zod 3
class ZodType<Output, Def extends z.ZodTypeDef, Input = Output> {}

// Zod 4
class ZodType<Output = unknown, Input = unknown> {}
```

`z.ZodTypeAny` eliminated — just use `z.ZodType`.

### `._def` → `._zod.def`

### `ZodEffects` removed

Refinements now stored inside schemas. Transforms use `ZodTransform` class.

### `ZodBranded` removed

Branding now modifies inferred type directly.

### `ZodPreprocess` removed

Returns `ZodPipe` instance instead.

### `z.core` namespace

Shared utilities between Zod and Zod Mini:

```ts
import * as z from "zod/v4/core";
// or access via z.core from "zod" or "zod/mini"
```

### Issue types renamed

```ts
// Zod 3 → Zod 4
ZodInvalidTypeIssue         → z.core.$ZodIssueInvalidType
ZodTooBigIssue              → z.core.$ZodIssueTooBig
ZodTooSmallIssue            → z.core.$ZodIssueTooSmall
ZodInvalidStringIssue       → z.core.$ZodIssueInvalidStringFormat
ZodNotMultipleOfIssue       → z.core.$ZodIssueNotMultipleOf
ZodUnrecognizedKeysIssue    → z.core.$ZodIssueUnrecognizedKeys
ZodInvalidUnionIssue        → z.core.$ZodIssueInvalidUnion
ZodCustomIssue              → z.core.$ZodIssueCustom
ZodInvalidEnumValueIssue    → merged into z.core.$ZodIssueInvalidValue
ZodInvalidLiteralIssue      → merged into z.core.$ZodIssueInvalidValue
```

### Intersection merge conflict

Now throws regular `Error` instead of `ZodError`.
