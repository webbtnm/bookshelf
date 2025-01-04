import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shelf } from "@db/schema";

type ShelfGridProps = {
  shelves: Shelf[];
};

export function ShelfGrid({ shelves }: ShelfGridProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shelves.map((shelf) => (
        <Card 
          key={shelf.id} 
          className="transition-shadow hover:shadow-lg"
        >
          <CardHeader>
            <CardTitle className="text-xl">{shelf.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{shelf.description}</p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setLocation(`/shelf/${shelf.id.toString()}`)}
            >
              View Shelf
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}