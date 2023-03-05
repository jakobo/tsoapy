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
export type OAPIPaths<Paths> = {
  [Path in keyof Paths]: {
    [Method in keyof Paths[Path]]: {
      requestBody?: {
        content: unknown;
      };
      responses: {
        [code: number]: {
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
export type PathIn<Paths extends OAPIPaths<Paths>> = keyof Paths;

/**
 * Get all available Methods
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 */
export type MethodIn<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>
> = keyof Paths[Path];

/**
 * Get all available request Content Types
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 */
export type RequestContentTypeIn<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>,
  Method extends MethodIn<Paths, Path> = MethodIn<Paths, Path>
> = Paths[Path][Method] extends {
  // try path.requestBody?.content
  requestBody?: {
    content: infer ContentTypes;
  };
}
  ? keyof ContentTypes
  : // try path.requestBody.content
  Paths[Path][Method] extends {
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
export type ResponseContentTypeIn<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>,
  Method extends MethodIn<Paths, Path> = MethodIn<Paths, Path>
> = Paths[Path][Method] extends {
  responses: {
    [code: number]: {
      content: infer ContentType;
    };
  };
}
  ? keyof ContentType
  : never;

/**
 * Get the collection of Parameter substituions available
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 */
export type ParamsIn<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>,
  Method extends MethodIn<Paths, Path> = MethodIn<Paths, Path>
> = Paths[Path][Method] extends {
  parameters: {
    path: infer Params;
  };
}
  ? Params
  : never;

/**
 * Get the collection of Query String arguments available
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 */
export type QueryIn<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>,
  Method extends MethodIn<Paths, Path> = MethodIn<Paths, Path>
> = Paths[Path][Method] extends {
  parameters: {
    query: infer Query;
  };
}
  ? Query
  : never;

/**
 * Get a specific Type for a request
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 * 4. with the given ContentType key
 */
export type RequestOf<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>,
  Method extends MethodIn<Paths, Path> = MethodIn<Paths, Path>,
  ContentType extends RequestContentTypeIn<
    Paths,
    Path,
    Method
  > = RequestContentTypeIn<Paths, Path, Method>
> = Paths[Path][Method] extends {
  requestBody?: {
    content: {
      [contentType in ContentType]: infer O;
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
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>,
  Method extends MethodIn<Paths, Path> = MethodIn<Paths, Path>,
  RequestContentType extends RequestContentTypeIn<
    Paths,
    Path,
    Method
  > = RequestContentTypeIn<Paths, Path, Method>
> = {
  /**
   * Set parameters on the request, such as /pet/{petId}
   * 1. for a given OpenAPI paths type
   * 2. with a given Path key
   * 3. with the given Method key
   * 4. for the given ContentType key from .method()
   */
  params: <Params extends ParamsIn<Paths, Path, Method>>(
    params: Params
  ) => BuilderAPI<Paths, Path, Method, RequestContentType>;
  /**
   * Add query string key/value pairs to the request such as /pet/{petId}?confirm=2023
   * 1. for a given OpenAPI paths type
   * 2. with a given Path key
   * 3. with the given Method key
   * 4. for the given ContentType key from .method()
   */
  query: <Query extends QueryIn<Paths, Path, Method>>(
    query: Query
  ) => BuilderAPI<Paths, Path, Method, RequestContentType>;
  /**
   * Set the body for the request
   * 1. for a given OpenAPI paths type
   * 2. with a given Path key
   * 3. with the given Method key
   * 4. for the given ContentType key from .method()
   */
  body: <
    Body extends RequestOf<Paths, Path, Method, RequestContentType> = RequestOf<
      Paths,
      Path,
      Method,
      RequestContentType
    >
  >(
    request: Body
  ) => BuilderAPI<Paths, Path, Method, RequestContentType>;
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
    ResponseContentType extends ResponseContentTypeIn<
      Paths,
      Path,
      Method
    > = ResponseContentTypeIn<Paths, Path, Method>
  >(
    options?: RequestInit,
    contentType?: ResponseContentType,
    deserialize?: Deserializer<Paths, Path, Method, ResponseContentType>
  ) => Promise<ResponseOf<Paths, Path, Method, ResponseContentType>>;
};

/**
 * Serialize from a JS object to your requested ContentType format
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 * 4. with a given Request Content Type key
 */
export type Serializer<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>,
  Method extends MethodIn<Paths, Path> = MethodIn<Paths, Path>,
  RequestContentType extends RequestContentTypeIn<
    Paths,
    Path,
    Method
  > = RequestContentTypeIn<Paths, Path, Method>
> = (input: RequestOf<Paths, Path, Method, RequestContentType>) => string;

/**
 * Deserialize from text to a JS object
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 * 4. with an object structure matching a valid ResponseContentType
 */
export type Deserializer<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>,
  Method extends MethodIn<Paths, Path> = MethodIn<Paths, Path>,
  ResponseContentType extends ResponseContentTypeIn<
    Paths,
    Path,
    Method
  > = RequestContentTypeIn<Paths, Path, Method>
> = (
  input: string,
  status: ResultCodeOf<Paths, Path, Method>
) => DeserializeResponse<Paths, Path, Method, ResponseContentType>;

// helper: Used to split the deserialized response from the RS object
// it's likely these can drift, so it is useful to call it out separately
// for now.
type DeserializeResponse<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths>,
  Method extends MethodIn<Paths, Path>,
  ContentType extends ResponseContentTypeIn<Paths, Path, Method>
> = ResponseOf<Paths, Path, Method, ContentType>;

/**
 * Extract the status code keys as a union such as `200 | 403`
 * 1. for a given OpenAPI paths type
 * 2. with a given Path key
 * 3. with the given Method key
 */
export type ResultCodeOf<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths> = PathIn<Paths>,
  Method extends MethodIn<Paths, Path> = MethodIn<Paths, Path>
> = Paths[Path][Method] extends {
  responses: {
    [Code in infer C extends number]: unknown;
  };
}
  ? C
  : never;

type ResponseContentOf<T> = T extends {
  content: infer C;
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
export type ResponseOf<
  Paths extends OAPIPaths<Paths>,
  Path extends PathIn<Paths>,
  Method extends MethodIn<Paths, Path>,
  ResponseContentType extends ResponseContentTypeIn<Paths, Path, Method>
> = ValueOf<
  // get the value of "responses" infer into Res
  Paths[Path][Method] extends {
    responses: infer Res;
  }
    ? {
        // create Code for key of responses, ?: if content type matches
        [Code in keyof Res]: ResponseContentType extends keyof ResponseContentOf<
          Res[Code]
        >
          ? // If value in OpenAPI is never, return status only
            ResponseContentOf<Res[Code]> extends never
            ? { status: Code }
            : // else, return status + data
              {
                status: Code;
                data: ResponseContentOf<Res[Code]>[ResponseContentType];
              }
          : // response type not found, can only satisfy code
            { status: Code };
      }
    : // did not extend T[P][M]
      never
>;
