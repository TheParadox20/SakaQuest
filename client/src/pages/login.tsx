import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { BackgroundCarousel } from "@/components/background-carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Handle redirect after successful login
  useEffect(() => {
    if (justLoggedIn && isAuthenticated) {
      setLocation("/");
      setJustLoggedIn(false);
    }
  }, [justLoggedIn, isAuthenticated, setLocation]);

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });


  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      toast({
        title: "Welcome to Saka!",
        description: "Your account has been created successfully.",
      });
      // Trigger auth refetch and set flag for redirect
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setJustLoggedIn(true);
    },
    onError: (error) => {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      // Trigger auth refetch and set flag for redirect
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setJustLoggedIn(true);
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundCarousel />
      
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6 py-12">
        <div className="max-w-md mx-auto w-full space-y-8">
          {/* Logo and Branding */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <div className="relative">
                <i className="fas fa-user-secret text-white text-2xl"></i>
                <i className="fas fa-search absolute -bottom-1 -right-1 text-white text-sm"></i>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Saka</h1>
            <p className="text-lg text-white/80 font-medium">Play. Explore. Discover.</p>
            <p className="text-sm text-white/70 mt-2">Explore cities through adventure</p>
          </div>

          {/* Forms Container */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 card-shadow">
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-saka-dark">Welcome Back</h2>
                </div>
                
                <div>
                  <Label htmlFor="login-email" className="block text-sm font-medium text-saka-dark mb-2">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    {...loginForm.register("email")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent transition-all"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="login-password" className="block text-sm font-medium text-saka-dark mb-2">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent transition-all"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-gradient-to-r from-saka-orange to-saka-red text-white py-3 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all"
                >
                  {loginMutation.isPending ? "Logging in..." : "Log In"}
                </Button>
                
                <div className="text-center space-y-3">
                  <a
                    href="/forgot-password"
                    className="text-saka-orange hover:text-saka-red font-medium text-sm inline-block"
                  >
                    Forgot password?
                  </a>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-gray-600 hover:text-saka-dark font-medium"
                    >
                      Need an account? Sign up
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={signupForm.handleSubmit((data) => signupMutation.mutate(data))} className="space-y-6">
                <div>
                  <Label htmlFor="signup-name" className="block text-sm font-medium text-saka-dark mb-2">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your full name"
                    {...signupForm.register("name")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent transition-all"
                  />
                  {signupForm.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="signup-email" className="block text-sm font-medium text-saka-dark mb-2">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    {...signupForm.register("email")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent transition-all"
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="signup-password" className="block text-sm font-medium text-saka-dark mb-2">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    {...signupForm.register("password")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent transition-all"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-red-500 text-sm mt-1">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full bg-gradient-to-r from-saka-orange to-saka-red text-white py-3 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all"
                >
                  {signupMutation.isPending ? "Creating account..." : "Sign Up"}
                </Button>
                
                <div className="text-center">
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-gray-600 hover:text-saka-dark font-medium"
                    >
                      Already have an account? Log in
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
