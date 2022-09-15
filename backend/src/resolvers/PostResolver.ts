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
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
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
    @Ctx() { dataSource }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = limit < 0 ? 0 : Math.min(50, limit);
    if (realLimit === 0) return { posts: [], hasMore: false };

    const replacements: any = [realLimit];
    if (cursor) replacements.push(new Date(parseInt(cursor)));

    const posts = await dataSource.query(
      `
        select p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'email', u.email,
          'createdAt', u."createdAt",
          'updatedAt', u."updatedAt"
        ) creator
        from post p
        inner join public.user u on u.id = p."creatorId"
        ${cursor ? `where p."createdAt" < $2` : ""}
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
