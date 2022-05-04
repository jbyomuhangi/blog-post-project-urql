import { Entity, Property } from "@mikro-orm/core";

@Entity()
export class Post {
  @Property()
  id!: string;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  title!: string;
}
