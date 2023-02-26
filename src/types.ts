/** Supported HTTP methods */
type Method = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

/** Describes the OpenAPI `paths` object */
export type OAPIPaths<T> = {
  [P in keyof T]: {
    [M in Method]?: {
      requestBody?: {
        content: {
          "application/json"?: unknown;
          [contentType: string]: unknown;
        };
      };
      responses: {
        [S: number]: {
          content: {
            "application/json"?: unknown;
            [contentType: string]: unknown;
          };
        };
      };
    };
  };
};

/** Get all available Paths for an OpenAPI collection */
export type PathIn<T extends OAPIPaths<T>> = keyof T;

/** Get all available Methods for a given OpenAPI collection and Path */
export type MethodIn<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>
> = keyof T[P];

/** Get all available Mime Types for a given OpenAPI collection, Path, and Method combo */
export type ContentTypeIn<
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
        content: infer MT_B;
      };
    }
  ? keyof MT_B
  : // no OpenAPI 3 request bodies found
    never;

/** Get the default Mime Type of application/json if it is available in ContentTypeIn */
export type DefaultContentTypeIn<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>
> = ContentTypeIn<T, P, M> extends {
  ["application/json"]: unknown;
}
  ? ContentTypeIn<T, P, M>["application/json"]
  : ContentTypeIn<T, P, M>;

/** Get all available return Mime Types for a given OpenAPI collection, Path, and Method combo */
export type ContentTypeOut<
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

/** Get the default Mime Type of application/json if it is available in ContentTypeOut */
export type DefaultContentTypeOut<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>
> = ContentTypeOut<T, P, M> extends {
  ["application/json"]: unknown;
}
  ? ContentTypeOut<T, P, M>["application/json"]
  : ContentTypeOut<T, P, M>;

/** Get the collection of Parameter substituions available for a given OpenAPI collection, Path, and Method combo */
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

/** Get the collection of Query String arguments available for a given OpenAPI collection, Path, and Method combo */
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

/** Get a specific request variant for a given OpenAPI collection, Path, Method, and MimeType combo */
export type RequestOf<
  T extends OAPIPaths<T>,
  P extends PathIn<T> = PathIn<T>,
  M extends MethodIn<T, P> = MethodIn<T, P>,
  MT extends ContentTypeOut<T, P, M> = ContentTypeOut<T, P, M>
> = T[P][M] extends {
  requestBody?: {
    content: {
      [mime in MT]: infer O;
    };
  };
}
  ? O
  : never;

/** Serialize from JSON to your requested MimeType format */
export type Serializer<T, R> = (input: T) => R;

/** Deserialize from text (assumed to be of your MimeType format) to JSON */
export type Deserializer<T, C extends number, R> = (input: T, status: C) => R;

/** Extract the status code type from the T.<path>.<method>.responses.<code> */
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

/** Extract the response body from the T.<path>.<method>.responses.<code>.content */
export type ResultOf<
  T extends OAPIPaths<T>,
  P extends PathIn<T>,
  M extends MethodIn<T, P>,
  C extends number,
  MT extends ContentTypeOut<T, P, M>
> = T[P][M] extends {
  responses: {
    [Code in C]: {
      content: {
        [mime in MT]: infer RB;
      };
    };
  };
}
  ? RB
  : never;

/** Re-Describe the OpenAPI Response as a discriminated union, making it easier on developers */
export type OAPIResponse<
  T extends OAPIPaths<T>,
  P extends PathIn<T>,
  M extends MethodIn<T, P>,
  MimeType extends ContentTypeOut<T, P, M>
> = {
  success: boolean;
  status: ResultCodeOf<T, P, M>;
  data: ResultOf<T, P, M, ResultCodeOf<T, P, M>, MimeType>;
};

/** Extends the base fetch init with the ability to override our fetch function */
export type ExtendedRequestInit = RequestInit & {
  fetch?: unknown;
};
