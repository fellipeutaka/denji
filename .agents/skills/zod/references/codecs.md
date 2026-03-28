# Codecs (Bidirectional Transforms)

New in Zod 4.1. Define encode/decode pairs for bidirectional data transformation.

## Creating a Codec

```ts
const stringToDate = z.codec(
  z.iso.datetime(),     // input schema
  z.date(),             // output schema
  {
    decode: (isoString) => new Date(isoString),   // Input → Output
    encode: (date) => date.toISOString(),          // Output → Input
  }
);
```

## Methods

```ts
schema.parse(input);            // forward transform (untyped input, like decode)
schema.decode(input);           // forward: Input → Output (typed input)
schema.encode(output);          // backward: Output → Input (typed input)

// safe variants
schema.safeDecode(input);
schema.safeEncode(output);

// async variants
schema.decodeAsync(input);
schema.encodeAsync(output);
schema.safeDecodeAsync(input);
schema.safeEncodeAsync(output);
```

## Encoding Behavior Rules

- **Codecs**: decode runs forward, encode runs backward
- **Pipes**: encoding reverses direction (B first, then A)
- **Refinements**: executed in both directions
- **Defaults/prefaults**: only applied during decode (forward)
- **Catch**: only applied during decode (forward)
- **`.transform()`**: **throws runtime Error** during encode (unidirectional only!)
- **Stringbool**: internally a codec — `z.stringbool().encode(true)` → `"true"`

## Composability

Codecs nest inside objects, arrays, pipes, etc:

```ts
const payload = z.object({ startDate: stringToDate });

payload.decode({ startDate: "2024-01-15T10:30:00.000Z" });
// => { startDate: Date }

payload.encode({ startDate: new Date() });
// => { startDate: "2024-..." }
```

## Common Codec Patterns

### String to Number

```ts
const stringToNumber = z.codec(z.string().regex(z.regexes.number), z.number(), {
  decode: (str) => Number.parseFloat(str),
  encode: (num) => num.toString(),
});
```

### String to Integer

```ts
const stringToInt = z.codec(z.string().regex(z.regexes.integer), z.int(), {
  decode: (str) => Number.parseInt(str, 10),
  encode: (num) => num.toString(),
});
```

### String to BigInt

```ts
const stringToBigInt = z.codec(z.string(), z.bigint(), {
  decode: (str) => BigInt(str),
  encode: (bigint) => bigint.toString(),
});
```

### ISO Datetime to Date

```ts
const isoToDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (s) => new Date(s),
  encode: (d) => d.toISOString(),
});
```

### Epoch Seconds to Date

```ts
const epochSecondsToDate = z.codec(z.int().min(0), z.date(), {
  decode: (seconds) => new Date(seconds * 1000),
  encode: (date) => Math.floor(date.getTime() / 1000),
});
```

### Epoch Millis to Date

```ts
const epochMillisToDate = z.codec(z.int().min(0), z.date(), {
  decode: (millis) => new Date(millis),
  encode: (date) => date.getTime(),
});
```

### JSON String Codec

```ts
const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try { return JSON.parse(jsonString); }
      catch (err: any) {
        ctx.issues.push({
          code: "invalid_format",
          format: "json",
          input: jsonString,
          message: err.message,
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });

// Usage
const jsonToObject = jsonCodec(z.object({ name: z.string() }));
jsonToObject.decode('{"name":"Alice"}');  // => { name: "Alice" }
jsonToObject.encode({ name: "Bob" });     // => '{"name":"Bob"}'
```

### String to URL

```ts
const stringToURL = z.codec(z.url(), z.instanceof(URL), {
  decode: (s) => new URL(s),
  encode: (url) => url.href,
});
```

### String to HTTP URL

```ts
const stringToHttpURL = z.codec(z.httpUrl(), z.instanceof(URL), {
  decode: (s) => new URL(s),
  encode: (url) => url.href,
});
```

### Base64 to Bytes

```ts
const base64ToBytes = z.codec(z.base64(), z.instanceof(Uint8Array), {
  decode: (s) => z.util.base64ToUint8Array(s),
  encode: (bytes) => z.util.uint8ArrayToBase64(bytes),
});
```

### Hex to Bytes

```ts
const hexToBytes = z.codec(z.hex(), z.instanceof(Uint8Array), {
  decode: (s) => z.util.hexToUint8Array(s),
  encode: (bytes) => z.util.uint8ArrayToHex(bytes),
});
```

### URI Component

```ts
const uriComponent = z.codec(z.string(), z.string(), {
  decode: (s) => decodeURIComponent(s),
  encode: (s) => encodeURIComponent(s),
});
```
