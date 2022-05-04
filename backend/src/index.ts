import { MikroORM } from "@mikro-orm/core";

import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
};

main().catch((err) => console.error);
