"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { HeartPulse } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const authSuccess = await checkAuth();
      if (authSuccess) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    };

    initAuth();
  }, [checkAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <HeartPulse className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">MediFinance Pro</h1>
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}
