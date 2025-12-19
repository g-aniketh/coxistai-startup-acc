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

type JournalEntry = {
  ledgerId: string;
  ledgerName: string;
  drAmount: string;
  crAmount: string;
  narration: string;
};

export default function JournalVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([
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
    field: keyof JournalEntry,
    value: string
  ) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };

    // If ledger is selected, update ledger name
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
      toast.error("Journal voucher requires at least two entries");
      return;
    }
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entries.length < 2) {
      toast.error("Journal voucher requires at least two entries");
      return;
    }

    if (!isBalanced) {
      toast.error(
        `Voucher is not balanced. Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`
      );
      return;
    }

    // Validate all entries have ledgers
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

      const journalType = typesRes.data.find((t) => t.category === "JOURNAL");
      if (!journalType) {
        throw new Error("Journal voucher type not found");
      }

      // Build entries array
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
        voucherTypeId: journalType.id,
        date: form.date,
        narration: form.narration,
        entries: voucherEntries,
        autoPost: true,
      });

      if (voucherRes.success) {
        toast.success("Journal voucher created and posted successfully");
        router.push("/vouchers");
      } else {
        throw new Error(voucherRes.error || "Failed to create voucher");
      }
    } catch (error) {
      console.error("Create journal voucher error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create journal voucher"
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
              <h1 className="text-2xl font-bold">Journal Voucher</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Total Debit: ₹{totalDebit.toFixed(2)} | Total Credit: ₹
                {totalCredit.toFixed(2)} |{" "}
                <span
                  className={isBalanced ? "text-green-600" : "text-red-600"}
                >
                  {isBalanced ? "Balanced" : "Not Balanced"}
                </span>
              </p>
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
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Entries</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEntry}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Ledger
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            Debit
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            Credit
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Narration
                          </th>
                          <th className="px-4 py-2 text-center text-sm font-medium w-20">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">
                              <select
                                value={entry.ledgerId}
                                onChange={(e) =>
                                  updateEntry(index, "ledgerId", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={entry.drAmount}
                                onChange={(e) =>
                                  updateEntry(index, "drAmount", e.target.value)
                                }
                                placeholder="0.00"
                                className="text-right"
                                disabled={!!entry.crAmount}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={entry.crAmount}
                                onChange={(e) =>
                                  updateEntry(index, "crAmount", e.target.value)
                                }
                                placeholder="0.00"
                                className="text-right"
                                disabled={!!entry.drAmount}
                              />
                            </td>
                            <td className="px-4 py-2">
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
                                className="text-sm"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              {entries.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEntry(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
                  <Label htmlFor="narration">Voucher Narration</Label>
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
                  <Button type="submit" disabled={submitting || !isBalanced}>
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
