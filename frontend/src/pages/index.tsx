import { Button, Stack, Box, Heading, Text, Flex } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useState } from "react";

import Layout from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import createUrqlClient from "../utils/createUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({});
  const [{ data }] = usePostsQuery({ variables });

  return (
    <Layout>
      <Flex alignItems="center" justifyContent="space-between" mb="30px">
        <Heading>Test Project</Heading>
        <NextLink href="/create-post">
          <Button color="teal" variant="ghost">
            Create post
          </Button>
        </NextLink>
      </Flex>

      {!data ? null : (
        <>
          <Stack spacing={8}>
            {data.posts.map((post) => (
              <Box key={post.id} p={5} shadow="md" borderWidth="1px">
                <Heading fontSize="xl">{post.title}</Heading>
                <Text mt={4}>{post.textSnippet}</Text>
              </Box>
            ))}
          </Stack>

          <Flex>
            <Button
              m="auto"
              my="30px"
              onClick={() => {
                setVariables((currentVariables) => ({
                  ...currentVariables,
                  cursor: data.posts[data.posts.length - 1].createdAt,
                }));
              }}
            >
              Load more
            </Button>
          </Flex>
        </>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
