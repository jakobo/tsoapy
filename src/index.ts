import type {
  BuilderAPI,
  Deserializer,
  ExtendedRequestInit,
  MethodIn,
  OpenAPIPaths,
  ParamsIn,
  PathIn,
  QueryIn,
  RequestContentTypeIn,
  ResultCodeOf,
  Serializer,
  Builder,
} from "./types.js";

export type {
  Serializer,
  Deserializer,
  OpenAPIPaths,
  RequestOf,
  ResponseOf,
  Builder,
} from "./types.js";

export const tsoapy = <Paths extends OpenAPIPaths<Paths>>(
  url: URL,
  ctx?: ExtendedRequestInit
): Builder<Paths> => ({
  path: <Path extends PathIn<Paths>>(path: Path) => {
    return {
      method: <
        Method extends MethodIn<Paths, Path>,
        RequestContentType extends RequestContentTypeIn<
          Paths,
          Path,
          Method
        > = RequestContentTypeIn<Paths, Path, Method>
      >(
        method: Method,
        contentType?: RequestContentType,
        serialize?: Serializer<Paths, Path, Method, RequestContentType>
      ) => {
        // configurable by builder methods
        let _params: ParamsIn<Paths, Path, Method> | undefined;
        let _query: QueryIn<Paths, Path, Method> | undefined;
        let _body: string;

        // constants defined by calling method() up-chain
        const _contentType = contentType ?? "application/json";
        const _localHeaders: HeadersInit = {
          "Content-Type": contentType ?? "application/json",
        };
        const bestEffort = (d: unknown) =>
          d && typeof d === "object" && "toString" in d ? d.toString() : `${d}`;
        const serializer =
          _contentType === "application/json" &&
          typeof serialize === "undefined"
            ? JSON.stringify
            : serialize ?? bestEffort;

        // chainable reflexive builder API, terminates on send()
        const builder: BuilderAPI<Paths, Path, Method, RequestContentType> = {
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
            }) as Deserializer<
              Paths,
              Path,
              Method,
              NonNullable<typeof contentType>
            >;

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
            const statusCode = res.status as ResultCodeOf<Paths, Path, Method>;
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
