"use client";
import { Button } from "@/components/ui/button";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { Input } from '@/components/ui/input';
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const schema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
  });

  const form = useForm({
    defaultValues: { email: '' },
    resolver: yupResolver(schema),
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
const router = useRouter()
  async function onSubmit(values: { email: string }) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset link");
      setSuccess("If this email exists, a reset link has been sent.");
      router.push(`/otp-verify?email=${encodeURIComponent(values.email)}`);
   
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
          <h1 className="text-2xl font-bold mb-4 text-center">Forgot Password</h1>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
