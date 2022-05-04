import { MikroORM } from "@mikro-orm/core";

import { __prod__ } from "./constants";
import { Post } from "./entities/PostEntity";
import { User } from "./entities/User";

export default {
  entities: [Post, User],
  dbName: "full_stack_db",
  user: "joel",
  password: "admin",
  debug: !__prod__,
  type: "postgresql",
} as Parameters<typeof MikroORM.init>[0];
