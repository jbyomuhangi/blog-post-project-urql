import { Box, Button, Link, Flex } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import { useState } from "react";
import NextLink from "next/link";

import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";
import { useResetPasswordMutation } from "../../generated/graphql";
import createUrqlClient from "../../utils/createUrqlClient";
import { toErrorMap } from "../../utils/toErrorMap";

const ResetAgain: React.FC<{ errorMessage: string }> = ({ errorMessage }) => {
  return (
    <Wrapper variant="regular">
      <Flex justifyContent="space-between">
        <Box mb={4} color="red">
          {errorMessage}
        </Box>

        <NextLink href="/reset-password">
          <Link color="blue">Reset again</Link>
        </NextLink>
      </Flex>
    </Wrapper>
  );
};

const ResetPassword: NextPage<{}> = ({}) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [, resetPassword] = useResetPasswordMutation();

  return (
    <Wrapper variant="regular">
      <Formik
        initialValues={{ newPassword: "", confirmNewPassword: "" }}
        onSubmit={async (values, { setErrors }) => {
          if (values.newPassword !== values.confirmNewPassword) {
            setErrors({ confirmNewPassword: "password does not match" });
            return;
          }

          const response = await resetPassword({
            options: {
              newPassword: values.newPassword,
              token:
                typeof router.query.token === "string"
                  ? router.query.token
                  : "",
            },
          });

          if (response.data?.resetPassword.errors) {
            setErrors(toErrorMap(response.data.resetPassword.errors));
          } else if (response.data?.resetPassword.user) {
            router.push("/");
          } else if (response.data?.resetPassword.error) {
            setError(response.data.resetPassword.error.message);
          } else {
            console.log(response);
          }
        }}
      >
        {({ isSubmitting }) => {
          return (
            <Form>
              <InputField
                name="newPassword"
                placeholder="new password"
                label="New password"
                type="password"
              />

              <Box mt={4} mb={4}>
                <InputField
                  name="confirmNewPassword"
                  placeholder="confirm new password"
                  label="Confirm new password"
                  type="password"
                />
              </Box>

              {error && <ResetAgain errorMessage={error} />}

              <Button type="submit" color="teal" isLoading={isSubmitting}>
                Reset password
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ResetPassword);
