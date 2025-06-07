"use client";
import { useEffect, useState } from "react";


import { User } from "@/lib/generated/prisma";
import { useLocalStore } from "./useLocalStore";


export const useUserInfo = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const { getItem, setItem, removeItem } = useLocalStore();

  useEffect(() => {
    // Only handle localStorage for non-auth flows (email/code/role)
    const storedEmail = getItem("email");
    const storedCode = getItem("code");
    const storedRole = getItem("role");
    if (storedEmail) setEmail(storedEmail);
    if (storedCode) setCode(storedCode);
    if (storedRole) setRole(storedRole);
  }, []);

  // Manual fetchUser function
  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };


  const storeEmail = (email: string) => {
    setItem("email", email);
    setEmail(email);
  };
  const storeCode = (code: string) => {
    setItem("code", code);
    setCode(code);
  };
  const storeRole = (role: string) => {
    setItem("role", role);
    setRole(role);
  };

  const removeForgotPassData = () => {
    removeItem("email");
    setEmail(null);
    removeItem("code");
    setCode(null);
  };

  const removeAllData = () => {
    removeItem("email");
    removeItem("code");
    removeItem("role");
    setEmail(null);
    setCode(null);
    setRole(null);
    setUser(null);
  };

  return {
    user,
    loading,
    email,
    code,
    role,
    storeEmail,
    storeCode,
    storeRole,
    removeForgotPassData,
    removeAllData,
    fetchUser,
  };
};
