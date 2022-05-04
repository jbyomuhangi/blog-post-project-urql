import { MikroORM } from "@mikro-orm/core";

import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";

const main = async () => {
  await MikroORM.init(mikroConfig);
};

main().catch((error) => console.error(error));
