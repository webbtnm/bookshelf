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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type CreateShelfDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormData = {
  name: string;
  description: string;
  public: boolean;
};

export default function CreateShelfDialog({ open, onOpenChange }: CreateShelfDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      public: true,
    },
  });

  const createShelfMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/shelves", {
        method: "POST",
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
      queryClient.invalidateQueries({ queryKey: ["/api/shelves"] });
      toast({
        title: "Success",
        description: "Shelf created successfully",
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
      setIsCreating(false);
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsCreating(true);
    await createShelfMutation.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Shelf</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleForm(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...form.register("name", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="public">Public Shelf</Label>
            <Switch
              id="public"
              checked={form.watch("public")}
              onCheckedChange={(checked) => form.setValue("public", checked)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Shelf"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
