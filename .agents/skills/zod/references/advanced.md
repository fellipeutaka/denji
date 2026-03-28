# Advanced Zod 4 Patterns

## Table of Contents

- [Metadata & Registries](#metadata--registries)
- [Refinements — Advanced](#refinements--advanced)
- [Functions](#functions)
- [Custom Schemas](#custom-schemas)
- [Readonly](#readonly)
- [Branded Types](#branded-types)
- [JSON Type](#json-type)
- [Error Handling](#error-handling)
- [String Formats — Advanced Options](#string-formats--advanced-options)
- [Objects — Advanced](#objects--advanced)
- [Records — Advanced](#records--advanced)
- [Discriminated Unions — Advanced](#discriminated-unions--advanced)
- [Apply](#apply)

---

## Metadata & Registries

### Global registry

```ts
z.globalRegistry.add(schema, { id: "my_id", title: "My Schema", description: "..." });
z.globalRegistry.has(schema);
z.globalRegistry.get(schema);
z.globalRegistry.remove(schema);
z.globalRegistry.clear();
```

### `.meta()` and `.describe()`

```ts
z.string().meta({ id: "email", title: "Email" });   // returns new instance
z.string().meta();                                     // retrieve metadata
z.string().describe("An email");                       // shorthand for .meta({ description })
```

### `.register()`

Returns the ORIGINAL schema (not a new instance — unique behavior):

```ts
const schema = z.string();
schema.register(myRegistry, { description: "..." }); // returns schema
```

### Custom registries

```ts
const myReg = z.registry<{ description: string }>();

// Reference inferred types
const typedReg = z.registry<{ examples: z.$output[] }>();
typedReg.add(z.string(), { examples: ["hello", "world"] });

// Constrain schema types
const stringReg = z.registry<{ desc: string }, z.ZodString>();
stringReg.add(z.number(), { desc: "..." }); // ❌ type error
```

### Augmenting GlobalMeta

```ts
// zod.d.ts
declare module "zod" {
  interface GlobalMeta {
    examples?: unknown[];
  }
}
export {};
```

---

## Refinements — Advanced

### `.refine()` with `when`

Control when refinements execute:

```ts
const schema = z.object({
  password: z.string().min(8),
  confirm: z.string(),
  other: z.string(),
}).refine((data) => data.password === data.confirm, {
  error: "Passwords don't match",
  path: ["confirm"],
  when(payload) {
    return schema.pick({ password: true, confirm: true })
      .safeParse(payload.value).success;
  },
});
```

### `.superRefine()`

Create multiple issues with specific codes:

```ts
z.array(z.string()).superRefine((val, ctx) => {
  if (val.length > 3) {
    ctx.addIssue({
      code: "too_big",
      maximum: 3,
      origin: "array",
      inclusive: true,
      message: "Too many items",
      input: val,
    });
  }
});
```

### `.check()` (low-level)

```ts
z.array(z.string()).check((ctx) => {
  if (ctx.value.length > 3) {
    ctx.issues.push({
      code: "too_big",
      maximum: 3,
      origin: "array",
      inclusive: true,
      message: "Too many items",
      input: ctx.value,
    });
  }
});
```

---

## Functions

```ts
const MyFn = z.function({
  input: [z.string(), z.number()],   // must be array or ZodTuple
  output: z.string(),                 // optional
});

const impl = MyFn.implement((a, b) => `${a}: ${b}`);
const asyncImpl = MyFn.implementAsync(async (a, b) => `${a}: ${b}`);
```

No longer a Zod schema — standalone function factory.

---

## Custom Schemas

```ts
const px = z.custom<`${number}px`>((val) => {
  return typeof val === "string" ? /^\d+px$/.test(val) : false;
});
```

---

## Readonly

```ts
// Zod
z.object({ name: z.string() }).readonly();   // Readonly<{ name: string }>
z.array(z.string()).readonly();               // readonly string[]

// Zod Mini
z.readonly(z.object({ name: z.string() }));
```

Result is frozen with `Object.freeze()`.

---

## Branded Types

```ts
const USD = z.string().brand<"USD">();
type USD = z.infer<typeof USD>;  // string & z.$brand<"USD">

// Brand direction (v4.2+)
z.string().brand<"Cat", "out">();    // output branded (default)
z.string().brand<"Cat", "in">();     // input branded
z.string().brand<"Cat", "inout">(); // both branded
```

---

## JSON Type

```ts
z.json();  // validates any JSON-encodable value (string | number | boolean | null | array | object)
```

---

## Error Handling

### `z.prettifyError()`

```ts
z.prettifyError(zodError);
// ✖ Invalid input: expected string, received number
//   → at username
```

### `z.treeifyError()`

Replaces `.format()` and `.flatten()` (both deprecated).

### Issue types (Zod 4)

```ts
z.core.$ZodIssueInvalidType
z.core.$ZodIssueTooBig
z.core.$ZodIssueTooSmall
z.core.$ZodIssueInvalidStringFormat
z.core.$ZodIssueNotMultipleOf
z.core.$ZodIssueUnrecognizedKeys
z.core.$ZodIssueInvalidValue
z.core.$ZodIssueInvalidUnion
z.core.$ZodIssueInvalidKey        // for z.record/z.map
z.core.$ZodIssueInvalidElement    // for z.map/z.set
z.core.$ZodIssueCustom
```

### Base issue interface

```ts
interface $ZodIssueBase {
  readonly code?: string;
  readonly input?: unknown;
  readonly path: PropertyKey[];
  readonly message: string;
}
```

---

## String Formats — Advanced Options

### ISO Datetime

```ts
z.iso.datetime();                          // UTC only
z.iso.datetime({ offset: true });          // allow +02:00
z.iso.datetime({ local: true });           // allow no timezone
z.iso.datetime({ precision: 0 });          // seconds only
z.iso.datetime({ precision: 3 });          // milliseconds
z.iso.datetime({ precision: -1 });         // minutes (no seconds)
```

### ISO Time

```ts
z.iso.time();                              // HH:MM[:SS[.s+]]
z.iso.time({ precision: 0 });             // HH:MM:SS
z.iso.time({ precision: 3 });             // HH:MM:SS.sss
z.iso.time({ precision: -1 });            // HH:MM
```

### URLs

```ts
z.url();                                   // any WHATWG URL
z.httpUrl();                               // http/https only
z.url({ hostname: /^example\.com$/ });
z.url({ protocol: /^https$/ });
z.url({ normalize: true });               // normalize via new URL().href

// Custom web URL
z.url({ protocol: /^https?$/, hostname: z.regexes.domain });
```

### MAC, Hashes, Custom Formats

```ts
z.mac();
z.mac({ delimiter: "-" });

z.hash("sha256");
z.hash("sha256", { enc: "base64" });
z.hash("sha256", { enc: "base64url" });

// Custom string format
z.stringFormat("cool-id", (val) => val.startsWith("cool-"));
z.stringFormat("cool-id", /^cool-[a-z0-9]+$/);
```

---

## Objects — Advanced

### `.safeExtend()`

Won't overwrite with incompatible type. Works with refined schemas:

```ts
const Base = z.object({ a: z.string() }).refine(/* ... */);
Base.safeExtend({ a: z.string().min(10) });   // ✅
Base.safeExtend({ a: z.number() });           // ❌ type error
```

### `.catchall()`

```ts
z.object({ name: z.string() }).catchall(z.string());
// Zod Mini: z.catchall(z.object({ name: z.string() }), z.string());
```

---

## Records — Advanced

### Numeric keys (v4.2+)

```ts
z.record(z.number(), z.string());           // validates numeric string keys
z.record(z.int().min(0).max(10), z.string()); // with constraints
```

### `z.looseRecord()`

Pass through non-matching keys:

```ts
z.object({ name: z.string() })
  .and(z.looseRecord(z.string().regex(/_phone$/), z.e164()));
```

---

## Discriminated Unions — Advanced

Supports nesting, pipes, union discriminators:

```ts
const Errors = z.discriminatedUnion("code", [
  z.object({ status: z.literal("failed"), code: z.literal(400) }),
  z.object({ status: z.literal("failed"), code: z.literal(500) }),
]);

const Result = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  Errors,  // nested discriminated union
]);
```

---

## Apply

Incorporate external functions into method chains:

```ts
function setNumberChecks<T extends z.ZodNumber>(schema: T) {
  return schema.min(0).max(100);
}

z.number().apply(setNumberChecks).nullable();
```
