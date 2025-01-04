import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Book, Settings } from "lucide-react";
import BookCard from "@/components/BookCard";
import type { Book as BookType } from "@db/schema";
import AddBookDialog from "@/components/AddBookDialog";

export default function ProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [editedContact, setEditedContact] = useState(user?.telegramContact || "");

  const { data: books } = useQuery<BookType[]>({
    queryKey: ["/api/books"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { telegramContact: string }) => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = async () => {
    await updateProfileMutation.mutateAsync({ telegramContact: editedContact });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Profile Information</CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Username</Label>
                <p className="text-muted-foreground">{user?.username}</p>
              </div>
              <div>
                <Label htmlFor="telegramContact">Telegram Contact</Label>
                {isEditing ? (
                  <div className="flex gap-4 mt-2">
                    <Input
                      id="telegramContact"
                      value={editedContact}
                      onChange={(e) => setEditedContact(e.target.value)}
                      placeholder="@username"
                    />
                    <Button onClick={handleUpdateProfile}>Save</Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {user?.telegramContact || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">My Books</h2>
          <Button onClick={() => setAddBookOpen(true)}>
            <Book className="mr-2 h-4 w-4" />
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
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/books"] });
          }}
        />
      </div>
    </div>
  );
}
