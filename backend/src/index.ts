import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createClient } from "redis";
import session from "express-session";
import connectRedis from "connect-redis";

import { __prod__, __port__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import { PostResolver } from "./resolvers/PostResolver";
import { UserResolver } from "./resolvers/UserResolver";
import { MyContext } from "./types";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = createClient({ legacyMode: true });

  await redisClient.connect();

  app.use(
    session({
      name: "qid",
      secret: "ethertniHuiHUIHiuhiubuibbBuygt7f789789GIUB",
      resave: false,
      saveUninitialized: false,
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years,
        httpOnly: true,
        secure: __prod__, // cookie only works in https
        sameSite: "lax",
      },
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),

    context: ({ req, res }): MyContext => ({ em: orm.em.fork(), req, res }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app });
  app.listen(__port__, () => {
    console.log(`server is listening on port ${__port__} `);
  });
};

main().catch((error) => console.error(error));
