import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import { useState } from "react";

import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";
import { useResetPasswordMutation } from "../../generated/graphql";
import createUrqlClient from "../../utils/createUrqlClient";
import { toErrorMap } from "../../utils/toErrorMap";

interface NextPageProps {
  token: string;
}

const ResetPassword: NextPage<NextPageProps> = ({ token }) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [, resetPassword] = useResetPasswordMutation();

  return (
    <Wrapper variant="regular">
      <Formik
        initialValues={{ newPassword: "", confirmNewPassword: "" }}
        onSubmit={async (values, { setErrors }) => {
          if (values.newPassword !== values.confirmNewPassword) {
            setErrors({ confirmNewPassword: "password does not match " });
          }

          const response = await resetPassword({
            options: { newPassword: values.newPassword, token },
          });

          if (response.data?.resetPassword.errors) {
            setErrors(toErrorMap(response.data.resetPassword.errors));
          } else if (response.data?.resetPassword.user) {
            router.push("/");
          } else if (response.data?.resetPassword.error) {
            setError(response.data.resetPassword.error);
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

              {error ? <Box>{error}</Box> : null}

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

ResetPassword.getInitialProps = ({ query }) => {
  return { token: query.token as string };
};

export default withUrqlClient(createUrqlClient)(ResetPassword);
