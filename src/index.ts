import type {
  BuilderAPI,
  Deserializer,
  ExtendedRequestInit,
  MethodIn,
  OAPIPaths,
  ParamsIn,
  PathIn,
  QueryIn,
  RequestContentType,
  ResultCodeOf,
  RS,
  Serializer,
} from "./types";

export const tsoapy = <T extends OAPIPaths<T>>(
  url: URL,
  ctx?: ExtendedRequestInit
) => ({
  path: <P extends PathIn<T>>(path: P) => {
    return {
      method: <
        M extends MethodIn<T, P>,
        CT extends RequestContentType<T, P, M>
      >(
        method: M,
        contentType?: CT,
        serialize?: Serializer<T, P, M, CT>
      ) => {
        // configurable by builder methods
        let _params: ParamsIn<T, P, M> | undefined;
        let _query: QueryIn<T, P, M> | undefined;
        let _localHeaders: HeadersInit = {
          "Content-Type": contentType ?? "application/json",
        };
        let _body: string;

        // constants defined by calling method()
        const _contentType = contentType ?? "application/json";
        const bestEffort = (d: unknown) =>
          d && typeof d === "object" && "toString" in d ? d.toString() : `${d}`;
        const serializer =
          _contentType === "application/json" &&
          typeof serialize === "undefined"
            ? JSON.stringify
            : serialize ?? bestEffort;

        // chainable builder API, terminates on send()
        const builder: BuilderAPI<T, P, M, CT> = {
          params(params) {
            _params = params;
            return builder;
          },
          query(query) {
            _query = query;
            return builder;
          },
          body(request) {
            _body = serializer(request);
            return builder;
          },
          async send(options, contentType, deserialize) {
            const { fetch: of, ...init } = ctx ?? {};
            const f = (of ?? globalThis.fetch ?? fetch) as typeof fetch;

            const defaultDeserialize = ((t, c) => {
              return {
                status: c,
                data:
                  typeof contentType === "undefined" ||
                  contentType === "application/json"
                    ? JSON.parse(t)
                    : t,
              };
            }) as Deserializer<T, P, M, NonNullable<typeof contentType>>;

            const deserializer = deserialize ?? defaultDeserialize;

            // build final URL
            const req = new URL(url);
            req.pathname += `/${String(path)}`;

            if (_params) {
              // TODO param substitution in pathname
            }

            if (_query) {
              for (const [key, value] of Object.entries(_query))
                req.searchParams.append(key, `${value}`);
            }

            // request
            const res = await f(req, {
              ...init,
              ...options,
              headers: {
                ..._localHeaders,
                ...init?.headers,
                ...options?.headers,
              },
              method: `${String(method)}`,
              ...(["get", "delete", "trace", "options", "head"].includes(
                String(method)
              )
                ? {}
                : {
                    body: _body,
                  }),
            });

            const t = await res.text();
            const statusCode = res.status as ResultCodeOf<T, P, M>;
            const j = deserializer(t, statusCode);

            return j;
          },
        };

        return builder;
      },
    };
  },
});

export default tsoapy;
