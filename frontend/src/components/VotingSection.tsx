import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton } from "@chakra-ui/react";
import React from "react";
import { useVoteMutation } from "../generated/graphql";

interface VotingSectionProps {
  postId: number;
  points: number;
  voteStatus: number | null | undefined;
}

const VotingSection: React.FC<VotingSectionProps> = ({
  postId,
  points,
  voteStatus,
}) => {
  const [, vote] = useVoteMutation();

  return (
    <Flex direction="column" alignItems="center" mr={5}>
      <IconButton
        aria-label="up vote"
        backgroundColor={voteStatus === 1 ? "green" : undefined}
        color={voteStatus === 1 ? "white" : undefined}
        onClick={() => {
          if (voteStatus === 1) return;
          vote({ postId, value: 1 });
        }}
        icon={<ChevronUpIcon w={8} h={8} />}
      />

      <Box> {points}</Box>

      <IconButton
        aria-label="down vote"
        backgroundColor={voteStatus === -1 ? "tomato" : undefined}
        color={voteStatus === -1 ? "white" : undefined}
        onClick={() => {
          if (voteStatus === -1) return;
          vote({ postId, value: -1 });
        }}
        icon={<ChevronDownIcon w={8} h={8} />}
      />
    </Flex>
  );
};

export default VotingSection;
