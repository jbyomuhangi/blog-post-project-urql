import { withUrqlClient } from "next-urql";

import NavBar from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import createUrqlClient from "../utils/createUrqlClient";

const Index = () => {
  const [{ data }] = usePostsQuery();

  return (
    <div>
      <NavBar />
      {!data
        ? null
        : data.posts.map((post) => <div key={post.id}>{post.title}</div>)}
    </div>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
