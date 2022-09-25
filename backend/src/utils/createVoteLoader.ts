import DataLoader from "dataloader";

import { Vote } from "../entities/VoteEntity";

const createVoteLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Vote | null>(
    async (keys) => {
      const votes = await Vote.find({ where: keys.map((key) => key) });

      const voteMap: Record<string, Vote> = {};
      votes.forEach(
        (vote) => (voteMap[`${vote.postId}-${vote.userId}`] = vote)
      );

      return keys.map((key) => voteMap[`${key.postId}-${key.userId}`]);
    }
  );

export default createVoteLoader;
