import { DeleteIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useState } from "react";

import Layout from "../components/Layout";
import VotingSection from "../components/VotingSection";
import {
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from "../generated/graphql";
import createUrqlClient from "../utils/createUrqlClient";
import isServer from "../utils/isServer";

const Index = () => {
  const [variables, setVariables] = useState({});
  const [{ data }] = usePostsQuery({ variables });
  const [{ data: meData }] = useMeQuery({ pause: isServer() });
  const [, deletePost] = useDeletePostMutation();

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
            {data.posts.posts.map((post) => (
              <Flex key={post.id} p={5} shadow="md" borderWidth="1px">
                <VotingSection
                  postId={post.id}
                  points={post.points}
                  voteStatus={post.voteStatus}
                />

                <Box flex={1}>
                  <NextLink href="/post/[id]" as={`/post/${post.id}`}>
                    <Link>
                      <Heading fontSize="xl">{post.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text>posted by: {post.creator.username}</Text>

                  <Flex>
                    <Text mt={4}>{post.textSnippet}</Text>

                    {meData?.me?.id === post.creator.id && (
                      <IconButton
                        ml="auto"
                        aria-label="delete post"
                        onClick={() => {
                          deletePost({ id: post.id });
                        }}
                        icon={<DeleteIcon />}
                      />
                    )}
                  </Flex>
                </Box>
              </Flex>
            ))}
          </Stack>

          {data.posts.hasMore && (
            <Flex>
              <Button
                m="auto"
                my="30px"
                onClick={() => {
                  setVariables((currentVariables) => ({
                    ...currentVariables,
                    cursor:
                      data.posts.posts[data.posts.posts.length - 1].createdAt,
                  }));
                }}
              >
                Load more
              </Button>
            </Flex>
          )}
        </>
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
