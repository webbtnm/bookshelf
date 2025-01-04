import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import ShelfGrid from "@/components/ShelfGrid";
import CreateShelfDialog from "@/components/CreateShelfDialog";
import { Book } from "lucide-react";

export default function HomePage() {
  const { user } = useUser();
  const [createShelfOpen, setCreateShelfOpen] = useState(false);

  const { data: shelves, isLoading } = useQuery({
    queryKey: ["/api/shelves"],
    enabled: !!user,
  });

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
          <Button onClick={() => setCreateShelfOpen(true)}>
            <Book className="mr-2 h-4 w-4" />
            Create Shelf
          </Button>
        </div>

        {shelves && shelves.length > 0 ? (
          <ShelfGrid shelves={shelves} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No shelves yet. Create your first shelf!</p>
          </div>
        )}

        <CreateShelfDialog
          open={createShelfOpen}
          onOpenChange={setCreateShelfOpen}
        />
      </main>
    </div>
  );
}