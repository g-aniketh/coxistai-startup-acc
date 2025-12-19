"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/vouchers">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Contra Voucher</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contra Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sourceLedgerId">Source (CASH/BANK) *</Label>
                    <select
                      id="sourceLedgerId"
                      value={form.sourceLedgerId}
                      onChange={(e) =>
                        setForm({ ...form, sourceLedgerId: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select source ledger</option>
                      {cashBankLedgers.map((ledger) => (
                        <option key={ledger.id} value={ledger.id}>
                          {ledger.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destinationLedgerId">
                      Destination (CASH/BANK) *
                    </Label>
                    <select
                      id="destinationLedgerId"
                      value={form.destinationLedgerId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          destinationLedgerId: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select destination ledger</option>
                      {cashBankLedgers
                        .filter((l) => l.id !== form.sourceLedgerId)
                        .map((ledger) => (
                          <option key={ledger.id} value={ledger.id}>
                            {ledger.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="narration">Narration</Label>
                  <Textarea
                    id="narration"
                    value={form.narration}
                    onChange={(e) =>
                      setForm({ ...form, narration: e.target.value })
                    }
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Link href="/vouchers">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={submitting}>
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
