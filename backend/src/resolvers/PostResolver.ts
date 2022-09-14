import {
  Arg,
  Int,
  Mutation,
  Query,
  Resolver,
  InputType,
  Field,
  UseMiddleware,
  Ctx,
} from "type-graphql";

import { Post } from "../entities/PostEntity";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@InputType()
class PostInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  text: string;
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(
    @Arg("limit", () => Int, { defaultValue: 20, nullable: true })
    limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { dataSource }: MyContext
  ): Promise<Post[]> {
    const realLimit = limit < 0 ? 0 : Math.min(50, limit);
    if (realLimit === 0) return [];

    const queryBuilder = dataSource.getRepository(Post).createQueryBuilder();

    if (cursor) {
      queryBuilder.where(`"createdAt" < :cursor`, {
        cursor: new Date(parseInt(cursor)),
      });
    }

    return queryBuilder
      .orderBy(`"createdAt"`, "DESC")
      .take(realLimit)
      .getMany();
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | null> {
    return Post.findOne({ where: { id } });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input", () => PostInput) input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });

    if (!post) {
      return null;
    }

    if (typeof title !== undefined) {
      await Post.update({ id }, { title });
    }

    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id", () => Int) id: number): Promise<boolean> {
    await Post.delete({ id });
    return true;
  }
}
