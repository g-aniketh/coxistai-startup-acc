'use client';

import { useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PlaidLinkButton({ onSuccess, onError }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  const onPlaidSuccess = async (publicToken: string) => {
    try {
      setIsLoading(true);
      const response = await api.cfo.plaid.exchangePublicToken(publicToken);
      
      if (response.success) {
        onSuccess?.();
        // Optionally refresh the page or update state
        window.location.reload();
      } else {
        onError?.(response.error || 'Failed to connect account');
      }
    } catch (error) {
      console.error('Error exchanging public token:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to connect account');
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaidError = (error: any) => {
    console.error('Plaid Link error:', error);
    onError?.(error.message || 'Plaid Link error occurred');
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onError: onPlaidError,
  });

  const handleConnectAccount = async () => {
    try {
      setIsLoading(true);
      const response = await api.cfo.plaid.createLinkToken();
      
      if (response.success) {
        setLinkToken(response.data.linkToken);
        // The Plaid Link will open automatically when the token is set
        setTimeout(() => {
          if (ready) {
            open();
          }
        }, 100);
      } else {
        onError?.(response.error || 'Failed to create link token');
      }
    } catch (error) {
      console.error('Error creating link token:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to create link token');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleConnectAccount}
      disabled={isLoading || !ready}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Connect Bank Account
        </>
      )}
    </button>
  );
}
