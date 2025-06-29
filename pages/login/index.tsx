import { LoginForm } from "@/components/login-form";

/**
 * Página de login que apenas centraliza o componente {@link LoginForm}.
 */
export default function LoginPage() {
  return (
    <div className="flex safe-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
