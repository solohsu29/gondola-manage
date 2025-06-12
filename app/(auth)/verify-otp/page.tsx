"use client";
import React, { useState, useEffect, useRef } from "react";
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { InputOTP, InputOTPSlot } from '@/components/ui/input-otp';
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useUserInfo } from "@/hooks/useUserInfo";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";


export default function VerifyOtpPage() {
  const schema = yup.object().shape({
    otp: yup.string().required('OTP is required').matches(/^\d{6}$/, 'OTP must be 6 digits'),
  });

  const form = useForm({
    defaultValues: { otp: '' },
    resolver: yupResolver(schema),
  });
  const [otp, setOtp] = useState("");
  const { email, removeAllData, fetchUser } = useUserInfo();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  const [timer, setTimer] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  // Start countdown on mount and after resend
  useEffect(() => {
    if (timer === 0 && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    if (timer > 0 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current && timer === 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timer]);



  const handleResend = async () => {
    setResendLoading(true);
    setResendError("");
    setResendSuccess("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
      setResendSuccess("OTP resent! Please check your email.");
      setTimer(60);
    } catch (err: any) {
      setResendError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const onSubmit = async (data: { otp: string }) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: data.otp }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "OTP verification failed");
      removeAllData();
      setSuccess("OTP verified! Redirecting...");
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-background p-8 rounded shadow-md w-full max-w-md space-y-6"
        >
        <h1 className="text-2xl font-bold mb-4 text-center">Verify OTP</h1>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        {resendError && <div className="text-red-600 text-center">{resendError}</div>}
        {resendSuccess && <div className="text-green-600 text-center">{resendSuccess}</div>}

        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OTP</FormLabel>
              <FormControl>
                <InputOTP
                  value={field.value}
                  onChange={field.onChange}
                  maxLength={6}
                  containerClassName="justify-center mb-6"
                  className="w-12 h-12 text-2xl border rounded text-center mx-1"
                  autoFocus
                >
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col items-center mb-2">
          <span className="text-sm text-muted-foreground mb-1">
            Didn't receive OTP?
          </span>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-blue-600 disabled:text-gray-400"
            onClick={handleResend}
            disabled={timer > 0 || resendLoading}
          >
            {resendLoading
              ? "Resending..."
              : timer > 0
                ? `Resend OTP in ${timer}s`
                : "Resend OTP"}
          </Button>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </Button>
        </form>
      </Form>
    </div>
  );
}
