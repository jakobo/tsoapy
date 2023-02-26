# tsoapy - Type-Safe OpenAPI Calls

> Build upon your [openapi-typescript](https://github.com/drwpow/openapi-typescript) files with a simple REST client.

# Usage

Taken from the [./examples/petstore.ts](Pet Store Example)

```ts
import { paths } from "../__generated__/petstore";
import { tsoapy } from "../";

const client = tsoapy<paths>(new URL("https://example.com/api/petstore"));

async function examples() {
  const r1 = await client
    .path("/store/order") // <= restricted to available paths
    .method("post") // <= restricted to methods for your path
    .body({
      // <= automatically typed to your request's Mime Type
      id: 123,
      petId: 456,
      quantity: 1,
      shipDate: "2023-02-25T00:00:00Z",
      status: "placed",
      complete: false,
    })
    .send(); // <= send the data and get a fully typed response

  if (r1.success) {
    // quickly check a status === 200
  }

  if (r1.status === 200) {
    // or do more detailed checks on the status code
    r1.data.id; // <= from response
  } else {
    r1.data;
  }
}
```

# Stuff Still To Do

- Tests (maybe using MSW as the network is at the heart of this)
- There's a coercion of `number` to `ResultCodeOf<T, P, M>` which I can't seem to get right
