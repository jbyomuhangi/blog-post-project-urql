import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { __prod__, __port__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import { PostResolver } from "./resolvers/PostResolver";
import { UserResolver } from "./resolvers/UserResolver";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  const app = express();
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: () => ({ em: orm.em.fork() }),
  });
  await apolloServer.start();

  apolloServer.applyMiddleware({ app });
  app.listen(__port__, () => {
    console.log(`server is listening on port ${__port__} `);
  });
};

main().catch((error) => console.error(error));
