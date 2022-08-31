import React from "react";
import { Flex, Box, Link, Button } from "@chakra-ui/react";
import NextLink from "next/link";

import { useLogoutMutation, useMeQuery } from "../generated/graphql";

const NotLoggedIn: React.FC<{}> = ({}) => {
  return (
    <>
      <NextLink href="/login">
        <Link mr={2}>Login</Link>
      </NextLink>
      <NextLink href="/register">
        <Link>Register</Link>
      </NextLink>
    </>
  );
};

interface LoggedInProps {
  username: string;
}

const LoggedIn: React.FC<LoggedInProps> = ({ username }) => {
  const [{ fetching }, logout] = useLogoutMutation();

  return (
    <Flex>
      <Box mr={4}>{username}</Box>
      <Button variant="link" isLoading={fetching} onClick={() => logout({})}>
        Logout
      </Button>
    </Flex>
  );
};

const NavBar: React.FC<{}> = ({}) => {
  const [{ data, fetching }] = useMeQuery();

  if (fetching) return null;

  return (
    <Flex bg="tan" p={4}>
      <Box ml="auto">
        {data?.me ? <LoggedIn username={data.me.username} /> : <NotLoggedIn />}
      </Box>
    </Flex>
  );
};

export default NavBar;
