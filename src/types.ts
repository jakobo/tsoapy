// helper to simplify accessing the type of the value of an object
type ValueOf<T> = T[keyof T];

/**
 * Extends the base fetch options with the ability to override our
 * fetch function
 */
export type ExtendedRequestInit = RequestInit & {
  fetch?: unknown;
};

/**
 * Describes the OpenAPI `paths` object in generic terms
 * These are based on the type generation from
 * https://github.com/drwpow/openapi-typescript, which exports
 * a `paths` object for our template. The returned type gives us
 * a structure that is used for subsequent generics because we
 * can assume T conforms to this shape.
 * @template T the openapi-typescript paths object
 */
export type OAPIPaths<T> = {
  [P in keyof T]: {
    [M in keyof T[P]]: {
      requestBody?: {
        content: unknown;
      };
      responses: {
        [S: number]: {
          content: {
            [contentType: string]: unknown;
          };
        };
      };
    };
  };
};

/**
 * Get all available Paths
 * 1. for a given an OpenAPI paths type
 */
export type PathIn<T extends OAPIPaths<T>> = keyof T;

/**
 * Get all available Methods
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 */
export type MethodIn<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>
> = keyof T[P];

/**
 * Get all available request Content Types
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 */
export type RequestContentType<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>
> = T[P][M] extends {
  // try path.requestBody?.content
  requestBody?: {
    content: infer MT;
  };
}
  ? keyof MT
  : // try path.requestBody.content
  T[P][M] extends {
      requestBody: {
        content: infer ContentTypes;
      };
    }
  ? keyof ContentTypes
  : // no OpenAPI 3 request bodies found
    never;

/**
 * Get all available response Content Types irrespective of response code
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 */
export type ResponseContentType<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>
> = T[P][M] extends {
  responses: {
    [code: number]: {
      content: infer MT;
    };
  };
}
  ? keyof MT
  : never;

/**
 * Get the collection of Parameter substituions available
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 */
export type ParamsIn<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>
> = T[P][M] extends {
  parameters: {
    path: infer S;
  };
}
  ? S
  : never;

/**
 * Get the collection of Query String arguments available
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 */
export type QueryIn<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>
> = T[P][M] extends {
  parameters: {
    query: infer S;
  };
}
  ? S
  : never;

/**
 * Get a specific Type for a request
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 * 4. with the given ContentType key
 */
export type RequestOf<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>,
  RCT extends RequestContentType<T, P, M> = RequestContentType<T, P, M>
> = T[P][M] extends {
  requestBody?: {
    content: {
      [contentType in RCT]: infer O;
    };
  };
}
  ? O
  : never;

/**
 * The flexible builder API allows you to configure your request before sending.
 * It's customized
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 * 4. with the given ContentType key from .method() further up the API chain
 */
export type BuilderAPI<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>,
  SCT extends RequestContentType<T, P, M> = RequestContentType<T, P, M>
> = {
  /**
   * Set parameters on the request, such as /pet/{petId}
   * 1. for a given OpenAPI paths type
   * 2. with a given Path key
   * 3. with the given Method key
   * 4. for the given ContentType key from .method()
   */
  params: <PI extends ParamsIn<T, P, M>>(
    params: PI
  ) => BuilderAPI<T, P, M, SCT>;
  /**
   * Add query string key/value pairs to the request such as /pet/{petId}?confirm=2023
   * 1. for a given OpenAPI paths type
   * 2. with a given Path key
   * 3. with the given Method key
   * 4. for the given ContentType key from .method()
   */
  query: <QS extends QueryIn<T, P, M>>(query: QS) => BuilderAPI<T, P, M, SCT>;
  /**
   * Set the body for the request
   * 1. for a given OpenAPI paths type
   * 2. with a given Path key
   * 3. with the given Method key
   * 4. for the given ContentType key from .method()
   */
  body: <RQ extends RequestOf<T, P, M, SCT> = RequestOf<T, P, M, SCT>>(
    request?: RQ
  ) => BuilderAPI<T, P, M, SCT>;
  /**
   * Send the request via `fetch` and receive a promised response containing `status` and `data`, typed
   * 1. for a given OpenAPI paths type
   * 2. with a given Path key
   * 3. with the given Method key
   * 4. with the Response ContentType inferred from `contentType` if set
   *
   * @argument options Additional `fetch` options to add to the request
   * @argument contentType A content type valid for this builder
   * @argument deserialize A function that given `(text:string, status:number)` returns an object containing the `status` and `data` props
   */
  send: <
    RCT extends ResponseContentType<T, P, M> = RequestContentType<T, P, M>
  >(
    options?: RequestInit,
    contentType?: RCT,
    deserialize?: Deserializer<T, P, M, RCT>
  ) => Promise<RS<T, P, M, RCT>>;
};

/**
 * Serialize from a JS object to your requested ContentType format
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 * 4. with a given Request Content Type key
 */
export type Serializer<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>,
  RCT extends RequestContentType<T, P, M> = RequestContentType<T, P, M>
> = (input: RequestOf<T, P, M, RCT>) => string;

/**
 * Deserialize from text to a JS object
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 * 4. with an object structure matching a valid ResponseContentType
 */
export type Deserializer<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>,
  RCT extends ResponseContentType<T, P, M> = RequestContentType<T, P, M>
> = (
  input: string,
  status: ResultCodeOf<T, P, M>
) => DeserializeResponse<T, P, M, RCT>;

// helper: Used to split the deserialized response from the RS object
// it's likely these can drift, so it is useful to call it out separately
// for now.
type DeserializeResponse<
  T extends OAPIPaths<T>,
  P extends PathIn<T>,
  M extends MethodIn<T, P>,
  ContentType extends ResponseContentType<T, P, M>
> = RS<T, P, M, ContentType>;

/**
 * Extract the status code keys as a union such as `200 | 403`
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 */
export type ResultCodeOf<
  T extends OAPIPaths<T>,
  P extends PathIn<T>,
  M extends MethodIn<T, P>
> = T[P][M] extends {
  responses: {
    [Code in infer C extends number]: unknown;
  };
}
  ? C
  : never;

/**
 * Generates a discrinimated union suitable for a developer to interpret
 * a tsoapy response
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with a given Method key
 * 4. with the given ContentType conforming to valid response content types
 */
export type RS<
  T extends OAPIPaths<T>,
  P extends PathIn<T>,
  M extends MethodIn<T, P>,
  ContentType extends ResponseContentType<T, P, M>
> = ValueOf<
  // get the value of "responses" infer into Res
  T[P][M] extends {
    responses: infer Res;
  }
    ? {
        // if marked as never, return status only
        [Code in keyof Res]: Res[Code] extends never
          ? { status: Code }
          : // else if it contains a content region, continue
          Res[Code] extends {
              content: infer CT;
            }
          ? // if it contains a content type match, infer data
            CT extends {
              [CType in ContentType]: infer Data;
            }
            ? // return status + data
              { status: Code; data: Data }
            : // no content type match, it is just status
              { status: Code }
          : // no content region found, it is just status
            { status: Code };
      }
    : never
>;
