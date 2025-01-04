import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Book, Shelf } from "@db/schema";

type AddToShelfDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book;
};

export default function AddToShelfDialog({
  open,
  onOpenChange,
  book,
}: AddToShelfDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedShelf, setSelectedShelf] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: shelves = [] } = useQuery<Shelf[]>({
    queryKey: ["/api/shelves"],
  });

  const addToShelfMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/shelves/${selectedShelf}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shelves/${selectedShelf}/books`] });
      toast({
        title: "Success",
        description: "Book added to shelf successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsAdding(false);
      setSelectedShelf("");
    },
  });

  const handleAddToShelf = async () => {
    if (!selectedShelf) {
      toast({
        title: "Error",
        description: "Please select a shelf",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    await addToShelfMutation.mutateAsync();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add "{book.title}" to Shelf</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select
            value={selectedShelf}
            onValueChange={setSelectedShelf}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a shelf" />
            </SelectTrigger>
            <SelectContent>
              {shelves.map((shelf) => (
                <SelectItem key={shelf.id} value={String(shelf.id)}>
                  {shelf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAddToShelf} 
            className="w-full" 
            disabled={isAdding || !selectedShelf}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to Shelf"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
