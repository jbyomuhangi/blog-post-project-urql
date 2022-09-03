import { Cache, QueryInput } from "@urql/exchange-graphcache";

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

export default customUpdateQuery;
