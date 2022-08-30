import React from "react";
import { Formik, Form } from "formik";
import { Box, Button } from "@chakra-ui/react";

import Wrapper from "../components/Wrapper";
import InputField from "../components/InputField";

interface registerProps {}

const register: React.FC<registerProps> = ({}) => {
  return (
    <Wrapper variant="regular">
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {({ isSubmitting }) => {
          return (
            <Form>
              <InputField
                name="username"
                placeholder="username"
                label="Username"
              />

              <Box mt={4} mb={4}>
                <InputField
                  name="password"
                  placeholder="password"
                  label="Password"
                  type="password"
                />
              </Box>

              <Button type="submit" color="teal" isLoading={isSubmitting}>
                Register
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Wrapper>
  );
};

export default register;
