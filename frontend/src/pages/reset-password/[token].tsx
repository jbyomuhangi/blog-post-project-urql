import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { NextPage } from "next";

import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";

interface NextPageProps {
  token: string;
}

const ResetPassword: NextPage<NextPageProps> = ({ token }) => {
  return (
    <Wrapper variant="regular">
      <Formik
        initialValues={{ newPassword: "", confirmNewPassword: "" }}
        onSubmit={async (values, { setErrors }) => {
          if (values.newPassword !== values.confirmNewPassword) {
            setErrors({ confirmNewPassword: "password does not match " });
          }

          //   const response = await login({ options: values });
          //   if (response.data?.login.errors) {
          //     setErrors(toErrorMap(response.data.login.errors));
          //   } else if (response.data?.login.user) {
          //     router.push("/");
          //   } else {
          //     console.log(response);
          //   }
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

export default ResetPassword;
