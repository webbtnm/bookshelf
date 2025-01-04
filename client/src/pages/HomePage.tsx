import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import ShelfGrid from "@/components/ShelfGrid";
import CreateShelfDialog from "@/components/CreateShelfDialog";
import { Book, Library } from "lucide-react";

export default function HomePage() {
  const { user, logout } = useUser();
  const [createShelfOpen, setCreateShelfOpen] = useState(false);

  const { data: shelves } = useQuery({
    queryKey: ["/api/shelves"],
  });

  const { data: books } = useQuery({
    queryKey: ["/api/books"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Library className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">BookCrossing</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Your Shelves</h2>
          <Button onClick={() => setCreateShelfOpen(true)}>
            <Book className="mr-2 h-4 w-4" />
            Create Shelf
          </Button>
        </div>

        <ShelfGrid shelves={shelves || []} />

        <CreateShelfDialog
          open={createShelfOpen}
          onOpenChange={setCreateShelfOpen}
        />
      </main>
    </div>
  );
}
