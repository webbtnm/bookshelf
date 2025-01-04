import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book } from "@db/schema";

type BookCardProps = {
  book: Book;
};

export default function BookCard({ book }: BookCardProps) {
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
    </Card>
  );
}
