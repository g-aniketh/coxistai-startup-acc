"use client";
import { useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { PlusIcon } from "@heroicons/react/24/solid";

interface PlaidLinkProps {
  onSuccess: (public_token: string, metadata: any) => void;
  onError: (error: string) => void;
  variant?: "button" | "icon";
}

export default function PlaidLink({
  onSuccess,
  onError,
  variant = "button",
}: PlaidLinkProps) {
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const handlePlaidLink = async () => {
    setLoading(true);
    try {
      const response = await apiClient.accounts.plaid.createLinkToken();
      if (response.success && response.data) {
        localStorage.setItem("plaid_link_token", response.data.link_token);
        open();
      } else {
        onError(response.error || "Could not create Plaid Link token.");
      }
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token:
      typeof window !== "undefined"
        ? localStorage.getItem("plaid_link_token")
        : null,
    onSuccess,
    onExit: (err, metadata) => {
      if (err) {
        onError(
          String(
            err.error_message || err.display_message || "Plaid Link failed"
          )
        );
      }
    },
    receivedRedirectUri: window.location.href.includes("?oauth_state_id=")
      ? window.location.href
      : undefined,
  });

  if (variant === "icon") {
    return (
      <button
        onClick={handlePlaidLink}
        disabled={loading || !isAuthenticated}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#607c47] text-white hover:bg-[#607c47]/90 disabled:bg-gray-300 transition-colors shadow-sm hover:shadow-md"
        aria-label="Connect bank account"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handlePlaidLink}
      disabled={loading || !isAuthenticated}
      className="inline-flex items-center justify-center w-full px-4 py-2.5 border-2 border-[#607c47] text-sm font-semibold rounded-xl text-white bg-[#607c47] hover:bg-[#607c47]/90 focus:outline-none focus:ring-2 focus:ring-[#607c47]/40 focus:ring-offset-2 disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
      {loading ? "Connecting..." : "Connect Bank Account"}
    </button>
  );
}
