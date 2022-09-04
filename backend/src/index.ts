import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { DataSource } from "typeorm";

import { COOKIE_NAME, __port__, __prod__ } from "./constants";
import { Post } from "./entities/PostEntity";
import { User } from "./entities/UserEntity";
import { PostResolver } from "./resolvers/PostResolver";
import { UserResolver } from "./resolvers/UserResolver";
import { MyContext } from "./types";

const main = async () => {
  const AppDataSource = new DataSource({
    type: "postgres",
    database: "full_stack_db",
    username: "joel",
    password: "admin",
    synchronize: true,
    logging: true,
    entities: [User, Post],
  });

  const dataSource = await AppDataSource.initialize();
  const app = express();
  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(cors({ origin: "http://localhost:3000", credentials: true }));

  app.use(
    session({
      name: COOKIE_NAME,
      secret: "ethertniHuiHUIHiuhiubuibbBuygt7f789789GIUB",
      resave: false,
      saveUninitialized: false,
      store: new RedisStore({
        client: redis,
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
    context: ({ req, res }): MyContext => ({ req, res, redis, dataSource }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app, cors: false });
  app.listen(__port__, () => {
    console.log(`server is listening on port ${__port__} `);
  });
};

main().catch((error) => console.error(error));
