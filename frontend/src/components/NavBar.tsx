import React from "react";
import { Flex, Box, Link, Button } from "@chakra-ui/react";
import NextLink from "next/link";

import { useMeQuery } from "../generated/graphql";

interface NavBarProps {}

interface LoggedInProps {
  username: string;
}

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

const LoggedIn: React.FC<LoggedInProps> = ({ username }) => {
  return (
    <Flex>
      <Box mr={4}>{username}</Box>
      <Button variant="link">Logout</Button>
    </Flex>
  );
};

const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();

  if (fetching) return null;

  return (
    <Flex bg="tomato" p={4}>
      <Box ml="auto">
        {data?.me ? <LoggedIn username={data.me.username} /> : <NotLoggedIn />}
      </Box>
    </Flex>
  );
};

export default NavBar;
