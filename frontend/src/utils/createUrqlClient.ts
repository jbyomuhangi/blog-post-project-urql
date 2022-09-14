import { cacheExchange } from "@urql/exchange-graphcache";
import { SSRExchange } from "next-urql";
import { dedupExchange, fetchExchange, Exchange } from "urql";
import { pipe, tap } from "wonka";
import Router from "next/router";

import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";
import customUpdateQuery from "./customUpdateQuery";

const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error?.message.includes("not authenticated"))
          Router.replace("/login");
      })
    );
  };

const createUrqlClient = (ssrExchange: SSRExchange) => {
  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: { credentials: "include" as const },
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
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};

export default createUrqlClient;
