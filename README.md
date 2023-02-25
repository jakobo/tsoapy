# tsoapy - Type-Safe OpenAPI Calls

> Build upon your [openapi-typescript](https://github.com/drwpow/openapi-typescript) files with a simple REST client.

# Usage

```ts
import { paths } from "./generated/type/file";
import { tsoapy } from "tsoapy";

const client = tsoapy<paths>(new URL("https://example.com/api/endpoint"));

const result = await client.path("/openapi/path").post({
  // data is typed
  ...data,
});

// result is a discriminated union
if (result.success) {
  // result.status is 200
  // result.data contains the openapi response body, fully typed
}

// or, check it explicitly
if (result.status === 200) {
  // result.data contains the openapi response body for a 200 response, fully typed
}
```

# Limitations

- Only works with `application/json` right now.
- Path substitution _should_ work if you used `--path-params-as-types` in `openapi-typescript`
