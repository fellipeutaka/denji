---
name: zod
description: |
  Zod 4 — TypeScript-first schema validation with static type inference. Use when writing Zod schemas, validating data, defining types with Zod, parsing input,
  creating form validation schemas, defining API request/response schemas, working with z.object, z.string, z.number, z.enum, z.array, z.union, z.discriminatedUnion,
  z.file, z.jwt, z.email, z.uuid, z.url, z.codec, z.toJSONSchema, z.fromJSONSchema, z.int, z.stringbool, z.templateLiteral, z.record, z.partialRecord,
  or any other Zod API. Also use when migrating from Zod 3 to Zod 4, or when the user's package.json shows zod@^4.
  CRITICAL: Always use Zod 4 APIs. Never use deprecated Zod 3 patterns unless user explicitly requests Zod 3 compatibility.
---

# Zod 4

TypeScript-first schema validation. 2kb core bundle (gzipped). Zero dependencies.

**CRITICAL**: Zod 4 is the current stable version (`zod@^4.0.0`). Always write Zod 4 code. Never use deprecated Zod 3 patterns.

## Import

```ts
import * as z from "zod";
```

For tree-shakable variant (smaller bundles):
```ts
import * as z from "zod/mini";
```

## Core Patterns

### Parsing

```ts
schema.parse(data);           // throws ZodError on failure
schema.safeParse(data);       // returns { success, data?, error? }
await schema.parseAsync(data);
await schema.safeParseAsync(data);
```

### Type Inference

```ts
type MyType = z.infer<typeof mySchema>;    // output type
type MyInput = z.input<typeof mySchema>;   // input type
type MyOutput = z.output<typeof mySchema>; // same as z.infer
```

### Primitives

```ts
z.string();
z.number();      // finite numbers only (no Infinity, no NaN)
z.bigint();
z.boolean();
z.symbol();
z.undefined();
z.null();
z.date();
z.nan();
```

### Coercion

```ts
z.coerce.string();    // String(input)
z.coerce.number();    // Number(input)
z.coerce.boolean();   // Boolean(input)
z.coerce.bigint();    // BigInt(input)
z.coerce.date();      // new Date(input)
```

## String Formats (Top-Level)

Use top-level functions, NOT methods. Methods like `z.string().email()` are **deprecated**.

```ts
// CORRECT (Zod 4)
z.email();
z.uuid();
z.url();
z.httpUrl();
z.hostname();
z.emoji();
z.base64();
z.base64url();
z.hex();
z.jwt();
z.nanoid();
z.cuid();
z.cuid2();
z.ulid();
z.ipv4();
z.ipv6();
z.mac();
z.cidrv4();
z.cidrv6();
z.hash("sha256");     // "sha1" | "sha384" | "sha512" | "md5"
z.e164();              // phone numbers
z.iso.date();
z.iso.time();
z.iso.datetime();
z.iso.duration();

// DEPRECATED (Zod 3 style — do NOT use)
z.string().email();    // ❌
z.string().uuid();     // ❌
z.string().url();      // ❌
```

### UUID versions

```ts
z.uuid();                    // any RFC 9562/4122 UUID
z.uuid({ version: "v4" });  // specific version
z.uuidv4();                  // convenience
z.uuidv6();
z.uuidv7();
z.guid();                    // any 8-4-4-4-12 hex pattern (less strict)
```

### Custom email regex

```ts
z.email();                                     // default (Gmail rules)
z.email({ pattern: z.regexes.html5Email });    // browser-style
z.email({ pattern: z.regexes.rfc5322Email });  // RFC 5322
z.email({ pattern: z.regexes.unicodeEmail });  // intl emails
```

### JWTs

```ts
z.jwt();
z.jwt({ alg: "HS256" });
```

## Numbers & Integers

```ts
z.number();      // any finite number
z.int();         // safe integer range
z.int32();       // int32 range
z.float32();     // float32 range
z.float64();     // float64 range

// bigint variants
z.bigint();
z.int64();
z.uint64();
```

### Number validations

```ts
z.number().gt(5);
z.number().gte(5);          // alias: .min(5)
z.number().lt(5);
z.number().lte(5);          // alias: .max(5)
z.number().positive();
z.number().nonnegative();
z.number().negative();
z.number().nonpositive();
z.number().multipleOf(5);   // alias: .step(5)
```

### String validations

```ts
z.string().max(5);
z.string().min(5);
z.string().length(5);
z.string().regex(/pattern/);
z.string().startsWith("abc");
z.string().endsWith("xyz");
z.string().includes("---");
z.string().uppercase();
z.string().lowercase();
z.string().trim();
z.string().toLowerCase();
z.string().toUpperCase();
z.string().normalize();
```

## Objects

```ts
z.object({ name: z.string(), age: z.number() });          // strips unknown keys
z.strictObject({ name: z.string() });                      // errors on unknown keys
z.looseObject({ name: z.string() });                       // passes unknown keys through
```

**Deprecated**: `.strict()`, `.passthrough()`, `.strip()`, `.merge()`, `.deepPartial()`.

### Object methods

```ts
schema.extend({ newField: z.string() });    // add fields
schema.pick({ name: true });                // pick fields
schema.omit({ age: true });                 // omit fields
schema.partial();                           // all optional
schema.partial({ name: true });             // some optional
schema.required();                          // all required
schema.keyof();                             // ZodEnum from keys
schema.shape.name;                          // access inner schema
```

Prefer spread syntax for best tsc performance:
```ts
z.object({ ...Base.shape, ...Extra.shape, newField: z.string() });
```

### Recursive objects

```ts
const Category = z.object({
  name: z.string(),
  get subcategories() {
    return z.array(Category);
  },
});
```

## Enums

```ts
z.enum(["A", "B", "C"]);               // string enum
z.enum(MyTSEnum);                       // TypeScript enum (replaces z.nativeEnum())
z.enum({ A: 0, B: 1 } as const);       // enum-like object
```

**Deprecated**: `z.nativeEnum()`. Use `z.enum()` instead.

## Arrays, Tuples, Sets, Maps

```ts
z.array(z.string());
z.array(z.string()).min(1).max(10).length(5);
z.tuple([z.string(), z.number()]);
z.tuple([z.string()], z.number());    // variadic: [string, ...number[]]
z.set(z.number());
z.map(z.string(), z.number());
```

## Unions & Intersections

```ts
z.union([z.string(), z.number()]);
z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), data: z.string() }),
  z.object({ status: z.literal("err"), error: z.string() }),
]);
z.xor([z.string(), z.number()]);          // exclusive union (exactly one match)
z.intersection(schemaA, schemaB);
```

## Records

```ts
z.record(z.string(), z.number());                    // Record<string, number>
z.record(z.enum(["a", "b"]), z.string());            // exhaustive: { a: string; b: string }
z.partialRecord(z.enum(["a", "b"]), z.string());     // partial: { a?: string; b?: string }
z.looseRecord(z.string().regex(/^x_/), z.number());  // pass through non-matching keys
```

**Breaking**: `z.record(z.string())` single-arg form is removed. Always pass both key and value schemas.

## Literals

```ts
z.literal("hello");
z.literal(42);
z.literal(true);
z.literal(["a", "b", "c"]);   // multi-value literal (new in Zod 4)
```

## Files

```ts
z.file();
z.file().min(10_000);                          // min size in bytes
z.file().max(1_000_000);                       // max size in bytes
z.file().mime("image/png");                    // single MIME
z.file().mime(["image/png", "image/jpeg"]);    // multiple MIMEs
```

## Stringbool

```ts
z.stringbool();    // "true"/"yes"/"1"/"on"/"y"/"enabled" → true, inverses → false
z.stringbool({ truthy: ["yes", "y"], falsy: ["no", "n"] });
z.stringbool({ case: "sensitive" });
```

## Template Literals

```ts
z.templateLiteral(["hello, ", z.string()]);                    // `hello, ${string}`
z.templateLiteral([z.number(), z.enum(["px", "em", "rem"])]);  // `${number}px` | ...
```

## Optionals, Nullables, Defaults

```ts
z.optional(z.string());          // or z.string().optional()
z.nullable(z.string());          // or z.string().nullable()
z.nullish(z.string());           // optional + nullable

z.string().default("hello");     // short-circuits on undefined, returns output type
z.string().prefault("hello");    // pre-parse default, runs through validation
z.number().catch(42);            // fallback on any validation error
```

**Breaking**: `.default()` now expects output type, not input type. Use `.prefault()` for old behavior.

## Transforms & Pipes

```ts
z.transform((val) => String(val));                      // standalone transform
z.string().transform((val) => val.length);              // pipe string → transform
z.preprocess((val) => String(val), z.string());         // transform → pipe to schema
z.string().pipe(z.transform((val) => val.length));      // explicit pipe

// .overwrite() — transform without changing inferred type
z.number().overwrite((val) => val ** 2);
```

## Codecs (Bidirectional Transforms)

New in Zod 4.1. Define encode/decode pairs:

```ts
const stringToDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (s) => new Date(s),
  encode: (d) => d.toISOString(),
});

stringToDate.decode("2024-01-15T10:30:00.000Z");  // → Date
stringToDate.encode(new Date());                    // → string
stringToDate.parse("2024-01-15T10:30:00.000Z");    // → Date (same as decode at runtime)
```

## Error Customization

Use unified `error` param (replaces `message`, `errorMap`, `invalid_type_error`, `required_error`):

```ts
z.string().min(5, { error: "Too short" });
z.string({ error: (issue) => issue.input === undefined ? "Required" : "Not a string" });
z.string({ error: (issue) => {
  if (issue.code === "too_small") return `Min ${issue.minimum}`;
}});
```

**Deprecated**: `message`, `errorMap`, `invalid_type_error`, `required_error`.

## Metadata & Registries

```ts
z.string().meta({ id: "email", title: "Email", description: "User email" });
z.string().describe("A description");      // shorthand for .meta({ description: ... })

// Custom registries
const myReg = z.registry<{ description: string }>();
z.string().register(myReg, { description: "..." });
```

## JSON Schema

```ts
z.toJSONSchema(schema);                                        // Zod → JSON Schema
z.toJSONSchema(schema, { target: "draft-07" });                // specific draft
z.toJSONSchema(schema, { target: "openapi-3.0" });             // OpenAPI 3.0
z.fromJSONSchema(jsonSchema);                                  // JSON Schema → Zod (experimental)
```

## Refinements

```ts
z.string().refine((val) => val.includes("@"), { error: "Must contain @" });
z.string().refine((val) => val.includes("@"), { error: "...", abort: true }); // stop on failure
z.array(z.string()).superRefine((val, ctx) => {
  ctx.addIssue({ code: "custom", message: "...", input: val });
});
```

Refinements now live inside schemas (not `ZodEffects` wrapper). You can interleave `.refine()` with other methods:
```ts
z.string().refine(v => v.includes("@")).min(5);  // works in Zod 4!
```

## Error Pretty-Printing

```ts
z.prettifyError(zodError);   // formatted multi-line string
z.treeifyError(zodError);    // tree structure (replaces .format() and .flatten())
```

## Further Reference

- **Zod Mini**: See [references/zod-mini.md](references/zod-mini.md) for tree-shakable API differences, `.check()` usage, and bundle size tradeoffs
- **Codecs**: See [references/codecs.md](references/codecs.md) for bidirectional transforms, encoding behavior, and common codec patterns (stringToDate, jsonCodec, etc.)
- **JSON Schema**: See [references/json-schema.md](references/json-schema.md) for `z.toJSONSchema()` options, format conversion, registry-based multi-schema, and `z.fromJSONSchema()`
- **Advanced patterns**: See [references/advanced.md](references/advanced.md) for registries, refinement `when`, `.superRefine()`, `.check()`, functions, branded types, readonly, custom schemas, and advanced string/object/record/union options
- **Migration from Zod 3**: See [references/migration.md](references/migration.md) for all breaking changes and deprecated APIs
