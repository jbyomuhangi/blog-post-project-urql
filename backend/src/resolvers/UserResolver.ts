import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
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

@ObjectType()
export class FieldError {
  @Field(() => String)
  field: string;

  @Field(() => String)
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => String, { nullable: true })
  error?: string;

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
    @Arg("options", () => RegisterInput) options: RegisterInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const { email, username, password } = options;

    const errors = validateRegister(options);
    if (errors.length > 0) return { errors };

    try {
      const hashedPassword = await argon2.hash(password);
      const user = em.create(User, {
        email,
        username,
        password: hashedPassword,
      });
      await em.persistAndFlush(user);
      req.session.userId = user.id;

      return { user };
    } catch (error) {
      if (error.code === "23505") {
        return {
          errors: [{ field: "username", message: "Username already exists" }],
        };
      }

      return { error: "undefined error" };
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options", () => LoginInput) options: LoginInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const { usernameOrEmail, password } = options;

    const isEmail = usernameOrEmail.includes("@");
    const user = await em.findOne(
      User,
      isEmail ? { email: usernameOrEmail } : { username: usernameOrEmail }
    );

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
    @Ctx() { em, redis }: MyContext
  ): Promise<boolean> {
    const user = await em.findOne(User, { email });

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
}
