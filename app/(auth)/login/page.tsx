"use client";
import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useUserInfo } from "@/hooks/useUserInfo";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const schema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
    rememberMe: yup.boolean(),
  });

  const form = useForm({
    defaultValues: { email: '', password: '', rememberMe: false },
    resolver: yupResolver(schema),
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const { storeEmail, fetchUser } = useUserInfo();
const router = useRouter()
  async function onSubmit(values: { email: string; password: string; rememberMe?: boolean }) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // For now, just log/store rememberMe, you can implement persistent login logic later
      const rememberMe = values.rememberMe ?? false;
      if (rememberMe) {
        // e.g., set a cookie or localStorage flag
        // localStorage.setItem('rememberMe', 'true');
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Login failed");
      storeEmail(values.email);
      // Store rememberMe flag in localStorage for future reference
      if (values.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      setSuccess("Login successful!");
      await fetchUser(); // Update user info after login
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-background p-8 rounded shadow-md w-full max-w-md space-y-6"
        >
          <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
          {error && <div className="text-red-600">{error}</div>}
          {success && <div className="text-green-600">{success}</div>}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <div className="flex items-center space-x-2 mb-2">
                <FormControl>
                  <Checkbox id="rememberMe" checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel htmlFor="rememberMe" className="mb-0 cursor-pointer">Remember me</FormLabel>
              </div>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
          <div className="flex flex-col items-center gap-2 mt-2">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
            <span className="text-sm text-muted-foreground">Don't have an account? <Link href="/signup" className="text-blue-600 hover:underline">Create account</Link></span>
          </div>
        </form>
      </Form>
    </div>
  );
}
