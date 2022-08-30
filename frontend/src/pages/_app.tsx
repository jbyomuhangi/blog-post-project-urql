import { ChakraProvider } from "@chakra-ui/react";
import { Provider, createClient } from "urql";

import theme from "../theme";
import { AppProps } from "next/app";

const client = createClient({
  url: "http://localhost:4000/graphql",
});

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider value={client}>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </Provider>
  );
};

export default MyApp;
