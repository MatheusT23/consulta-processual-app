import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

/**
 * Formulário de login padrão utilizado na página de autenticação.
 *
 * @param className - Permite adicionar classes extras ao contêiner.
 */
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const level = (form.elements.namedItem("level") as HTMLSelectElement)?.value;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("userLevel", level || "1");
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Cartão central que contém o formulário */}
      <Card>
        <CardHeader>
          {/* Título e subtítulo do formulário */}
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Campos de entrada do usuário */}
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="level">Nível</Label>
                <select id="level" name="level" className="border rounded-md p-2">
                  <option value="1">Usuário</option>
                  <option value="0">Admin</option>
                </select>
              </div>
              <div className="flex flex-col gap-3">
                {/* Botões de ação */}
                <Button type="submit" className="w-full">
                  Login
                </Button>
                <Button variant="outline" className="w-full">
                  Login with Google
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
