"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiClient, PaymentMode, Ledger } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

const paymentModeOptions: Array<{ value: PaymentMode; label: string }> = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "UPI", label: "UPI" },
  { value: "NEFT", label: "NEFT" },
  { value: "RTGS", label: "RTGS" },
  { value: "OTHER", label: "Other" },
];

export default function PaymentVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cashBankLedgers, setCashBankLedgers] = useState<Ledger[]>([]);
  const [otherLedgers, setOtherLedgers] = useState<Ledger[]>([]);
  const [form, setForm] = useState({
    paidFromLedgerId: "",
    paidToLedgerId: "",
    amount: "",
    paymentMode: "CASH" as PaymentMode,
    referenceNumber: "",
    date: format(new Date(), "yyyy-MM-dd"),
    narration: "",
  });

  useEffect(() => {
    loadLedgers();
  }, []);

  const loadLedgers = async () => {
    try {
      setLoading(true);
      const [ledgersRes] = await Promise.all([
        apiClient.bookkeeping.listLedgers(),
      ]);

      if (ledgersRes.success && ledgersRes.data) {
        // Filter CASH/BANK ledgers
        const cashBank = ledgersRes.data.filter(
          (l: Ledger) =>
            l.ledgerSubtype === "CASH" || l.ledgerSubtype === "BANK"
        );
        // Filter other ledgers (exclude CASH/BANK)
        const others = ledgersRes.data.filter(
          (l: Ledger) =>
            l.ledgerSubtype !== "CASH" && l.ledgerSubtype !== "BANK"
        );
        setCashBankLedgers(cashBank);
        setOtherLedgers(others);
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

    if (!form.paidFromLedgerId || !form.paidToLedgerId || !form.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    if (Number(form.amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      setSubmitting(true);

      // Get payment voucher type
      const typesRes = await apiClient.vouchers.listTypes();
      if (!typesRes.success || !typesRes.data) {
        throw new Error("Failed to load voucher types");
      }

      const paymentType = typesRes.data.find((t) => t.category === "PAYMENT");
      if (!paymentType) {
        throw new Error("Payment voucher type not found");
      }

      const paidFromLedger = cashBankLedgers.find(
        (l) => l.id === form.paidFromLedgerId
      );
      const paidToLedger = otherLedgers.find(
        (l) => l.id === form.paidToLedgerId
      );

      if (!paidFromLedger || !paidToLedger) {
        throw new Error("Invalid ledger selection");
      }

      // Create voucher with manual entries
      const voucherRes = await apiClient.vouchers.create({
        voucherTypeId: paymentType.id,
        date: form.date,
        reference: form.referenceNumber,
        narration: form.narration,
        paymentMode: form.paymentMode,
        partyLedgerId: form.paidToLedgerId,
        entries: [
          {
            ledgerName: paidToLedger.name,
            entryType: "DEBIT",
            amount: Number(form.amount),
          },
          {
            ledgerName: paidFromLedger.name,
            entryType: "CREDIT",
            amount: Number(form.amount),
          },
        ],
        autoPost: true,
      });

      if (voucherRes.success) {
        toast.success("Payment voucher created and posted successfully");
        router.push("/vouchers");
      } else {
        throw new Error(voucherRes.error || "Failed to create voucher");
      }
    } catch (error) {
      console.error("Create payment voucher error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create payment voucher"
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
              <h1 className="text-2xl font-bold">Payment Voucher</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
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
                    <Label htmlFor="paymentMode">Payment Mode *</Label>
                    <select
                      id="paymentMode"
                      value={form.paymentMode}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          paymentMode: e.target.value as PaymentMode,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      required
                    >
                      {paymentModeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paidFromLedgerId">
                      Paid From (CASH/BANK) *
                    </Label>
                    <select
                      id="paidFromLedgerId"
                      value={form.paidFromLedgerId}
                      onChange={(e) =>
                        setForm({ ...form, paidFromLedgerId: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select cash/bank ledger</option>
                      {cashBankLedgers.map((ledger) => (
                        <option key={ledger.id} value={ledger.id}>
                          {ledger.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paidToLedgerId">Paid To *</Label>
                    <select
                      id="paidToLedgerId"
                      value={form.paidToLedgerId}
                      onChange={(e) =>
                        setForm({ ...form, paidToLedgerId: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select ledger</option>
                      {otherLedgers.map((ledger) => (
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

                  <div className="space-y-2">
                    <Label htmlFor="referenceNumber">Reference Number</Label>
                    <Input
                      id="referenceNumber"
                      value={form.referenceNumber}
                      onChange={(e) =>
                        setForm({ ...form, referenceNumber: e.target.value })
                      }
                      placeholder="Cheque no, UTR, etc."
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
