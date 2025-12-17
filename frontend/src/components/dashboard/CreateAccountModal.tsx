"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

// Zod validation schema
const accountSchema = z.object({
  accountName: z
    .string()
    .min(3, "Account name must be at least 3 characters")
    .max(50, "Account name must be less than 50 characters"),
  balance: z
    .number()
    .nonnegative("Balance cannot be negative")
    .max(1000000000, "Balance is too large"),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAccountModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    trigger,
    watch,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountName: "",
      balance: 0,
    },
  });

  const [step, setStep] = useState<1 | 2>(1);
  const watchAccountName = watch("accountName");
  const watchBalance = watch("balance");

  const onSubmit = async (data: AccountFormData) => {
    try {
      const response = await apiClient.accounts.create({
        accountName: data.accountName,
        balance: data.balance,
      });

      if (response.success) {
        toast.success("Bank account created successfully!");
        reset();
        setStep(1);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create account");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create account");
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  const handleNext = async () => {
    const isValid = await trigger("accountName");
    if (isValid) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Mock Bank Account</DialogTitle>
          <DialogDescription>
            Walk through a quick two-step wizard to add a simulated account for
            cashflow tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground border-b border-gray-200 pb-3">
          <span className={step === 1 ? "text-[#607c47]" : ""}>
            1. Account details
          </span>
          <span className="flex-1 border-t border-dashed mx-2" />
          <span className={step === 2 ? "text-[#607c47]" : ""}>
            2. Opening balance
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  placeholder="Main Checking Account"
                  {...register("accountName")}
                  className={errors.accountName ? "border-red-500" : ""}
                />
                {errors.accountName && (
                  <p className="text-sm text-red-500">
                    {errors.accountName.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Give your account a friendly name (e.g., "Operating Account",
                  "Marketing Wallet").
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="balance">Initial Balance *</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="50000"
                  {...register("balance", { valueAsNumber: true })}
                  className={errors.balance ? "border-red-500" : ""}
                />
                {errors.balance && (
                  <p className="text-sm text-red-500">
                    {errors.balance.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Use the current amount you want reflected in dashboards.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-[#2C2C2C]">
                <p className="font-semibold mb-1">Review</p>
                <div className="flex justify-between">
                  <span>Account</span>
                  <span className="font-medium">
                    {watchAccountName || "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Opening balance</span>
                  <span className="font-medium">
                    {watchBalance !== undefined ? watchBalance : 0}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap justify-between gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
