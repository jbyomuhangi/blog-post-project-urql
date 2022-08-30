import {
  Ctx,
  Field,
  InputType,
  Mutation,
  Resolver,
  Arg,
  ObjectType,
  Query,
} from "type-graphql";
import argon2 from "argon2";

import { MyContext } from "../types";
import { User } from "../entities/UserEntity";

@InputType()
class UsernamePasswordInput {
  @Field(() => String)
  username: string;

  @Field(() => String)
  password: string;
}

@ObjectType()
class FieldError {
  @Field(() => String)
  field: string;

  @Field(() => String)
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext): Promise<User | null> {
    if (!req.session.userId) return null;

    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const { username, password } = options;

    if (username.length < 3) {
      return {
        errors: [
          { field: "username", message: "username must be at least 3 chars" },
        ],
      };
    }

    if (password.length < 3) {
      return {
        errors: [
          { field: "password", message: "password must be at least 3 chars" },
        ],
      };
    }

    const hashedPassword = await argon2.hash(password);
    const user = em.create(User, { username, password: hashedPassword });
    await em.persistAndFlush(user);
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const { username, password } = options;
    const user = await em.findOne(User, { username });

    if (!user) {
      return {
        errors: [{ field: "username", message: "user does not exist" }],
      };
    }

    const isValidPassword = await argon2.verify(user.password, password);

    if (!isValidPassword) {
      return { errors: [{ field: "password", message: "invalid password" }] };
    }

    req.session.userId = user.id;

    return { user };
  }
}
