import { Card, CardContent } from "@/components/ui/card";
import type { Book } from "@db/schema";

export interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-bold mb-2">{book.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
        {book.description && (
          <p className="text-sm text-muted-foreground">{book.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default BookCard;