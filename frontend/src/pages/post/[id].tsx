import { Heading } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";

import Layout from "../../components/Layout";
import { usePostQuery } from "../../generated/graphql";
import createUrqlClient from "../../utils/createUrqlClient";

const Post: React.FC<{}> = ({}) => {
  const router = useRouter();
  const [{ data, fetching, error }] = usePostQuery({
    variables: { id: parseInt(router.query.id as string) },
  });

  if (fetching) {
    return (
      <Layout>
        <div>loading....</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div>Some error happened :(</div>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <div>Post not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Heading mb={4}>{data.post.title}</Heading>
      {data.post.text}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
