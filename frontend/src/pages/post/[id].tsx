import { EditIcon } from "@chakra-ui/icons";
import { Box, Flex, Heading, IconButton } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";

import Layout from "../../components/Layout";
import { useMeQuery, usePostQuery } from "../../generated/graphql";
import createUrqlClient from "../../utils/createUrqlClient";
import isServer from "../../utils/isServer";

const Post: React.FC<{}> = ({}) => {
  const router = useRouter();
  const [{ data, fetching, error }] = usePostQuery({
    variables: { id: parseInt(router.query.id as string) },
  });

  const [{ data: meData }] = useMeQuery({ pause: isServer() });

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
      <Flex mb={4}>
        <Heading>{data.post.title}</Heading>

        {meData?.me?.id === data.post.creator.id && (
          <NextLink href="/post/edit/[id]" as={`/post/edit/${data.post.id}`}>
            <IconButton ml="auto" aria-label="edit post" icon={<EditIcon />} />
          </NextLink>
        )}
      </Flex>

      <Box>{data.post.text}</Box>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
