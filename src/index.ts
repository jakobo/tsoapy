import type {
  ExtendedRequestInit,
  FtchOptions,
  OAPIPaths,
  OAPIResponse,
  Operations,
  ResultCodeOf,
  ResultOf,
  VariablesOf,
} from "./types";

/** Perform a fetch of data and type the response as a discriminated union */
const ftch = async <
  T extends OAPIPaths<T>,
  P extends keyof T,
  M extends keyof T[P],
  V = VariablesOf<T, P, M>
>({
  url,
  path,
  method,
  variables,
  ctx,
  options,
}: FtchOptions<V>) => {
  // take the passed in fetch if provided
  const { fetch: of, ...init } = ctx ?? {};
  const f = (of ?? fetch) as typeof fetch;

  // create a URL for the request and append the pathname
  const req = new URL(url);
  req.pathname += `/${String(path)}`;

  // request
  const res = await f(req, {
    ...init,
    ...options,
    headers: {
      ...init?.headers,
      ...options?.headers,
      "content-type": "application/json",
    },
    method: `${String(method)}`,
    body: JSON.stringify(variables),
  });

  // type the response
  const j: ResultOf<T, P, M, ResultCodeOf<T, P, M>> = await res.json();
  const resp: OAPIResponse<T, P, M> = {
    success: res.status === 200,
    status: res.status as ResultCodeOf<T, P, M>,
    data: j,
  };
  return resp;
};

export const tsoapy = <T extends OAPIPaths<T>>(
  url: URL,
  ctx?: ExtendedRequestInit
) => {
  return {
    path: <P extends keyof T, M extends keyof T[P]>(
      path: P
    ): Operations<T, P, M> => ({
      post: async (variables, options) =>
        ftch<T, P, M>({
          url,
          path: String(path),
          method: "post",
          variables,
          ctx,
          options,
        }),
      get: async (variables, options) =>
        ftch<T, P, M>({
          url,
          path: String(path),
          method: "get",
          variables,
          ctx,
          options,
        }),
      put: async (variables, options) =>
        ftch<T, P, M>({
          url,
          path: String(path),
          method: "put",
          variables,
          ctx,
          options,
        }),
      patch: async (variables, options) =>
        ftch<T, P, M>({
          url,
          path: String(path),
          method: "patch",
          variables,
          ctx,
          options,
        }),
      delete: async (variables, options) =>
        ftch<T, P, M>({
          url,
          path: String(path),
          method: "delete",
          variables,
          ctx,
          options,
        }),
      head: async (variables, options) =>
        ftch<T, P, M>({
          url,
          path: String(path),
          method: "head",
          variables,
          ctx,
          options,
        }),
      options: async (variables, options) =>
        ftch<T, P, M>({
          url,
          path: String(path),
          method: "options",
          variables,
          ctx,
          options,
        }),
    }),
  };
};

export default tsoapy;
