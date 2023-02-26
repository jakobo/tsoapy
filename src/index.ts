import type {
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
        const _mimeType = contentType ?? "application/json";
        const bestEffort = (d: unknown) =>
          d && typeof d === "object" && "toString" in d ? d.toString() : `${d}`;
        const serializer =
          _mimeType === "application/json" && typeof serialize === "undefined"
            ? JSON.stringify
            : serialize ?? bestEffort;

        // chainable builder API, terminates on send()
        const builder = {
          params: <PI extends ParamsIn<T, P, M>>(params: PI) => {
            _params = params;
            return builder;
          },
          query: <QS extends QueryIn<T, P, M>>(query: QS) => {
            _query = query;
            return builder;
          },
          body: <RQ extends RequestOf<T, P, M, CT> = RequestOf<T, P, M, CT>>(
            request?: RQ
          ) => {
            _body = serializer(request);
            return builder;
          },
          send: async <
            RCT extends ContentTypeOut<T, P, M> = DefaultContentTypeOut<T, P, M>
          >(
            options?: RequestInit,
            mimeType?: RCT,
            deserialize?: Deserializer<
              string,
              ResultCodeOf<T, P, M>,
              ResultOf<T, P, M, ResultCodeOf<T, P, M>, RCT>
            >
          ): Promise<OAPIResponse<T, P, M, RCT>> => {
            const { fetch: of, ...init } = ctx ?? {};
            const f = (of ?? globalThis.fetch ?? fetch) as typeof fetch;

            // force the noop to a passthrough deserializer
            const noop = ((t: unknown) => t) as Deserializer<
              string,
              ResultCodeOf<T, P, M>,
              ResultOf<T, P, M, ResultCodeOf<T, P, M>, RCT>
            >;

            const deserializer: Deserializer<
              string,
              ResultCodeOf<T, P, M>,
              ResultOf<T, P, M, ResultCodeOf<T, P, M>, RCT>
            > = deserialize ?? mimeType === "application/json"
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
            const resp: OAPIResponse<T, P, M, RCT> = {
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
