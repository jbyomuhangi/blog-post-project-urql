import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import React from "react";

import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";
import { useForgotPasswordMutation } from "../../generated/graphql";
import createUrqlClient from "../../utils/createUrqlClient";

const Index: React.FC<{}> = ({}) => {
  const [{ data }, forgotPassword] = useForgotPasswordMutation();

  if (data) {
    return (
      <Wrapper variant="regular">
        <Box>
          We have set a link to reset the password to your email, have a nice
          life 🙂️
        </Box>
      </Wrapper>
    );
  }

  return (
    <Wrapper variant="regular">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={(values, { setErrors }) => {
          if (!values.email) {
            setErrors({ email: "invalid email input" });
            return;
          }
          forgotPassword({ email: values.email });
        }}
      >
        {({ isSubmitting }) => {
          return (
            <Form>
              <Box mt={4} mb={4}>
                <InputField name="email" placeholder="email" label="Email" />
              </Box>

              <Button type="submit" color="teal" isLoading={isSubmitting}>
                Login
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Index);
