import Router from "next/router";
import { useEffect } from "react";

import { useMeQuery } from "../generated/graphql";

export const useIsAuth = () => {
  const [{ data, fetching }] = useMeQuery();

  useEffect(() => {
    if (!fetching && !data?.me)
      Router.replace(`/login?next=${Router.pathname}`);
  }, [fetching, data]);
};
