import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AddBookDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shelfId: string;
};

type FormData = {
  title: string;
  author: string;
  description: string;
};

export default function AddBookDialog({ open, onOpenChange, shelfId }: AddBookDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      title: "",
      author: "",
      description: "",
    },
  });

  const createBookMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const bookResponse = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!bookResponse.ok) {
        throw new Error(await bookResponse.text());
      }

      const book = await bookResponse.json();

      const shelfResponse = await fetch(`/api/shelves/${shelfId}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
        credentials: "include",
      });

      if (!shelfResponse?.ok) {
        return;
      }

      return book;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shelves/${shelfId}/books`] });
      toast({
        title: "Success",
        description: "Book added to shelf",
      });
      form.reset();
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
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsAdding(true);
    await createBookMutation.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Book to Shelf</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...form.register("title", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              {...form.register("author", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Book"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
