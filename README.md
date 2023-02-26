<h1 align="center">
  <span style="font-size:24px">🧼 TSoapy</span><br />
  <sub><i>Type-Safe OpenAPI Calls</i></sub>
</h1>

> Build upon your [openapi-typescript](https://github.com/drwpow/openapi-typescript) files with a simple REST client. Optimized for OpenAPI v3.

# Usage

Taken from the [Pet Store Example](https://github.com/jakobo/tsoapy/blob/main/src/examples/petstore.ts)

```ts
import { paths } from "../__generated__/petstore";
import { tsoapy } from "../";

const client = tsoapy<paths>(new URL("https://example.com/api/petstore"));

// ...
const r1 = await client
  .path("/store/order")
  .method("post")
  .body({
    id: 123,
    petId: 456,
    quantity: 1,
    shipDate: "2023-02-25T00:00:00Z",
    status: "placed",
    complete: false,
  })
  .send();

if (r1.success) {
  // quickly check a status === 200
}

if (r1.status === 200) {
  // or do more detailed checks on the status code
  r1.data.id; // <= from response
} else {
  r1.data;
}
```

# API

Descriptions here provide a generic type such as `string` for clarity, but use a more complex typing in the codebase

## `tsoapy<paths>(url: URL, ctx?: ExtendedRequestInit)`

| arg | description                                                                                                |
| :-- | :--------------------------------------------------------------------------------------------------------- |
| url | `URL` The endpoint URL for your OpenAPI calls                                                              |
| ctx | Options to persist into `fetch` calls. You may also specify `ctx.fetch` to use a non-global fetch instance |

**Returns:** A tsoapy builder object containing a single `path` method.

#### `.path(path: string)`

| arg  | description                                       |
| :--- | :------------------------------------------------ |
| path | `string` A path contained in your `OpenAPI` types |

**Returns:** A tsoapy builder object containing a single `method` method.

#### `.method(method: string, contentType?: string, serialize: Function)`

| arg         | description                                                                                                                                                                                                                         |
| :---------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| method      | `string` A method contained in `OpenAPI[path]`                                                                                                                                                                                      |
| contentType | `string` A supported content type found in `OpenAPI[path][method]`                                                                                                                                                                  |
| serialize   | `function` A function that takes in the arguments of `OpenAPI[path][method].requestBody.content[contentType]` and returns a `string`. Defaults to `JSON.serialize` for `application/json` and `toString()` for other content types. |

**Returns:** A tsoapy builder object for configuring the request data, containing `params`, `query`, `body`, and `send`

#### `.params(params: object)`

| arg    | description                                                                   |
| :----- | :---------------------------------------------------------------------------- |
| params | `object` Details parameters to substitue into the url, such as `/pet/{petId}` |

**Returns:** A tsoapy builder object for configuring the request data, containing `params`, `query`, `body`, and `send`

#### `.query(query: object)`

| arg   | description                                                 |
| :---- | :---------------------------------------------------------- |
| query | `object` Details query string values to append onto the url |

**Returns:** A tsoapy builder object for configuring the request data, containing `params`, `query`, `body`, and `send`

#### `.body(body: object)`

| arg  | description                                                                                                                                                                                               |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| body | `object` Operation variables. Will be serialized to a string using the provided `serialize`, and falling back to `JSON.stringify` for the `application/json` content type and `toString()` for all others |

**Returns:** A tsoapy builder object for configuring the request data, containing `params`, `query`, `body`, and `send`

#### `async .send()`

**Returns:** A tsoapy response as a discriminated union in the following format:

```ts
{
  success: boolean;
  status: number;
  data: object;
}
```

| property | description                                                       |
| :------- | :---------------------------------------------------------------- |
| success  | `boolean` Evaluates to `true` when `status === 200`               |
| status   | `number` Discriminator based on the response code from the server |
| data     | `object` Content from the request                                 |

# Stuff Still To Do

- Tests (maybe using MSW as the network is at the heart of this)
- There's a coercion of `number` to `ResultCodeOf<T, P, M>` which I can't seem to get right

# License

MIT
