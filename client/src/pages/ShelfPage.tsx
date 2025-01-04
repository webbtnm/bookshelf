import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BookCard from "@/components/BookCard";
import AddBookDialog from "@/components/AddBookDialog";
import { useState } from "react";
import { PlusCircle } from "lucide-react";

export default function ShelfPage() {
  const { id } = useParams();
  const [addBookOpen, setAddBookOpen] = useState(false);

  const { data: shelf } = useQuery({
    queryKey: [`/api/shelves/${id}`],
  });

  const { data: books } = useQuery({
    queryKey: [`/api/shelves/${id}/books`],
  });

  if (!shelf) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{shelf.name}</h1>
            <p className="text-muted-foreground mt-2">{shelf.description}</p>
          </div>
          <Button onClick={() => setAddBookOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Book
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books?.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        <AddBookDialog
          open={addBookOpen}
          onOpenChange={setAddBookOpen}
          shelfId={id}
        />
      </div>
    </div>
  );
}
