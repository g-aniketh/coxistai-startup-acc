"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  apiClient,
  VoucherType,
  CreateVoucherRequest,
  VoucherEntryType,
  VoucherBillReferenceType,
  Voucher,
} from "@/lib/api";
import { format } from "date-fns";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

type BillReferenceForm = {
  reference: string;
  amount: string;
  referenceType: VoucherBillReferenceType;
  dueDate: string;
  remarks: string;
};

type EntryForm = {
  ledgerName: string;
  ledgerCode?: string;
  entryType: VoucherEntryType;
  amount: string;
  narration?: string;
  costCenterName?: string;
  costCategory?: string;
  billReferences: BillReferenceForm[];
};

type VoucherFormState = Omit<CreateVoucherRequest, "entries"> & {
  entries: EntryForm[];
};

const DEFAULT_ENTRY: EntryForm = {
  ledgerName: "",
  ledgerCode: "",
  entryType: "DEBIT",
  amount: "",
  narration: "",
  costCenterName: "",
  costCategory: "",
  billReferences: [],
};

const numberingMethodLabels: Record<string, string> = {
  AUTOMATIC: "Automatic",
  AUTOMATIC_WITH_OVERRIDE: "Automatic (Manual Override)",
  MULTI_USER_AUTO: "Multi-user Automatic",
  MANUAL: "Manual",
  NONE: "None",
};

const billReferenceOptions: Array<{
  value: VoucherBillReferenceType;
  label: string;
}> = [
  { value: "AGAINST", label: "Against" },
  { value: "NEW", label: "New Reference" },
  { value: "ADVANCE", label: "Advance" },
  { value: "ON_ACCOUNT", label: "On Account" },
];

export default function VouchersPage() {
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<VoucherFormState>({
    voucherTypeId: "",
    numberingSeriesId: undefined,
    date: format(new Date(), "yyyy-MM-dd"),
    reference: "",
    narration: "",
    entries: [DEFAULT_ENTRY, { ...DEFAULT_ENTRY, entryType: "CREDIT" }],
  });

  const selectedVoucherType = useMemo(
    () => voucherTypes.find((type) => type.id === form.voucherTypeId),
    [voucherTypes, form.voucherTypeId]
  );

  const numberingSeriesOptions = useMemo(() => {
    if (!selectedVoucherType) return [];
    return selectedVoucherType.numberingSeries ?? [];
  }, [selectedVoucherType]);

  const totalDebit = useMemo(() => {
    return form.entries
      .filter((entry) => entry.entryType === "DEBIT")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  }, [form.entries]);

  const totalCredit = useMemo(() => {
    return form.entries
      .filter((entry) => entry.entryType === "CREDIT")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  }, [form.entries]);

  const isBalanced = useMemo(() => {
    return Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  }, [totalDebit, totalCredit]);

  const loadVoucherData = async () => {
    try {
      setLoading(true);
      const [typesRes, vouchersRes] = await Promise.all([
        apiClient.vouchers.listTypes(),
        apiClient.vouchers.list({ limit: 10 }),
      ]);

      if (typesRes.success && typesRes.data) {
        setVoucherTypes(typesRes.data);
        if (!form.voucherTypeId && typesRes.data.length > 0) {
          const defaultType =
            typesRes.data.find((type) => type.isDefault) ?? typesRes.data[0];
          const defaultSeries = defaultType.numberingSeries.find(
            (series) => series.isDefault
          );
          setForm((prev) => ({
            ...prev,
            voucherTypeId: defaultType.id,
            numberingSeriesId: defaultSeries?.id,
          }));
        }
      } else if (!typesRes.success) {
        toast.error(typesRes.error || "Failed to load voucher types");
      }

      if (vouchersRes.success && vouchersRes.data) {
        setVouchers(vouchersRes.data);
      } else if (!vouchersRes.success) {
        toast.error(vouchersRes.error || "Failed to load vouchers");
      }
    } catch (error) {
      console.error("Load voucher data error:", error);
      toast.error("Unable to load voucher configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoucherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTypeChange = (voucherTypeId: string) => {
    const type = voucherTypes.find((item) => item.id === voucherTypeId);
    setForm((prev) => ({
      ...prev,
      voucherTypeId,
      numberingSeriesId: type?.numberingSeries.find(
        (series) => series.isDefault
      )?.id,
    }));
  };

  const updateEntry = (
    index: number,
    updater: (entry: EntryForm) => EntryForm
  ) => {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.map((entry, i) =>
        i === index ? updater(entry) : entry
      ),
    }));
  };

  const addEntry = () => {
    setForm((prev) => ({
      ...prev,
      entries: [...prev.entries, { ...DEFAULT_ENTRY, entryType: "CREDIT" }],
    }));
  };

  const removeEntry = (index: number) => {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index),
    }));
  };

  const addBillReference = (entryIndex: number) => {
    updateEntry(entryIndex, (entry) => ({
      ...entry,
      billReferences: [
        ...entry.billReferences,
        {
          reference: "",
          amount: "",
          referenceType: "AGAINST",
          dueDate: "",
          remarks: "",
        },
      ],
    }));
  };

  const updateBillReference = (
    entryIndex: number,
    billIndex: number,
    updater: (
      bill: EntryForm["billReferences"][number]
    ) => EntryForm["billReferences"][number]
  ) => {
    updateEntry(entryIndex, (entry) => ({
      ...entry,
      billReferences: entry.billReferences.map((bill, i) =>
        i === billIndex ? updater(bill) : bill
      ),
    }));
  };

  const removeBillReference = (entryIndex: number, billIndex: number) => {
    updateEntry(entryIndex, (entry) => ({
      ...entry,
      billReferences: entry.billReferences.filter((_, i) => i !== billIndex),
    }));
  };

  const resetForm = () => {
    const defaultSeries =
      selectedVoucherType?.numberingSeries.find((series) => series.isDefault)
        ?.id ?? null;
    setForm({
      voucherTypeId: selectedVoucherType?.id ?? "",
      numberingSeriesId: defaultSeries ?? undefined,
      date: format(new Date(), "yyyy-MM-dd"),
      reference: "",
      narration: "",
      entries: [DEFAULT_ENTRY, { ...DEFAULT_ENTRY, entryType: "CREDIT" }],
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.voucherTypeId) {
      toast.error("Select a voucher type");
      return;
    }

    if (!isBalanced) {
      toast.error("Voucher is not balanced");
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateVoucherRequest = {
        voucherTypeId: form.voucherTypeId,
        numberingSeriesId: form.numberingSeriesId,
        date: form.date,
        reference: form.reference?.trim() || undefined,
        narration: form.narration?.trim() || undefined,
        entries: form.entries.map((entry) => ({
          ledgerName: entry.ledgerName.trim(),
          ledgerCode: entry.ledgerCode?.trim() || undefined,
          entryType: entry.entryType,
          amount: Number(entry.amount),
          narration: entry.narration?.trim() || undefined,
          costCenterName: entry.costCenterName?.trim() || undefined,
          costCategory: entry.costCategory?.trim() || undefined,
          billReferences:
            entry.billReferences?.length > 0
              ? entry.billReferences.map((bill) => ({
                  reference: bill.reference.trim(),
                  amount: Number(bill.amount),
                  referenceType: bill.referenceType,
                  dueDate: bill.dueDate || undefined,
                  remarks: bill.remarks?.trim() || undefined,
                }))
              : undefined,
        })),
      };

      const response = await apiClient.vouchers.create(payload);
      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to create voucher");
        return;
      }

      toast.success(`Voucher ${response.data.voucherNumber} created`);
      resetForm();
      await loadVoucherData();
    } catch (error) {
      console.error("Submit voucher error:", error);
      toast.error("Unable to create voucher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                Vouchers
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Create typed vouchers with debit/credit entries and bill-wise
                tracking.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="text-lg text-[#2C2C2C]">
                  Create Voucher
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select the voucher type, enter ledger lines, and ensure the
                  voucher remains balanced.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="voucherTypeId">Voucher Type</Label>
                      <select
                        id="voucherTypeId"
                        value={form.voucherTypeId}
                        onChange={(event) =>
                          handleTypeChange(event.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                        required
                      >
                        <option value="">Select voucher type</option>
                        {voucherTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numberingSeriesId">
                        Numbering Series
                      </Label>
                      <select
                        id="numberingSeriesId"
                        value={form.numberingSeriesId ?? ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            numberingSeriesId: event.target.value || undefined,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                      >
                        <option value="">Default</option>
                        {numberingSeriesOptions.map((series) => (
                          <option key={series.id} value={series.id}>
                            {series.name} (
                            {numberingMethodLabels[series.numberingMethod]})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="voucherDate">Date</Label>
                      <Input
                        id="voucherDate"
                        type="date"
                        value={form.date}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            date: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="voucherReference">Reference</Label>
                      <Input
                        id="voucherReference"
                        value={form.reference ?? ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            reference: event.target.value,
                          }))
                        }
                        placeholder="Optional reference number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voucherNarration">Narration</Label>
                      <Textarea
                        id="voucherNarration"
                        value={form.narration ?? ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            narration: event.target.value,
                          }))
                        }
                        placeholder="Optional narration for the voucher"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-[#2C2C2C]">
                          Voucher Entries
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Debit and credit lines must balance. Add bill
                          references to match Tally’s bill-wise tracking.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addEntry}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" /> Add Entry
                      </Button>
                    </div>

                    {form.entries.map((entry, index) => (
                      <div
                        key={index}
                        className="space-y-3 rounded-xl border border-gray-200 p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="px-2 py-1 rounded bg-white border border-gray-200">
                              {entry.entryType}
                            </span>
                            <span className="px-2 py-1 rounded bg-white border border-gray-200">
                              Entry #{index + 1}
                            </span>
                          </div>
                          {form.entries.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-500 hover:text-red-600"
                              onClick={() => removeEntry(index)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Ledger Name *</Label>
                            <Input
                              value={entry.ledgerName}
                              onChange={(event) =>
                                updateEntry(index, (prevEntry) => ({
                                  ...prevEntry,
                                  ledgerName: event.target.value,
                                }))
                              }
                              placeholder="Ledger name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Ledger Code</Label>
                            <Input
                              value={entry.ledgerCode}
                              onChange={(event) =>
                                updateEntry(index, (prevEntry) => ({
                                  ...prevEntry,
                                  ledgerCode: event.target.value,
                                }))
                              }
                              placeholder="Optional code"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <select
                              value={entry.entryType}
                              onChange={(event) =>
                                updateEntry(index, (prevEntry) => ({
                                  ...prevEntry,
                                  entryType: event.target
                                    .value as VoucherEntryType,
                                }))
                              }
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                            >
                              <option value="DEBIT">Debit</option>
                              <option value="CREDIT">Credit</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Amount *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={entry.amount}
                              onChange={(event) =>
                                updateEntry(index, (prevEntry) => ({
                                  ...prevEntry,
                                  amount: event.target.value,
                                }))
                              }
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Narration</Label>
                            <Input
                              value={entry.narration}
                              onChange={(event) =>
                                updateEntry(index, (prevEntry) => ({
                                  ...prevEntry,
                                  narration: event.target.value,
                                }))
                              }
                              placeholder="Optional narration"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cost Center</Label>
                            <Input
                              value={entry.costCenterName}
                              onChange={(event) =>
                                updateEntry(index, (prevEntry) => ({
                                  ...prevEntry,
                                  costCenterName: event.target.value,
                                }))
                              }
                              placeholder="Optional cost center"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cost Category</Label>
                            <Input
                              value={entry.costCategory}
                              onChange={(event) =>
                                updateEntry(index, (prevEntry) => ({
                                  ...prevEntry,
                                  costCategory: event.target.value,
                                }))
                              }
                              placeholder="Optional cost category"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-[#2C2C2C]">
                              Bill References
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addBillReference(index)}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Reference
                            </Button>
                          </div>

                          {entry.billReferences.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              No bill references added. Use this to link
                              invoices or advances, similar to Tally’s bill-wise
                              details.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {entry.billReferences.map((bill, billIndex) => (
                                <div
                                  key={billIndex}
                                  className="grid gap-3 md:grid-cols-5 rounded border border-gray-200 bg-white px-3 py-2"
                                >
                                  <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">Reference</Label>
                                    <Input
                                      value={bill.reference}
                                      onChange={(event) =>
                                        updateBillReference(
                                          index,
                                          billIndex,
                                          (prevBill) => ({
                                            ...prevBill,
                                            reference: event.target.value,
                                          })
                                        )
                                      }
                                      placeholder="Invoice / Bill reference"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Amount</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={bill.amount}
                                      onChange={(event) =>
                                        updateBillReference(
                                          index,
                                          billIndex,
                                          (prevBill) => ({
                                            ...prevBill,
                                            amount: event.target.value,
                                          })
                                        )
                                      }
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Type</Label>
                                    <select
                                      value={bill.referenceType}
                                      onChange={(event) =>
                                        updateBillReference(
                                          index,
                                          billIndex,
                                          (prevBill) => ({
                                            ...prevBill,
                                            referenceType: event.target
                                              .value as VoucherBillReferenceType,
                                          })
                                        )
                                      }
                                      className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-[#2C2C2C]"
                                    >
                                      {billReferenceOptions.map((option) => (
                                        <option
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Due Date</Label>
                                    <Input
                                      type="date"
                                      value={bill.dueDate}
                                      onChange={(event) =>
                                        updateBillReference(
                                          index,
                                          billIndex,
                                          (prevBill) => ({
                                            ...prevBill,
                                            dueDate: event.target.value,
                                          })
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="md:col-span-4 space-y-1">
                                    <Label className="text-xs">Remarks</Label>
                                    <Input
                                      value={bill.remarks}
                                      onChange={(event) =>
                                        updateBillReference(
                                          index,
                                          billIndex,
                                          (prevBill) => ({
                                            ...prevBill,
                                            remarks: event.target.value,
                                          })
                                        )
                                      }
                                      placeholder="Optional notes"
                                    />
                                  </div>
                                  <div className="flex items-center justify-end md:col-span-5">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-red-500 hover:text-red-600"
                                      onClick={() =>
                                        removeBillReference(index, billIndex)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                                      Reference
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-[#2C2C2C]">
                      Total Debit:{" "}
                      <span className="text-[#607c47]">
                        {totalDebit.toFixed(2)}
                      </span>
                    </span>
                    <span className="font-medium text-[#2C2C2C]">
                      Total Credit:{" "}
                      <span className="text-[#607c47]">
                        {totalCredit.toFixed(2)}
                      </span>
                    </span>
                    <span
                      className={`font-semibold ${
                        isBalanced ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {isBalanced ? "Balanced" : "Not Balanced"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !isBalanced}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                    >
                      {submitting ? "Saving..." : "Create Voucher"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-[#2C2C2C]">
                  Recent Vouchers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
                  </div>
                ) : vouchers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-muted-foreground bg-gray-50">
                    No vouchers recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#2C2C2C]">
                              {voucher.voucherNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {voucher.voucherType.name} •{" "}
                              {format(new Date(voucher.date), "dd MMM yyyy")}
                            </p>
                          </div>
                          <div className="text-sm font-semibold text-[#607c47]">
                            ₹{Number(voucher.totalAmount ?? 0).toFixed(2)}
                          </div>
                        </div>
                        {voucher.narration && (
                          <p className="text-xs text-muted-foreground">
                            {voucher.narration}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {voucher.entries.length} entries •{" "}
                          {voucher.numberingSeries
                            ? `Series: ${voucher.numberingSeries.name}`
                            : "Default series"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
