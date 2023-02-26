import type {
  BuilderAPI,
  ContentTypeIn,
  ContentTypeOut,
  DefaultContentTypeIn,
  DefaultContentTypeOut,
  Deserializer,
  ExtendedRequestInit,
  MethodIn,
  OAPIPaths,
  OAPIResponse,
  ParamsIn,
  PathIn,
  QueryIn,
  RequestOf,
  ResultCodeOf,
  ResultOf,
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
        CT extends ContentTypeIn<T, P, M> = DefaultContentTypeIn<T, P, M>
      >(
        method: M,
        contentType?: CT,
        serialize?: Serializer<RequestOf<T, P, M, CT>, string>
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

            // force the noop to a passthrough deserializer
            const noop = ((t: unknown) => t) as NonNullable<typeof deserialize>;

            const deserializer: NonNullable<typeof deserialize> =
              deserialize ?? contentType === "application/json"
                ? (t) => JSON.parse(t)
                : noop;

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

            const status: ResultCodeOf<T, P, M> = res.status as ResultCodeOf<
              T,
              P,
              M
            >;
            const t = await res.text();
            const j = deserializer(t, status);
            const resp: OAPIResponse<
              T,
              P,
              M,
              NonNullable<typeof contentType>
            > = {
              success: status === 200,
              status: status,
              data: j,
            };

            return resp;
          },
        };

        return builder;
      },
    };
  },
});

export default tsoapy;
