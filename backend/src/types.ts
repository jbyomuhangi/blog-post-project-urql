import { Request, Response } from "express";
import { Redis } from "ioredis";
import { DataSource } from "typeorm";
import createUserLoader from "./utils/createUserLoader";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export type MyContext = {
  dataSource: DataSource;
  req: Request;
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
};
