"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient, Ledger } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ContraVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cashBankLedgers, setCashBankLedgers] = useState<Ledger[]>([]);
  const [form, setForm] = useState({
    sourceLedgerId: "",
    destinationLedgerId: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    narration: "",
  });

  useEffect(() => {
    loadLedgers();
  }, []);

  const loadLedgers = async () => {
    try {
      setLoading(true);
      const ledgersRes = await apiClient.bookkeeping.listLedgers();

      if (ledgersRes.success && ledgersRes.data) {
        const cashBank = ledgersRes.data.filter(
          (l) => l.ledgerSubtype === "CASH" || l.ledgerSubtype === "BANK"
        );
        setCashBankLedgers(cashBank);
      }
    } catch (error) {
      console.error("Load ledgers error:", error);
      toast.error("Failed to load ledgers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.sourceLedgerId || !form.destinationLedgerId || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.sourceLedgerId === form.destinationLedgerId) {
      toast.error("Source and destination ledgers must be different");
      return;
    }

    try {
      setSubmitting(true);
      const typesRes = await apiClient.vouchers.listTypes();
      if (!typesRes.success || !typesRes.data) {
        throw new Error("Failed to load voucher types");
      }

      const contraType = typesRes.data.find((t) => t.category === "CONTRA");
      if (!contraType) {
        throw new Error("Contra voucher type not found");
      }

      const sourceLedger = cashBankLedgers.find(
        (l) => l.id === form.sourceLedgerId
      );
      const destinationLedger = cashBankLedgers.find(
        (l) => l.id === form.destinationLedgerId
      );

      if (!sourceLedger || !destinationLedger) {
        throw new Error("Invalid ledger selection");
      }

      const voucherRes = await apiClient.vouchers.create({
        voucherTypeId: contraType.id,
        date: form.date,
        narration: form.narration,
        partyLedgerId: form.destinationLedgerId,
        entries: [
          {
            ledgerName: destinationLedger.name,
            entryType: "DEBIT",
            amount: Number(form.amount),
          },
          {
            ledgerName: sourceLedger.name,
            entryType: "CREDIT",
            amount: Number(form.amount),
          },
        ],
        autoPost: true,
      });

      if (voucherRes.success) {
        toast.success("Contra voucher created and posted successfully");
        router.push("/vouchers");
      } else {
        throw new Error(voucherRes.error || "Failed to create voucher");
      }
    } catch (error) {
      console.error("Create contra voucher error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create contra voucher"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="p-4 md:p-8 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#607c47] mx-auto"></div>
              <p className="mt-4 text-[#2C2C2C]/70">Loading ledgers...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/vouchers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                Contra Voucher
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Record internal cash/bank transfers
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#2C2C2C]">
                Contra Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-[#2C2C2C]">
                      Date *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      required
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sourceLedgerId" className="text-[#2C2C2C]">
                      Source (CASH/BANK) *
                    </Label>
                    <Select
                      value={form.sourceLedgerId}
                      onValueChange={(value) =>
                        setForm({ ...form, sourceLedgerId: value })
                      }
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select source ledger" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashBankLedgers.map((ledger) => (
                          <SelectItem key={ledger.id} value={ledger.id}>
                            {ledger.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="destinationLedgerId"
                      className="text-[#2C2C2C]"
                    >
                      Destination (CASH/BANK) *
                    </Label>
                    <Select
                      value={form.destinationLedgerId}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          destinationLedgerId: value,
                        })
                      }
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select destination ledger" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashBankLedgers
                          .filter((l) => l.id !== form.sourceLedgerId)
                          .map((ledger) => (
                            <SelectItem key={ledger.id} value={ledger.id}>
                              {ledger.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-[#2C2C2C]">
                      Amount *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                      required
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="narration" className="text-[#2C2C2C]">
                    Narration
                  </Label>
                  <Textarea
                    id="narration"
                    value={form.narration}
                    onChange={(e) =>
                      setForm({ ...form, narration: e.target.value })
                    }
                    rows={3}
                    placeholder="Additional notes..."
                    className="bg-white border-gray-200 text-[#2C2C2C]"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <Link href="/vouchers">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-200"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? "Creating..." : "Create & Post"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
