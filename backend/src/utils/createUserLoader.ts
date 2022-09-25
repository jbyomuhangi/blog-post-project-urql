import DataLoader from "dataloader";
import { In } from "typeorm";

import { User } from "../entities/UserEntity";

const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findBy({ id: In(userIds as number[]) });
    const userIdToUser: Record<number, User> = {};
    users.forEach((user) => (userIdToUser[user.id] = user));

    return userIds.map((userId) => userIdToUser[userId]);
  });

export default createUserLoader;
