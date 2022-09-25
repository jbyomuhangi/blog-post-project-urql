import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";

import { Post } from "./PostEntity";
import { User } from "./UserEntity";

@Entity()
export class Vote extends BaseEntity {
  @Column({ type: "int" })
  value: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.votes)
  user: User;

  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, (post) => post.votes, { onDelete: "CASCADE" })
  post: Post;
}
