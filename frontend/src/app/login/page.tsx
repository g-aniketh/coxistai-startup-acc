"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import AuthGuard from "@/components/auth/AuthGuard";
import { Eye, EyeOff, Activity, Shield, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(formData.email, formData.password);
    if (success) {
      router.push("/dashboard");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm animate-pulse" />
          <div className="absolute bottom-32 right-20 w-16 h-16 bg-white/10 rounded-xl backdrop-blur-sm animate-pulse delay-300" />
          <div className="absolute top-1/3 right-10 w-12 h-12 bg-white/10 rounded-lg backdrop-blur-sm animate-pulse delay-700" />

          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <Image
                  src="/hospitalLogo.jpeg"
                  alt="Sai Vishwas Hospitals"
                  width={56}
                  height={56}
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Sai Vishwas Hospitals</h1>
                <p className="text-teal-100 text-sm">
                  Hospital Financial Management
                </p>
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Optimize Your Hospital's
              <br />
              Financial Health
            </h2>
            <p className="text-teal-100 text-lg mb-8 max-w-md">
              Real-time revenue cycle management, patient billing, insurance
              claims tracking, and comprehensive financial analytics — all in
              one platform.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-teal-50">Real-time Revenue Tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="text-teal-50">
                  AI-Powered Financial Insights
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="text-teal-50">Secure & HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-md">
                  <Image
                    src="/hospitalLogo.jpeg"
                    alt="Sai Vishwas Hospitals"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  Sai Vishwas Hospitals
                </span>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-600 mt-2">
                Sign in to access your financial dashboard
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                      placeholder="you@hospital.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="pr-10 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium py-3 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-teal-500/25"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </div>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-teal-600 hover:text-teal-700"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
