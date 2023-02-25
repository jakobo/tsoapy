type Method = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

/** Describes the OpenAPI `paths` object */
export type OAPIPaths<T> = {
  [P in keyof T]: {
    [M in Method]?: {
      requestBody?: {
        content: {
          "application/json": unknown;
        };
      };
      responses: {
        [S: number]: {
          content: {
            "application/json": unknown;
          };
        };
      };
    };
  };
};

/** Used to infer the JSON request body */
type RequestBody<RB> = {
  requestBody?: {
    content: {
      "application/json": RB;
    };
  };
};

/** Used to infer the status code of the response */
type ResponseCode<C extends number> = {
  responses: {
    [Code in C]: unknown;
  };
};

/** Used to infer the JSON body of the response */
type ResponseBody<RB, C extends number> = {
  responses: {
    [Code in C]: {
      content: {
        "application/json": RB;
      };
    };
  };
};

/** Extract the Variables from the T.<path>.<method> */
export type VariablesOf<
  T extends OAPIPaths<T>,
  P extends keyof T,
  M extends keyof T[P]
> = T[P][M] extends RequestBody<infer RB> ? RB : never;

/** Extract the status code type from the T.<path>.<method> */
export type ResultCodeOf<
  T extends OAPIPaths<T>,
  P extends keyof T,
  M extends keyof T[P]
> = T[P][M] extends ResponseCode<infer C extends number> ? C : never;

/** Extract the response body from the T.<path>.<method> */
export type ResultOf<
  T extends OAPIPaths<T>,
  P extends keyof T,
  M extends keyof T[P],
  C extends number
> = T[P][M] extends ResponseBody<infer RB, C> ? RB : never;

/** Re-Describe the OpenAPI Response as a discriminated union, making it easier on developers */
export type OAPIResponse<
  T extends OAPIPaths<T>,
  P extends keyof T,
  M extends keyof T[P]
> = {
  success: boolean;
  status: ResultCodeOf<T, P, M>;
  data: ResultOf<T, P, M, ResultCodeOf<T, P, M>>;
};

/** Extends the base fetch init with the ability to override our fetch function */
export type ExtendedRequestInit = RequestInit & {
  fetch?: unknown;
};

/** List of options we can pass to our custom fetch utility */
export type FtchOptions<V> = {
  url: URL;
  path: string;
  method: Method;
  variables: V;
  ctx?: ExtendedRequestInit;
  options?: RequestInit;
};

/** Describes a single OpenAPI operation */
type Operation<
  T extends OAPIPaths<T>,
  P extends keyof T,
  M extends keyof T[P]
> = (
  variables: VariablesOf<T, P, M>,
  options?: RequestInit
) => Promise<OAPIResponse<T, P, M>>;

/** Descibes a generic representing all possible operations for a given endpoint */
export type Operations<
  T extends OAPIPaths<T>,
  P extends keyof T,
  M extends keyof T[P]
> = {
  [m in Method]: Operation<T, P, M>;
};
