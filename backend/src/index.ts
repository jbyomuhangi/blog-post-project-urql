import { MikroORM } from "@mikro-orm/core";

import { __prod__ } from "./constants";
import { Post } from "./entities/Post";

const main = async () => {
  const orm = await MikroORM.init({
    entities: [Post],
    dbName: "full_stack_db",
    user: "joel",
    password: "admin",
    debug: !__prod__,
    type: "postgresql",
  });
};

main();
