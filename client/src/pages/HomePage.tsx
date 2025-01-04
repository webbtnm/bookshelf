import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { ShelfGrid } from "@/components/ShelfGrid";
import CreateShelfDialog from "@/components/CreateShelfDialog";
import BrowseShelvesDialog from "@/components/BrowseShelvesDialog";
import { Book, Search } from "lucide-react";
import type { Shelf } from "@db/schema";

type ShelvesResponse = {
  shelves: Shelf[];
};

export default function HomePage() {
  const { user } = useUser();
  const [createShelfOpen, setCreateShelfOpen] = useState(false);
  const [browseShelvesOpen, setBrowseShelvesOpen] = useState(false);

  const { data: response, isLoading } = useQuery<ShelvesResponse>({
    queryKey: ["/api/shelves"],
    enabled: !!user,
  });

  const shelves = response?.shelves || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Your Shelves</h2>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setBrowseShelvesOpen(true)}>
              <Search className="mr-2 h-4 w-4" />
              Browse Public Shelves
            </Button>
            <Button onClick={() => setCreateShelfOpen(true)}>
              <Book className="mr-2 h-4 w-4" />
              Create Shelf
            </Button>
          </div>
        </div>

        {shelves.length > 0 ? (
          <ShelfGrid shelves={shelves} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No shelves yet. Create a new shelf or browse public shelves to join!
            </p>
          </div>
        )}

        <CreateShelfDialog
          open={createShelfOpen}
          onOpenChange={setCreateShelfOpen}
        />

        <BrowseShelvesDialog
          open={browseShelvesOpen}
          onOpenChange={setBrowseShelvesOpen}
        />
      </main>
    </div>
  );
}