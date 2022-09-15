import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton } from "@chakra-ui/react";
import React from "react";
import { useVoteMutation } from "../generated/graphql";

interface VotingSectionProps {
  postId: number;
  points: number;
}

const VotingSection: React.FC<VotingSectionProps> = ({ postId, points }) => {
  const [, vote] = useVoteMutation();

  return (
    <Flex direction="column" alignItems="center" mr={5}>
      <IconButton
        aria-label="up vote"
        onClick={() => {
          vote({ postId, value: 1 });
        }}
        icon={<ChevronUpIcon w={8} h={8} />}
      />

      <Box> {points}</Box>

      <IconButton
        aria-label="down vote"
        onClick={() => {
          vote({ postId, value: -1 });
        }}
        icon={<ChevronDownIcon w={8} h={8} />}
      />
    </Flex>
  );
};

export default VotingSection;
