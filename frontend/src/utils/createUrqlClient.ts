import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { SSRExchange } from "next-urql";
import Router from "next/router";
import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
  gql,
} from "urql";
import { pipe, tap } from "wonka";

import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import customUpdateQuery from "./customUpdateQuery";

const cursorPagination = (): Resolver => {
  return (parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);

    if (fieldInfos.length === 0) return undefined;

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInTheCache = cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      "posts"
    );
    info.partial = !isItInTheCache;

    const results: string[] = [];
    let hasMore: boolean = true;

    fieldInfos.forEach((fieldInfo) => {
      const key = cache.resolve(entityKey, fieldInfo.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[];
      const queryHasMore = cache.resolve(key, "hasMore") as boolean;

      hasMore = hasMore && queryHasMore;
      results.push(...data);
    });

    return { hasMore, posts: results, __typename: "PaginatedPosts" };
  };
};

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
        keys: { PaginatedPosts: () => null },

        resolvers: { Query: { posts: cursorPagination() } },

        updates: {
          Mutation: {
            vote: (result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;

              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId }
              );

              if (data) {
                if (data.voteStatus === value) return;

                const newPoints =
                  (data.points as number) + (!data.voteStatus ? 1 : 2) * value;

                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value }
                );
              }
            },

            createPost: (result, args, cache, info) => {
              const allFields = cache.inspectFields("Query");
              const fieldInfos = allFields.filter(
                (info) => info.fieldName === "posts"
              );

              fieldInfos.forEach((fieldInfo) => {
                cache.invalidate("Query", "posts", fieldInfo.arguments);
              });
            },

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
