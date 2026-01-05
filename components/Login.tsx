"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { LoginInput } from "@/lib/validations/auth-schemas";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });
  
  const router = useRouter();

  // Role-based redirect mapping
  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'ADMIN':
      case 'STAFF_ADMIN':
        return '/Admin_Home';
      case 'STAFF':
      default:
        return '/Staff_Home';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || "Invalid credentials. Please try again.");
      } else if (result?.ok) {
        // Successful login - get session to determine redirect based on role
        const session = await getSession();
        const role = session?.user?.role || 'STAFF';
        const redirectPath = getRedirectPath(role);
        router.push(redirectPath);
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/reset-password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center genbkg px-4">
      <div className="w-full max-w-md mx-auto p-8 bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl border border-stone-200">
        <div className="text-center mb-6">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4">
            <img 
              src="/tcnlogosm.png" 
              alt="TCN Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-amber-900">
            TCN Communications
          </h1>
          <p className="text-stone-600 mt-2">
            Sign in to your account
          </p>
        </div>

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 rounded-xl">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-amber-900 font-medium">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              disabled={loading}
              className="w-full border-stone-300 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-amber-900 font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                disabled={loading}
                className="w-full pr-10 border-stone-300 focus:border-amber-500 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-500 hover:text-amber-700"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white shadow-md" 
            disabled={loading || !formData.email || !formData.password}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-amber-700 hover:text-amber-900 hover:underline"
            disabled={loading}
          >
            Forgot your password?
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-stone-500">
          <p>Authorized personnel only</p>
          <p>Contact IT support for assistance</p>
        </div>
      </div>
    </div>
  );
}