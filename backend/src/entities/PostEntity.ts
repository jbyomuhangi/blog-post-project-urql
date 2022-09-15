import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

import { User } from "./UserEntity";
import { Vote } from "./VoteEntity";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => String)
  @Column()
  title: string;

  @Field(() => String)
  @Column()
  text: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  @Field(() => Int)
  @Column()
  creatorId: number;

  @Field(() => Int)
  @Column({ type: "int", default: 0 })
  points: number;

  @OneToMany(() => Vote, (vote) => vote.post)
  votes: Vote[];
}
