import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { books, shelves, shelfMembers, shelfBooks, users } from "@db/schema";
import { eq, and, not, exists } from "drizzle-orm";

// Extend Express.User interface
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password: string;
      telegramContact?: string;
    }
  }
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Books API
  app.get("/api/books", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      if (!req.user?.id) {
        return res.status(401).send("Invalid user session");
      }

      const userBooks = await db
        .select({
          id: books.id,
          title: books.title,
          author: books.author,
          description: books.description,
          ownerId: books.ownerId,
          createdAt: books.createdAt,
        })
        .from(books)
        .where(eq(books.ownerId, req.user.id));

      res.json(userBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Get single shelf
  app.get("/api/shelves/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).send("Invalid shelf ID");
    }

    const [shelf] = await db
      .select()
      .from(shelves)
      .where(eq(shelves.id, parseInt(id)));

    if (!shelf) {
      return res.status(404).send("Shelf not found");
    }

    // Check if user is a member or if shelf is public
    const isMember = await db
      .select()
      .from(shelfMembers)
      .where(
        and(
          eq(shelfMembers.shelfId, shelf.id),
          eq(shelfMembers.userId, req.user.id)
        )
      )
      .limit(1);

    if (!shelf.public && !isMember.length && shelf.ownerId !== req.user.id) {
      return res.status(403).send("Not authorized");
    }

    res.json(shelf);
  });

  // User Profile API
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { telegramContact } = req.body;
    const [updatedUser] = await db
      .update(users)
      .set({ telegramContact })
      .where(eq(users.id, req.user.id))
      .returning();

    res.json(updatedUser);
  });

  // Shelf Members API
  app.post("/api/shelves/:shelfId/members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { shelfId } = req.params;
    const { userId } = req.body;

    const [shelf] = await db
      .select()
      .from(shelves)
      .where(eq(shelves.id, parseInt(shelfId)));

    if (!shelf) {
      return res.status(404).send("Shelf not found");
    }

    if (!shelf.public && shelf.ownerId !== req.user.id) {
      return res.status(403).send("Not authorized");
    }

    const [member] = await db
      .insert(shelfMembers)
      .values({
        shelfId: parseInt(shelfId),
        userId: parseInt(userId),
      })
      .returning();

    res.json(member);
  });

  app.get("/api/shelves/:shelfId/members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { shelfId } = req.params;

    const members = await db
      .select({
        id: users.id,
        username: users.username,
        telegramContact: users.telegramContact,
      })
      .from(users)
      .innerJoin(shelfMembers, eq(users.id, shelfMembers.userId))
      .where(eq(shelfMembers.shelfId, parseInt(shelfId)));

    res.json(members);
  });


  // Books API
  app.post("/api/books", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { title, author, description } = req.body;
    const [book] = await db
      .insert(books)
      .values({
        title,
        author,
        description,
        ownerId: req.user.id,
      })
      .returning();

    res.json(book);
  });


  // Shelves API
  app.post("/api/shelves", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { name, description, public: isPublic } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).send("Invalid shelf name");
    }

    const [shelf] = await db
      .insert(shelves)
      .values({
        name,
        description: description || "",
        ownerId: req.user.id,
        public: Boolean(isPublic),
      })
      .returning();

    await db.insert(shelfMembers).values({
      shelfId: shelf.id,
      userId: req.user.id,
    });

    res.json(shelf);
  });

  app.get("/api/shelves", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Get shelves where user is a member
    const memberShelves = await db
      .select({
        id: shelves.id,
        name: shelves.name,
        description: shelves.description,
        ownerId: shelves.ownerId,
        public: shelves.public,
      })
      .from(shelves)
      .innerJoin(shelfMembers, eq(shelves.id, shelfMembers.shelfId))
      .where(eq(shelfMembers.userId, req.user.id));

    res.json({ shelves: memberShelves });
  });

  app.get("/api/public-shelves", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Get public shelves that the user is not a member of
    const publicShelves = await db
      .select()
      .from(shelves)
      .where(
        and(
          eq(shelves.public, true),
          not(
            exists(
              db
                .select()
                .from(shelfMembers)
                .where(
                  and(
                    eq(shelfMembers.shelfId, shelves.id),
                    eq(shelfMembers.userId, req.user.id)
                  )
                )
            )
          )
        )
      );

    res.json(publicShelves);
  });

  app.post("/api/shelves/:shelfId/books", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { shelfId } = req.params;
      const { bookId } = req.body;

      if (!shelfId || !bookId) {
        return res.status(400).send("Missing required IDs");
      }

      const parsedShelfId = parseInt(shelfId);
      const parsedBookId = parseInt(bookId);

      if (isNaN(parsedShelfId) || isNaN(parsedBookId)) {
        return res.status(400).send("Invalid shelf or book ID");
      }

      const [shelf] = await db
        .select()
        .from(shelves)
        .where(eq(shelves.id, parsedShelfId));

      if (!shelf) {
        return res.status(404).send("Shelf not found");
      }

      // Check if user is a member of the shelf
      const [member] = await db
        .select()
        .from(shelfMembers)
        .where(
          and(
            eq(shelfMembers.shelfId, parsedShelfId),
            eq(shelfMembers.userId, req.user.id)
          )
        );

      if (!member && shelf.ownerId !== req.user.id) {
        return res.status(403).send("Not authorized");
      }

      const [shelfBook] = await db
        .insert(shelfBooks)
        .values({
          shelfId: parsedShelfId,
          bookId: parsedBookId,
        })
        .returning();

      res.json(shelfBook);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/shelves/:shelfId/books", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { shelfId } = req.params;
      const parsedShelfId = parseInt(shelfId);

      if (isNaN(parsedShelfId)) {
        return res.status(400).send("Invalid shelf ID");
      }

      const shelfBooksList = await db
        .select({
          id: books.id,
          title: books.title,
          author: books.author,
          description: books.description,
          ownerId: books.ownerId,
        })
        .from(books)
        .innerJoin(shelfBooks, eq(books.id, shelfBooks.bookId))
        .where(eq(shelfBooks.shelfId, parsedShelfId));

      res.json(shelfBooksList);
    } catch (error) {
      console.error("Error fetching shelf books:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Delete book from shelf
  app.delete("/api/shelves/:shelfId/books/:bookId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { shelfId, bookId } = req.params;
      const parsedShelfId = parseInt(shelfId);
      const parsedBookId = parseInt(bookId);

      if (isNaN(parsedShelfId) || isNaN(parsedBookId)) {
        return res.status(400).send("Invalid shelf or book ID");
      }

      // Check if user is authorized (shelf owner or member)
      const [shelf] = await db
        .select()
        .from(shelves)
        .where(eq(shelves.id, parsedShelfId));

      if (!shelf) {
        return res.status(404).send("Shelf not found");
      }

      const [member] = await db
        .select()
        .from(shelfMembers)
        .where(
          and(
            eq(shelfMembers.shelfId, parsedShelfId),
            eq(shelfMembers.userId, req.user.id)
          )
        );

      if (!member && shelf.ownerId !== req.user.id) {
        return res.status(403).send("Not authorized");
      }

      // Delete the book from the shelf
      await db
        .delete(shelfBooks)
        .where(
          and(
            eq(shelfBooks.shelfId, parsedShelfId),
            eq(shelfBooks.bookId, parsedBookId)
          )
        );

      res.status(200).json({ message: "Book removed from shelf" });
    } catch (error) {
      console.error("Error removing book from shelf:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Delete book entirely
  app.delete("/api/books/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { id } = req.params;
      const parsedId = parseInt(id);

      if (isNaN(parsedId)) {
        return res.status(400).send("Invalid book ID");
      }

      // Check if user owns the book
      const [book] = await db
        .select()
        .from(books)
        .where(eq(books.id, parsedId));

      if (!book) {
        return res.status(404).send("Book not found");
      }

      if (book.ownerId !== req.user.id) {
        return res.status(403).send("Not authorized");
      }

      // First delete all shelf associations
      await db
        .delete(shelfBooks)
        .where(eq(shelfBooks.bookId, parsedId));

      // Then delete the book itself
      await db
        .delete(books)
        .where(eq(books.id, parsedId));

      res.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).send("Internal server error");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}