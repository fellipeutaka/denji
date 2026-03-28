# JSON Schema Conversion

Zod 4 provides native JSON Schema conversion via `z.toJSONSchema()` and `z.fromJSONSchema()`.

## `z.toJSONSchema(schema, options?)`

```ts
z.toJSONSchema(z.object({ name: z.string(), age: z.number() }));
// => {
//   type: "object",
//   properties: { name: { type: "string" }, age: { type: "number" } },
//   required: ["name", "age"],
//   additionalProperties: false,
// }
```

## Options

```ts
interface ToJSONSchemaParams {
  target?: "draft-04" | "draft-07" | "draft-2020-12" | "openapi-3.0";
  io?: "input" | "output";                  // default: "output"
  metadata?: $ZodRegistry<Record<string, any>>;
  unrepresentable?: "throw" | "any";        // default: "throw"
  cycles?: "ref" | "throw";                 // default: "ref"
  reused?: "ref" | "inline";               // default: "inline"
  uri?: (id: string) => string;
  override?: (ctx: { zodSchema; jsonSchema }) => void;
}
```

### `io`

```ts
const s = z.string().transform(v => v.length).pipe(z.number());
z.toJSONSchema(s);                       // => { type: "number" }
z.toJSONSchema(s, { io: "input" });      // => { type: "string" }
```

### `target`

```ts
z.toJSONSchema(schema, { target: "draft-07" });
z.toJSONSchema(schema, { target: "draft-2020-12" });    // default
z.toJSONSchema(schema, { target: "draft-04" });
z.toJSONSchema(schema, { target: "openapi-3.0" });
```

### `override`

Custom conversion logic:

```ts
z.toJSONSchema(z.date(), {
  unrepresentable: "any",
  override: (ctx) => {
    if (ctx.zodSchema._zod.def.type === "date") {
      ctx.jsonSchema.type = "string";
      ctx.jsonSchema.format = "date-time";
    }
  },
});
```

## Unrepresentable Types

These have no JSON Schema equivalent (throw by default):

```ts
z.bigint();  z.int64();  z.symbol();  z.undefined();
z.void();    z.date();   z.map();     z.set();
z.transform();  z.nan();  z.custom();
```

Use `unrepresentable: "any"` to convert them to `{}`.

## String Format Conversion

```ts
z.email();           // => { type: "string", format: "email" }
z.iso.datetime();    // => { type: "string", format: "date-time" }
z.iso.date();        // => { type: "string", format: "date" }
z.iso.time();        // => { type: "string", format: "time" }
z.iso.duration();    // => { type: "string", format: "duration" }
z.ipv4();            // => { type: "string", format: "ipv4" }
z.ipv6();            // => { type: "string", format: "ipv6" }
z.uuid();            // => { type: "string", format: "uuid" }
z.url();             // => { type: "string", format: "uri" }
z.base64();          // => { type: "string", contentEncoding: "base64" }
```

## Numeric Types

```ts
z.number();    // => { type: "number" }
z.int();       // => { type: "integer" }
z.float32();   // => { type: "number", exclusiveMinimum: ..., exclusiveMaximum: ... }
z.int32();     // => { type: "integer", exclusiveMinimum: ..., exclusiveMaximum: ... }
```

## Object Schemas

- `z.object()` → `additionalProperties: false` (output mode)
- `z.looseObject()` → no `additionalProperties`
- `z.strictObject()` → always `additionalProperties: false`
- `io: "input"` → no `additionalProperties` set

## File Schemas

```ts
z.file();
// => { type: "string", format: "binary", contentEncoding: "binary" }

z.file().min(1).max(1024 * 1024).mime("image/png");
// => { type: "string", format: "binary", contentEncoding: "binary",
//      contentMediaType: "image/png", minLength: 1, maxLength: 1048576 }
```

## Registry-Based Multi-Schema

Pass a registry to convert multiple schemas with cross-references:

```ts
z.globalRegistry.add(User, { id: "User" });
z.globalRegistry.add(Post, { id: "Post" });

z.toJSONSchema(z.globalRegistry);
// => { schemas: { User: {..., posts: { $ref: "Post" }}, Post: {...} } }

z.toJSONSchema(z.globalRegistry, {
  uri: (id) => `https://example.com/${id}.json`,
});
```

All schemas must have a registered `id`. Schemas without `id` are ignored.

## `z.fromJSONSchema()` (Experimental)

```ts
const zodSchema = z.fromJSONSchema({
  type: "object",
  properties: { name: { type: "string" }, age: { type: "number" } },
  required: ["name", "age"],
});
```

Not considered part of stable API. May change in future releases.
