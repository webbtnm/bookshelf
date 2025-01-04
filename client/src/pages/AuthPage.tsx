import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

type AuthFormData = {
  username: string;
  password: string;
  telegramContact?: string;
};

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const { register: registerUser, login } = useUser();
  const { toast } = useToast();
  
  const form = useForm<AuthFormData>({
    defaultValues: {
      username: "",
      password: "",
      telegramContact: "",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isRegister) {
        const result = await registerUser(data);
        if (!result.ok) {
          toast({
            title: "Registration failed",
            description: result.message,
            variant: "destructive",
          });
          return;
        }
      } else {
        const result = await login(data);
        if (!result.ok) {
          toast({
            title: "Login failed",
            description: result.message,
            variant: "destructive",
          });
          return;
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(https://images.unsplash.com/photo-1492539438225-2666b2a98f93)`
      }}
    >
      <Card className="w-[400px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isRegister ? "Create Account" : "Welcome Back"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...form.register("username", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password", { required: true })}
              />
            </div>
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="telegramContact">Telegram Contact (Optional)</Label>
                <Input
                  id="telegramContact"
                  {...form.register("telegramContact")}
                />
              </div>
            )}
            <Button type="submit" className="w-full">
              {isRegister ? "Register" : "Login"}
            </Button>
          </form>
          <p className="text-center mt-4 text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            <Button
              variant="link"
              className="ml-1 p-0"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Login" : "Register"}
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
