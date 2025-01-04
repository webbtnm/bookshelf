import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Book } from "@db/schema";
import AddBookDialog from "@/components/AddBookDialog";
import { useState } from "react";
import { PlusCircle, Users, UserPlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Shelf } from "@db/schema";
import { BookCard } from '@/components/BookCard'; // Added import

type Member = {
  id: number;
  username: string;
  telegramContact?: string;
};

export default function ShelfPage() {
  const { id } = useParams();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addBookOpen, setAddBookOpen] = useState(false);

  const { data: shelf, isLoading: isLoadingShelf } = useQuery<Shelf>({
    queryKey: [`/api/shelves/${id}`],
    enabled: !!id,
  });

  const { data: books = [], isLoading: isLoadingBooks } = useQuery({
    queryKey: [`/api/shelves/${id}/books`],
    enabled: !!id,
  });

  const { data: members = [], isLoading: isLoadingMembers } = useQuery<Member[]>({
    queryKey: [`/api/shelves/${id}/members`],
    enabled: !!id,
  });

  const joinShelfMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/shelves/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shelves/${id}/members`] });
      toast({
        title: "Success",
        description: "Successfully joined the shelf",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingShelf || isLoadingBooks || isLoadingMembers) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!shelf) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Shelf not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = shelf.ownerId === user?.id;
  const isMember = members.some(member => member.id === user?.id);
  const canJoin = !isOwner && !isMember && shelf.public;

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
                Members ({members.length})
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Shelf Members</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {members.map((member) => (
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

          {canJoin && (
            <Button 
              variant="default"
              onClick={() => joinShelfMutation.mutate()}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Join Shelf
            </Button>
          )}

          {isOwner && (
            <Button onClick={() => setAddBookOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
        {books.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No books in this shelf yet.</p>
          </div>
        )}
      </div>

      <AddBookDialog
        open={addBookOpen}
        onOpenChange={setAddBookOpen}
        shelfId={id}
      />
    </div>
  );
}