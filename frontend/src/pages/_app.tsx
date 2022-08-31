import { ChakraProvider } from "@chakra-ui/react";
import { Provider, createClient, dedupExchange, fetchExchange } from "urql";
import { cacheExchange, Cache, QueryInput } from "@urql/exchange-graphcache";

import theme from "../theme";
import { AppProps } from "next/app";
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";

/* Has better types than the one given by the urql cache */
function customUpdateQuery<Result, Query>(
  cache: Cache,
  queryInput: QueryInput,
  result: any,
  updateFn: (r: Result, q: Query) => Query
) {
  return cache.updateQuery(
    queryInput,
    (data) => updateFn(result, data as any) as any
  );
}

const client = createClient({
  url: "http://localhost:4000/graphql",
  fetchOptions: { credentials: "include" },
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
          login: (result, args, cache, info) => {
            customUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              result,
              (queryResult, query) => {
                if (queryResult.login.errors) {
                  return query;
                } else {
                  return {
                    me: queryResult.login.user,
                  };
                }
              }
            );
          },

          logout: (result, args, cache, info) => {
            customUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              result,
              (queryResult, query) => {
                return { me: null };
              }
            );
          },

          register: (result, args, cache, info) => {
            customUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              result,
              (queryResult, query) => {
                if (queryResult.register.errors) {
                  return query;
                } else {
                  return {
                    me: queryResult.register.user,
                  };
                }
              }
            );
          },
        },
      },
    }),
    fetchExchange,
  ],
});

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider value={client}>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </Provider>
  );
};

export default MyApp;
