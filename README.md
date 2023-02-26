<h1 align="center">
  <span style="font-size:24px">🧼 TSoapy</span><br />
  <sub><i>Type-Safe OpenAPI Calls</i></sub>
</h1>

> Create a fully-typed & lightweight client for your [openapi-typescript](https://github.com/drwpow/openapi-typescript) type definitions. Zero dependencies. 2.4k. Optimized for OpenAPI v3.

# Usage

Taken from the [Pet Store Example](https://github.com/jakobo/tsoapy/blob/main/src/examples/petstore.ts)

```ts
import { paths } from "../__generated__/petstore";
import { tsoapy } from "../";

const client = tsoapy<paths>(new URL("https://example.com/api/petstore"));

// call your api using .path().method() to select the specific endpoint you need
const r1 = await client
  .path("/store/order")
  .method("post")
  // then, include your body, set params, query string, etc
  .body({
    id: 123,
    petId: 456,
    quantity: 1,
    shipDate: "2023-02-25T00:00:00Z",
    status: "placed",
    complete: false,
  })
  // send the request and get a descriminated union as a response
  .send();

if (r1.success) {
  // quickly check a status === 200
}

if (r1.status === 200) {
  // or do more detailed checks on the status code
  r1.data.id; // <= typed from response
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
| contentType | `string` A supported content type found in `OpenAPI[path][method].requestBody.content`                                                                                                                                              |
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

#### `async .send(options?: RequestInit, contentType?: string, deserialize?: Function)`

| arg         | description                                                                                                                                                                                                                                                        |
| :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options     | `RequestInit` Additional fetch options, in addition to any specified in the original `tsoapy` call                                                                                                                                                                 |
| contentType | `string` A supported content type found in `OpenAPI[path][method].responses[*].content`                                                                                                                                                                            |
| deserialize | `function` A function that takes in a `string` and `statusCode`, and returns a value consistent with `OpenAPI[path][method].responses[statusCode].content[contentType]`. Defaults to `JSON.parse` for `application/json` and `toString()` for other content types. |

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

# Sending Content Types other than `application/json`

Tsoapy uses `application/json` by default for requests & responses. If you need to change this, you can control the input and output handing.

- **input** typing and serialization is controlled when calling `.method()`. In addition to setting the content type (which selects the `responseBody` from OpenAPI), the third parameter `serialize` allows you to pass in a custom serializer function for turning the JSON object into the requested content type, expressed as a string. Because there's a variety of content types, it's beyond Tsoapy to add custom converters for every possible serialization.
- **output** typing and deserialization is controlled when calling `.send()`. Like `method`, you can pass a content type as the second argument which maps to a content type inside of the OpenAPI `responses.[code]` collection. The third parameter `deserialize` can be a function that takes in a string and returns a JSON object conforming to the object schema on OpenAPIs side. Like serialization, adding custom deserialization goes beyond the scope of this library.

> ⚠️ **note** You'll need to specify your content type and serializer/deserializer every time, as OpenAPI is designed in a top-down method of `path => method => requestBody => content => [contentType]`, making it difficult to set on the originating call to `tsoapy()` and ensure correct typing on `method` and `send`

## Common Serializer / Deserializers

If JSON isn't sufficient and you do need to serialize / deserialize in order to talk to your OpenAPI endpoint, there are already excellent battle-tested libraries that can be dropped into tsoapy without much effort.

- `application/xml` - [xml2json](https://www.npmjs.com/package/xml2json)
- `application/x-www-form-urlencoded` - [form-urlencoded](https://www.npmjs.com/package/form-urlencoded)

# FAQ

- **Why is it so small?** Tsoapy is 90% type management. The [exported index.js](https://www.unpkg.com/tsoapy@0.0.4/dist/index.js) is the builder API, designed to build the `fetch` call in a way consistent with how you walk the OpenAPI paths object. In 0.0.4, the ESM version is 2.4kb and the CJS version is 3.43kb with the increase being the CommonJS harness provided by tsup.
- **Why not `openapi`?** [openapi](https://www.npmjs.com/package/openapi) is an excellent library, but its types are not as semantically correct as those generated by [openapi-typescript](https://github.com/drwpow/openapi-typescript). By separating type generation from runtime library, you can stop using tsoapy, go back to plain `fetch` and still take advantage of the types generated by `openapi-typescript`. This also means that tsoapy can focus on being a really good `fetch` builder.

# Stuff Still To Do

- Tests (maybe using MSW as the network is at the heart of this)
- There's a coercion of `number` to `ResultCodeOf<T, P, M>` which I can't seem to get right

# License

MIT
