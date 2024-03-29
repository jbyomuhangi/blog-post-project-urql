import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { v4 as uuidV4 } from "uuid";

import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { User } from "../entities/UserEntity";
import { MyContext } from "../types";
import sendEmail from "../utils/sendEmail";
import validateRegister from "../utils/validateRegister";

@InputType()
export class RegisterInput {
  @Field(() => String)
  email: string;

  @Field(() => String)
  username: string;

  @Field(() => String)
  password: string;
}

@InputType()
class LoginInput {
  @Field(() => String)
  usernameOrEmail: string;

  @Field(() => String)
  password: string;
}

@InputType()
class ResetPasswordInput {
  @Field(() => String)
  token: string;

  @Field(() => String)
  newPassword: string;
}

@ObjectType()
export class FieldError {
  @Field(() => String)
  field: string;

  @Field(() => String)
  message: string;
}

@ObjectType()
class NormalError {
  @Field(() => String)
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => NormalError, { nullable: true })
  error?: NormalError;

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext): string {
    /* Make sure email is returned only is user owns it */
    if (req.session.userId === user.id) return user.email;
    return "";
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | null> {
    if (!req.session.userId) return null;

    const user = await User.findOne({ where: { id: req.session.userId } });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => RegisterInput) options: RegisterInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const { email, username, password } = options;

    const errors = validateRegister(options);
    if (errors.length > 0) return { errors };

    try {
      const hashedPassword = await argon2.hash(password);
      const user = await User.create({
        email,
        username,
        password: hashedPassword,
      }).save();
      req.session.userId = user.id;

      return { user };
    } catch (error) {
      const errors: FieldError[] = [];

      if (error.code === "23505") {
        if (error.detail.includes("email")) {
          errors.push({ field: "email", message: "email already exists" });
        } else if (error.detail.includes("username")) {
          errors.push({
            field: "username",
            message: "username already exists",
          });
        }
      }

      if (errors.length > 0) return { errors };
      return { error: { message: "undefined error" } };
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options", () => LoginInput) options: LoginInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const { usernameOrEmail, password } = options;

    const isEmail = usernameOrEmail.includes("@");
    const user = await User.findOne({
      where: { [isEmail ? "email" : "username"]: usernameOrEmail },
    });

    if (!user) {
      return {
        errors: [{ field: "usernameOrEmail", message: "user does not exist" }],
      };
    }

    const isValidPassword = await argon2.verify(user.password, password);

    if (!isValidPassword) {
      return { errors: [{ field: "password", message: "invalid password" }] };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
    return new Promise((resolve) => {
      req.session.destroy((error) => {
        if (error) {
          console.log(error);
          resolve(false);
          return;
        } else {
          res.clearCookie(COOKIE_NAME);
          resolve(true);
        }
      });
    });
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ): Promise<boolean> {
    const user = await User.findOne({ where: { email } });

    if (!user) return true;

    const token = uuidV4();

    /* set token in redis valid for 24 hours */
    redis.set(
      `${FORGET_PASSWORD_PREFIX}${token}`,
      user.id,
      "EX",
      1000 * 60 * 60 * 24
    );

    await sendEmail(
      email,
      `<a href="http://localhost:3000/reset-password/${token}">reset password</a>`
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async resetPassword(
    @Arg("options") options: ResetPasswordInput,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    const { newPassword, token } = options;

    if (newPassword.length < 3) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "password must be at least 3 chars",
          },
        ],
      };
    }

    const redisKey = `${FORGET_PASSWORD_PREFIX}${token}`;
    const userId = await redis.get(redisKey);

    if (!userId) {
      return { error: { message: "token expired" } };
    }

    const intUserId = parseInt(userId);
    const user = await User.findOne({ where: { id: intUserId } });

    if (!user) {
      return { error: { message: "User does not exist" } };
    }

    const hashedPassword = await argon2.hash(newPassword);
    await User.update({ id: intUserId }, { password: hashedPassword });
    await redis.del(redisKey);
    req.session.userId = user.id;

    return { user };
  }
}
