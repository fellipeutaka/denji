# Zod Mini

`zod/mini` is a tree-shakable variant with a functional API. Same functionality, smaller bundles.

```ts
import * as z from "zod/mini";
```

## API Differences

| Regular Zod | Zod Mini |
|---|---|
| `z.string().optional()` | `z.optional(z.string())` |
| `z.string().nullable()` | `z.nullable(z.string())` |
| `z.string().min(5).max(10).trim()` | `z.string().check(z.minLength(5), z.maxLength(10), z.trim())` |
| `schema.extend({...})` | `z.extend(schema, {...})` |
| `schema.pick({a: true})` | `z.pick(schema, {a: true})` |
| `schema.omit({a: true})` | `z.omit(schema, {a: true})` |
| `schema.partial()` | `z.partial(schema)` |
| `schema.required()` | `z.required(schema)` |
| `schema.keyof()` | `z.keyof(schema)` |
| `z.string().default("x")` | `z._default(z.string(), "x")` |
| `z.number().catch(0)` | `z.catch(z.number(), 0)` |
| `z.object({}).readonly()` | `z.readonly(z.object({}))` |
| `z.object({}).catchall(z.string())` | `z.catchall(z.object({}), z.string())` |

## Checks

In Zod Mini, validations and transforms are passed via `.check()`:

```ts
z.string().check(z.minLength(5), z.maxLength(10), z.trim());
z.number().check(z.gt(5), z.positive());
z.file().check(z.minSize(10_000), z.maxSize(1_000_000), z.mime("image/png"));
```

### Available checks

```ts
z.lt(value);
z.lte(value);            // alias: z.maximum()
z.gt(value);
z.gte(value);            // alias: z.minimum()
z.positive();
z.negative();
z.nonpositive();
z.nonnegative();
z.multipleOf(value);
z.maxSize(value);
z.minSize(value);
z.size(value);
z.maxLength(value);
z.minLength(value);
z.length(value);
z.regex(regex);
z.lowercase();
z.uppercase();
z.includes(value);
z.startsWith(value);
z.endsWith(value);
z.property(key, schema);
z.mime(value);

// custom checks
z.refine();
z.superRefine();

// mutations (don't change inferred type)
z.overwrite(value => newValue);
z.normalize();
z.trim();
z.toLowerCase();
z.toUpperCase();

// metadata
z.meta({ title: "...", description: "..." });
z.describe("...");
```

## Accessing internals

```ts
// Zod
schema.shape.name;
schema.unwrap();      // for optional/nullable
schema.options;       // for unions

// Zod Mini
schema.def.shape.name;
schema.def.innerType; // for optional/nullable
schema.def.options;   // for unions
```

## No Default Locale

Zod Mini does NOT auto-load English locale. All issue messages default to `"Invalid input"`.

```ts
import * as z from "zod/mini";
z.config(z.locales.en()); // load English locale
```

## When to Use

- Uncommonly strict bundle size constraints (client-side)
- Regular Zod core: ~5.36kb gzipped
- Zod Mini core: ~1.88kb gzipped
- NOT worth it for backend/Lambda (adds <1ms cold start)
- NOT worth it unless optimizing for slow mobile connections
