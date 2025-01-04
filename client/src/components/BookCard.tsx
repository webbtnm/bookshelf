import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book } from "@db/schema";
import { BookPlus } from "lucide-react";
import AddToShelfDialog from "./AddToShelfDialog";

type BookCardProps = {
  book: Book;
};

export default function BookCard({ book }: BookCardProps) {
  const [addToShelfOpen, setAddToShelfOpen] = useState(false);

  return (
    <Card className="h-full transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{book.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">by {book.author}</p>
        {book.description && (
          <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
            {book.description}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setAddToShelfOpen(true)}
        >
          <BookPlus className="mr-2 h-4 w-4" />
          Add to Shelf
        </Button>
      </CardFooter>

      <AddToShelfDialog
        open={addToShelfOpen}
        onOpenChange={setAddToShelfOpen}
        book={book}
      />
    </Card>
  );
}