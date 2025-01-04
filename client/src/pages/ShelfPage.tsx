import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BookCard from "@/components/BookCard";
import AddBookDialog from "@/components/AddBookDialog";
import { useState } from "react";
import { PlusCircle, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";

type Member = {
  id: number;
  username: string;
  telegramContact?: string;
};

export default function ShelfPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [addBookOpen, setAddBookOpen] = useState(false);

  const { data: shelf } = useQuery({
    queryKey: [`/api/shelves/${id}`],
  });

  const { data: books } = useQuery({
    queryKey: [`/api/shelves/${id}/books`],
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: [`/api/shelves/${id}/members`],
  });

  if (!shelf) {
    return null;
  }

  const isOwner = shelf.ownerId === user?.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{shelf.name}</h1>
          <p className="text-muted-foreground mt-2">{shelf.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 text-sm rounded-full ${shelf.public ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
              {shelf.public ? "Public" : "Private"}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Members ({members?.length ?? 0})
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Shelf Members</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {members?.map((member) => (
                  <div key={member.id} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {member.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.username}</p>
                      {member.telegramContact && (
                        <p className="text-sm text-muted-foreground">
                          {member.telegramContact}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {isOwner && (
            <Button onClick={() => setAddBookOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          )}
        </div>
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
  );
}