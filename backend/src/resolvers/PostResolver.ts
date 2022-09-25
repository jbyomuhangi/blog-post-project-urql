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
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";

import { Post } from "../entities/PostEntity";
import { User } from "../entities/UserEntity";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { Vote } from "../entities/VoteEntity";

@InputType()
class PostInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field(() => Boolean)
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() post: Post): string {
    return post.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(
    @Root() post: Post,
    @Ctx() { userLoader }: MyContext
  ): Promise<User | null> {
    return userLoader.load(post.creatorId);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req, dataSource }: MyContext
  ): Promise<boolean> {
    const { userId } = req.session;
    const isUpVote = value != -1;
    const realValue = isUpVote ? 1 : -1;

    const vote = await Vote.findOne({ where: { postId, userId } });

    if (vote && vote.value === realValue) {
      /* Do nothing if we make the same vote */
    } else if (vote && vote.value !== realValue) {
      /* Change the vote from whatever we previously voted */
      await dataSource.transaction(async (tm) => {
        await tm.query(
          `
            update vote
            set value = $1
            where "userId" = $2 and "postId" = $3
          `,
          [realValue, userId, postId]
        );

        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2;
          `,
          [2 * realValue, postId]
        );
      });
    } else {
      /* Vote for first time */
      await dataSource.transaction(async (tm) => {
        await tm.query(
          `
            insert into vote ("userId", "postId", value)
            values($1, $2, $3);
          `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2;
          `,
          [realValue, postId]
        );
      });
    }

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int, { defaultValue: 20, nullable: true })
    limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { dataSource, req }: MyContext
  ): Promise<PaginatedPosts> {
    const { userId } = req.session;
    const realLimit = limit < 0 ? 0 : Math.min(50, limit);
    if (realLimit === 0) return { posts: [], hasMore: false };

    const replacements: any = [realLimit];
    let cursorIndex: number = 3;

    if (userId) replacements.push(userId);

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIndex = replacements.length;
    }

    const posts = await dataSource.query(
      `
        select p.*,
        ${
          userId
            ? `(select value from vote where "userId" = $2 and "postId" = p.id ) "voteStatus"`
            : `null as "voteStatus"`
        }
        from post p
        ${cursor ? `where p."createdAt" < $${cursorIndex}` : ""}
        order by p."createdAt" DESC
        limit $1
      `,
      replacements
    );

    return { posts, hasMore: posts.length === realLimit };
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
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String) title: string,
    @Arg("text", () => String) text: string,
    @Ctx() { req, dataSource }: MyContext
  ): Promise<Post | null> {
    const result = await dataSource
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where(`id = :id and "creatorId" = :creatorId`, {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }
}
