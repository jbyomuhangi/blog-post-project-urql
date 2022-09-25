import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";

import Layout from "../../../components/Layout";
import {
  usePostQuery,
  useUpdatePostMutation,
} from "../../../generated/graphql";
import createUrqlClient from "../../../utils/createUrqlClient";
import InputField from "../../../components/InputField";

const Edit: React.FC<{}> = ({}) => {
  const router = useRouter();
  const postId = parseInt(router.query.id as string);
  const [{ data, fetching, error }] = usePostQuery({
    variables: { id: postId },
  });

  const [, updatePost] = useUpdatePostMutation();

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
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {
          const { error } = await updatePost({ id: postId, ...values });
          if (!error) router.push("/post/[id]", `/post/${postId}`);
        }}
      >
        {({ isSubmitting }) => {
          return (
            <Form>
              <InputField name="title" placeholder="title" label="Title" />

              <Box mt={4} mb={4}>
                <InputField
                  textarea
                  name="text"
                  placeholder="text..."
                  label="Body"
                />
              </Box>

              <Button type="submit" color="teal" isLoading={isSubmitting}>
                Update post
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(Edit);
