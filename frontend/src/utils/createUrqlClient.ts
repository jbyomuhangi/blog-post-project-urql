import { cacheExchange } from "@urql/exchange-graphcache";
import { SSRExchange } from "next-urql";
import { dedupExchange, fetchExchange } from "urql";

import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";
import customUpdateQuery from "./customUpdateQuery";

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
      ssrExchange,
      fetchExchange,
    ],
  };
};

export default createUrqlClient;
