import { Request, Response } from "express";
import { Redis } from "ioredis";
import { DataSource } from "typeorm";

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
};
