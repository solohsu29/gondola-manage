"use client";
import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { useUserInfo } from "@/hooks/useUserInfo";

export default function SignupPage() {
  const schema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    name: yup.string().required('Name is required'),
    password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
  });

  const form = useForm({
    defaultValues: { email: '', name: '', password: '' },
    resolver: yupResolver(schema),
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const { storeEmail, fetchUser } = useUserInfo();

  async function onSubmit(values: { email: string; name: string; password: string }) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
     
      if (!res.ok) throw new Error(data.error || data.message || "Signup failed");
      storeEmail(values.email);
      await fetchUser(); // Update user info after signup
      setSuccess("Signup successful! Please check your email for OTP (signup only).");
      setTimeout(() => {
        window.location.href = "/verify-otp";
      }, 1200);
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
          className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6"
        >
          <h1 className="text-2xl font-bold mb-4 text-center">Sign Up</h1>
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
