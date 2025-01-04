import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  telegramContact: text("telegram_contact"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shelves = pgTable("shelves", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  public: boolean("public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shelfMembers = pgTable("shelf_members", {
  id: serial("id").primaryKey(),
  shelfId: integer("shelf_id").references(() => shelves.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shelfBooks = pgTable("shelf_books", {
  id: serial("id").primaryKey(),
  shelfId: integer("shelf_id").references(() => shelves.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const booksRelations = relations(books, ({ one }) => ({
  owner: one(users, {
    fields: [books.ownerId],
    references: [users.id],
  }),
}));

export const shelvesRelations = relations(shelves, ({ one, many }) => ({
  owner: one(users, {
    fields: [shelves.ownerId],
    references: [users.id],
  }),
  members: many(shelfMembers),
  books: many(shelfBooks),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertBookSchema = createInsertSchema(books);
export const selectBookSchema = createSelectSchema(books);
export const insertShelfSchema = createInsertSchema(shelves);
export const selectShelfSchema = createSelectSchema(shelves);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;
export type Shelf = typeof shelves.$inferSelect;
export type InsertShelf = typeof shelves.$inferInsert;
