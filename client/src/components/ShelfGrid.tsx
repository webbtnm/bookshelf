import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Shelf } from "@db/schema";

interface ShelfGridProps {
  shelves: Shelf[];
}

export function ShelfGrid({ shelves }: ShelfGridProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shelves.map((shelf) => (
        <Card 
          key={`shelf-${shelf.id}`}
          className="transition-shadow hover:shadow-lg"
        >
          <CardHeader>
            <CardTitle className="text-xl">{shelf.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {shelf.description || 'No description available'}
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                const shelfId = shelf?.id;
                if (shelfId !== undefined) {
                  setLocation(`/shelf/${shelfId}`);
                }
              }}
            >
              View Shelf
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}