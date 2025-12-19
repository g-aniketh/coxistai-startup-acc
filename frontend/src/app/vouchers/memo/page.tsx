"use client";

import { useEffect, useState, useMemo } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiClient, Ledger, VoucherEntryType } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

type MemoEntry = {
  ledgerId: string;
  ledgerName: string;
  drAmount: string;
  crAmount: string;
  narration: string;
};

export default function MemoVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [entries, setEntries] = useState<MemoEntry[]>([
    {
      ledgerId: "",
      ledgerName: "",
      drAmount: "",
      crAmount: "",
      narration: "",
    },
    {
      ledgerId: "",
      ledgerName: "",
      drAmount: "",
      crAmount: "",
      narration: "",
    },
  ]);
  const [form, setForm] = useState({
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
        setLedgers(ledgersRes.data);
      }
    } catch (error) {
      console.error("Load ledgers error:", error);
      toast.error("Failed to load ledgers");
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = useMemo(() => {
    return entries.reduce(
      (sum, entry) => sum + (Number(entry.drAmount) || 0),
      0
    );
  }, [entries]);

  const totalCredit = useMemo(() => {
    return entries.reduce(
      (sum, entry) => sum + (Number(entry.crAmount) || 0),
      0
    );
  }, [entries]);

  const isBalanced = useMemo(() => {
    return Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  }, [totalDebit, totalCredit]);

  const updateEntry = (
    index: number,
    field: keyof MemoEntry,
    value: string
  ) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };

    if (field === "ledgerId") {
      const ledger = ledgers.find((l) => l.id === value);
      if (ledger) {
        newEntries[index].ledgerName = ledger.name;
      }
    }

    setEntries(newEntries);
  };

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        ledgerId: "",
        ledgerName: "",
        drAmount: "",
        crAmount: "",
        narration: "",
      },
    ]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 2) {
      toast.error("Memo voucher requires at least two entries");
      return;
    }
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entries.length < 2) {
      toast.error("Memo voucher requires at least two entries");
      return;
    }

    if (!isBalanced) {
      toast.error(
        `Voucher is not balanced. Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`
      );
      return;
    }

    for (const entry of entries) {
      if (!entry.ledgerId || !entry.ledgerName) {
        toast.error("All entries must have a ledger selected");
        return;
      }
      if (!entry.drAmount && !entry.crAmount) {
        toast.error("Each entry must have either debit or credit amount");
        return;
      }
      if (entry.drAmount && entry.crAmount) {
        toast.error("Each entry can have either debit OR credit, not both");
        return;
      }
    }

    try {
      setSubmitting(true);
      const typesRes = await apiClient.vouchers.listTypes();
      if (!typesRes.success || !typesRes.data) {
        throw new Error("Failed to load voucher types");
      }

      const memoType = typesRes.data.find((t) => t.category === "MEMO");
      if (!memoType) {
        throw new Error("Memo voucher type not found");
      }

      const voucherEntries: Array<{
        ledgerName: string;
        entryType: VoucherEntryType;
        amount: number;
        narration?: string;
      }> = [];

      for (const entry of entries) {
        if (entry.drAmount && Number(entry.drAmount) > 0) {
          voucherEntries.push({
            ledgerName: entry.ledgerName,
            entryType: "DEBIT",
            amount: Number(entry.drAmount),
            narration: entry.narration || undefined,
          });
        }
        if (entry.crAmount && Number(entry.crAmount) > 0) {
          voucherEntries.push({
            ledgerName: entry.ledgerName,
            entryType: "CREDIT",
            amount: Number(entry.crAmount),
            narration: entry.narration || undefined,
          });
        }
      }

      const voucherRes = await apiClient.vouchers.create({
        voucherTypeId: memoType.id,
        date: form.date,
        narration: form.narration,
        entries: voucherEntries,
        autoPost: false, // Memo vouchers are not posted
      });

      if (voucherRes.success) {
        toast.success("Memo voucher created (not posted - provisional entry)");
        router.push("/vouchers");
      } else {
        throw new Error(voucherRes.error || "Failed to create memo voucher");
      }
    } catch (error) {
      console.error("Create memo voucher error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create memo voucher"
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
                Memo Voucher
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Create provisional/hypothetical entries (does not affect ledger balances or stock)
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#2C2C2C]">
                Memo Entries
              </CardTitle>
              <div className="flex items-center gap-4 text-sm mt-2">
                <span className="text-[#2C2C2C]">
                  Total Debit: <span className="font-semibold text-[#607c47]">₹{totalDebit.toFixed(2)}</span>
                </span>
                <span className="text-[#2C2C2C]">
                  Total Credit: <span className="font-semibold text-[#607c47]">₹{totalCredit.toFixed(2)}</span>
                </span>
                <span
                  className={`font-semibold ${
                    isBalanced ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {isBalanced ? "✓ Balanced" : "✗ Not Balanced"}
                </span>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ This is a provisional entry. It will NOT update ledger balances or inventory.
              </p>
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
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#2C2C2C] font-semibold">
                      Entries
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEntry}
                      className="border-gray-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2C2C2C]">
                            Ledger
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2C2C2C]">
                            Debit
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2C2C2C]">
                            Credit
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2C2C2C]">
                            Narration
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-[#2C2C2C] w-20">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <select
                                value={entry.ledgerId}
                                onChange={(e) =>
                                  updateEntry(index, "ledgerId", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#607c47] focus:border-transparent"
                                required
                              >
                                <option value="">Select ledger</option>
                                {ledgers.map((ledger) => (
                                  <option key={ledger.id} value={ledger.id}>
                                    {ledger.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={entry.drAmount}
                                onChange={(e) =>
                                  updateEntry(index, "drAmount", e.target.value)
                                }
                                placeholder="0.00"
                                className="text-right bg-white border-gray-200 text-[#2C2C2C]"
                                disabled={!!entry.crAmount}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={entry.crAmount}
                                onChange={(e) =>
                                  updateEntry(index, "crAmount", e.target.value)
                                }
                                placeholder="0.00"
                                className="text-right bg-white border-gray-200 text-[#2C2C2C]"
                                disabled={!!entry.drAmount}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="text"
                                value={entry.narration}
                                onChange={(e) =>
                                  updateEntry(
                                    index,
                                    "narration",
                                    e.target.value
                                  )
                                }
                                placeholder="Narration"
                                className="text-sm bg-white border-gray-200 text-[#2C2C2C]"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {entries.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEntry(index)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="narration" className="text-[#2C2C2C]">
                    Voucher Narration
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
                    <Button type="button" variant="outline" className="border-gray-200">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={submitting || !isBalanced}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? "Creating..." : "Create (Draft)"}
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

