import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { books, shelves, shelfMembers, shelfBooks, users } from "@db/schema";
import { eq, and, not } from "drizzle-orm";

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

    // Get shelves that user owns
    const ownedShelves = await db
      .select()
      .from(shelves)
      .where(eq(shelves.ownerId, req.user.id));

    // Get public shelves from other users
    const publicShelves = await db
      .select()
      .from(shelves)
      .where(
        and(
          eq(shelves.public, true),
          // Exclude shelves owned by current user (already included above)
          // @ts-ignore - req.user.id exists as we checked isAuthenticated
          not(eq(shelves.ownerId, req.user.id))
        )
      );

    // Combine and send both sets of shelves
    res.json([...ownedShelves, ...publicShelves]);
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

      if (shelf.ownerId !== req.user.id) {
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

  const httpServer = createServer(app);
  return httpServer;
}