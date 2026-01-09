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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  apiClient,
  Bill,
  BillAgingReport,
  BillStatus,
  BillType,
  CreateBillRequest,
  OutstandingLedgerSummary,
  SettleBillRequest,
  Voucher,
  VoucherEntry,
} from "@/lib/api";
import {
  Bell,
  CheckCircle2,
  Clock,
  HandCoins,
  Loader2,
  MinusCircle,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  HeartPulse,
  ClipboardList,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BillFormState = {
  billNumber: string;
  ledgerName: string;
  ledgerCode: string;
  billDate: string;
  dueDate: string;
  originalAmount: string;
  reference: string;
  narration: string;
  voucherId: string;
  voucherEntryId: string;
};

type SettleFormState = {
  voucherId: string;
  voucherEntryId: string;
  settlementAmount: string;
  reference: string;
  remarks: string;
};

const BILL_TYPE_LABELS: Record<BillType, string> = {
  RECEIVABLE: "Receivables",
  PAYABLE: "Payables",
};

const STATUS_BADGES: Record<BillStatus, { label: string; className: string }> =
  {
    OPEN: {
      label: "Open",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    PARTIAL: {
      label: "Partially Settled",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    SETTLED: {
      label: "Settled",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-gray-200 text-gray-600 border-gray-300",
    },
  };

const defaultBillForm = (billType: BillType): BillFormState => ({
  billNumber: "",
  ledgerName: "",
  ledgerCode: "",
  billDate: format(new Date(), "yyyy-MM-dd"),
  dueDate: "",
  originalAmount: "",
  reference: "",
  narration: "",
  voucherId: "",
  voucherEntryId: "",
});

const defaultSettleForm = (bill?: Bill): SettleFormState => ({
  voucherId: "",
  voucherEntryId: "",
  settlementAmount: bill ? bill.outstandingAmount.toString() : "",
  reference: bill?.billNumber ? `Settle ${bill.billNumber}` : "",
  remarks: "",
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

const getSettlementEntryOptions = (
  voucher: Voucher | undefined,
  bill: Bill | null
): VoucherEntry[] => {
  if (!voucher) return [];
  if (!bill) return voucher.entries;

  const matchingEntries = voucher.entries.filter(
    (entry) => entry.ledgerName.toLowerCase() === bill.ledgerName.toLowerCase()
  );

  return matchingEntries.length > 0 ? matchingEntries : voucher.entries;
};

export default function BillsPage() {
  const [billType, setBillType] = useState<BillType>("RECEIVABLE");
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalBills, setTotalBills] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [billForm, setBillForm] = useState<BillFormState>(
    defaultBillForm("RECEIVABLE")
  );
  const [agingReport, setAgingReport] = useState<BillAgingReport | null>(null);
  const [ledgerSummary, setLedgerSummary] = useState<
    OutstandingLedgerSummary[]
  >([]);
  const [voucherOptions, setVoucherOptions] = useState<Voucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [settleForm, setSettleForm] =
    useState<SettleFormState>(defaultSettleForm());
  const [settling, setSettling] = useState(false);
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const [cashFlowProjections, setCashFlowProjections] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [projectionsLoading, setProjectionsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadBills = async (type: BillType) => {
    try {
      setLoading(true);
      const [
        listRes,
        agingRes,
        ledgerRes,
        remindersRes,
        projectionsRes,
        analyticsRes,
      ] = await Promise.all([
        apiClient.bills.list({ billType: type, limit: 50 }),
        apiClient.bills.getAgingReport(type),
        apiClient.bills.getOutstandingByLedger(type),
        apiClient.bills.getReminders({ billType: type }),
        apiClient.bills.getCashFlowProjections({ months: 6 }),
        apiClient.bills.getAnalytics(),
      ]);

      if (listRes.success) {
        setBills(listRes.data ?? []);
        setTotalBills(listRes.total ?? listRes.data?.length ?? 0);
      } else {
        toast.error(listRes.error || "Failed to load bills");
        setBills([]);
        setTotalBills(0);
      }

      if (agingRes.success) {
        setAgingReport(agingRes.data ?? null);
      } else {
        setAgingReport(null);
      }

      if (ledgerRes.success) {
        setLedgerSummary(ledgerRes.data ?? []);
      } else {
        setLedgerSummary([]);
      }

      if (remindersRes.success) {
        setReminders(remindersRes.data ?? []);
      }

      if (projectionsRes.success) {
        setCashFlowProjections(projectionsRes.data ?? []);
      }

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.data ?? null);
      }
    } catch (error) {
      console.error("Load bills error:", error);
      toast.error("Unable to load bill information");
      setBills([]);
      setAgingReport(null);
      setLedgerSummary([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVouchers = async () => {
    try {
      setVoucherLoading(true);
      const response = await apiClient.vouchers.list({ limit: 50 });
      if (response.success) {
        setVoucherOptions(response.data ?? []);
      }
    } catch (error) {
      console.error("Load vouchers error:", error);
    } finally {
      setVoucherLoading(false);
    }
  };

  useEffect(() => {
    loadBills(billType);
  }, [billType]);

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleBillTypeToggle = (type: BillType) => {
    setBillType(type);
    setBillForm(defaultBillForm(type));
  };

  const handleBillFormChange = (field: keyof BillFormState, value: string) => {
    setBillForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateBill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !billForm.billNumber.trim() ||
      !billForm.ledgerName.trim() ||
      !billForm.originalAmount
    ) {
      toast.error("Bill number, ledger name, and amount are required");
      return;
    }

    try {
      setCreating(true);
      const payload: CreateBillRequest = {
        billType,
        billNumber: billForm.billNumber.trim(),
        ledgerName: billForm.ledgerName.trim(),
        ledgerCode: billForm.ledgerCode?.trim() || undefined,
        billDate: billForm.billDate || undefined,
        dueDate: billForm.dueDate || undefined,
        originalAmount: Number(billForm.originalAmount),
        reference: billForm.reference?.trim() || undefined,
        narration: billForm.narration?.trim() || undefined,
        voucherId: billForm.voucherId || undefined,
        voucherEntryId: billForm.voucherEntryId || undefined,
      };

      const response = await apiClient.bills.create(payload);
      if (response.success && response.data) {
        toast.success(`Bill ${response.data.billNumber} created`);
        setBillForm(defaultBillForm(billType));
        await loadBills(billType);
      } else {
        toast.error(response.error || "Failed to create bill");
      }
    } catch (error) {
      console.error("Create bill error:", error);
      toast.error("Unable to create bill");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSettlement = (bill: Bill) => {
    const baseForm = defaultSettleForm(bill);
    if (bill.voucherId) {
      baseForm.voucherId = bill.voucherId;
    }
    if (bill.voucherEntryId) {
      baseForm.voucherEntryId = bill.voucherEntryId;
    }

    setSelectedBill(bill);
    setSettleForm(baseForm);
    setSettleDialogOpen(true);
  };

  const selectedVoucher = useMemo(() => {
    if (!settleForm.voucherId) return undefined;
    return voucherOptions.find(
      (voucher) => voucher.id === settleForm.voucherId
    );
  }, [settleForm.voucherId, voucherOptions]);

  const settlementEntries = useMemo(
    () => getSettlementEntryOptions(selectedVoucher, selectedBill),
    [selectedVoucher, selectedBill]
  );

  const handleSettleFormChange = (
    field: keyof SettleFormState,
    value: string
  ) => {
    setSettleForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (!selectedVoucher) {
      setSettleForm((prev) => ({ ...prev, voucherEntryId: "" }));
      return;
    }

    setSettleForm((prev) => {
      if (prev.voucherEntryId) return prev;
      const initialEntry = settlementEntries[0];
      return {
        ...prev,
        voucherEntryId: initialEntry ? initialEntry.id : "",
      };
    });
  }, [selectedVoucher, settlementEntries]);

  const handleSettleBill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBill) return;

    if (
      !settleForm.voucherId ||
      !settleForm.voucherEntryId ||
      !settleForm.settlementAmount
    ) {
      toast.error("Voucher, voucher entry, and settlement amount are required");
      return;
    }

    try {
      setSettling(true);
      const payload: SettleBillRequest = {
        voucherId: settleForm.voucherId,
        voucherEntryId: settleForm.voucherEntryId,
        settlementAmount: Number(settleForm.settlementAmount),
        reference: settleForm.reference?.trim() || undefined,
        remarks: settleForm.remarks?.trim() || undefined,
      };

      const response = await apiClient.bills.settle(selectedBill.id, payload);
      if (response.success) {
        toast.success("Bill settled successfully");
        setSettleDialogOpen(false);
        setSelectedBill(null);
        setSettleForm(defaultSettleForm());
        await loadBills(billType);
      } else {
        toast.error(response.error || "Failed to settle bill");
      }
    } catch (error) {
      console.error("Settle bill error:", error);
      toast.error("Unable to settle bill");
    } finally {
      setSettling(false);
    }
  };

  const agingBuckets = agingReport?.aging;

  return (
    <AuthGuard requireAuth>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6 pb-32">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-10 w-10 text-teal-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                  Patient Accounts & Receivables
                </h1>
                <p className="text-sm text-[#2C2C2C]/70">
                  Track patient accounts, manage insurance receivables, and
                  process payments with comprehensive aging analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {(Object.keys(BILL_TYPE_LABELS) as BillType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={billType === type ? "default" : "secondary"}
                  onClick={() => handleBillTypeToggle(type)}
                  className={
                    billType === type
                      ? "bg-teal-600 hover:bg-teal-700 text-white"
                      : "border border-gray-300 bg-white text-[#2C2C2C]"
                  }
                >
                  {BILL_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Wallet className="h-5 w-5 text-teal-600" />
                  <span>Total Outstanding</span>
                </div>
                <p className="text-2xl font-semibold text-[#2C2C2C]">
                  {formatCurrency(agingReport?.summary.totalOutstanding ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Across {totalBills}{" "}
                  {billType === "RECEIVABLE"
                    ? "patient accounts"
                    : "vendor invoices"}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <span>Due Soon (≤30 days)</span>
                </div>
                <p className="text-xl font-semibold text-[#2C2C2C]">
                  {formatCurrency(agingBuckets?.days30.amount ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {agingBuckets?.days30.count ?? 0} bills need attention
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MinusCircle className="h-5 w-5 text-red-500" />
                  <span>Overdue (60+ days)</span>
                </div>
                <p className="text-xl font-semibold text-[#2C2C2C]">
                  {formatCurrency(
                    (agingBuckets?.days60.amount ?? 0) +
                      (agingBuckets?.days90.amount ?? 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(agingBuckets?.days60.count ?? 0) +
                    (agingBuckets?.days90.count ?? 0) || 0}{" "}
                  aged bills
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>Settled (Last 50 bills)</span>
                </div>
                <p className="text-xl font-semibold text-[#2C2C2C]">
                  {formatCurrency(
                    bills
                      .filter((bill) => bill.status === "SETTLED")
                      .reduce((sum, bill) => sum + bill.originalAmount, 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bills.filter((bill) => bill.status === "SETTLED").length}{" "}
                  bills settled
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="text-lg">Bill Register</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {billType === "RECEIVABLE"
                    ? "Monitor patient accounts and insurance claims, link them to payments for settlement."
                    : "Track vendor and supplier invoices, settle against payments."}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : bills.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-muted-foreground">
                    No bills recorded yet. Use the form to create a new bill
                    with bill-wise tracking like TallyPrime.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Bill</TableHead>
                          <TableHead>Ledger</TableHead>
                          <TableHead>Bill Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Original</TableHead>
                          <TableHead className="text-right">
                            Outstanding
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bills.map((bill) => (
                          <TableRow
                            key={bill.id}
                            className="hover:bg-gray-50/70"
                          >
                            <TableCell>
                              <div className="font-medium text-[#2C2C2C]">
                                {bill.billNumber}
                              </div>
                              {bill.reference && (
                                <div className="text-xs text-muted-foreground">
                                  {bill.reference}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium text-[#2C2C2C]">
                                {bill.ledgerName}
                              </div>
                              {bill.ledgerCode && (
                                <div className="text-xs text-muted-foreground">
                                  {bill.ledgerCode}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(bill.billDate), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell className="text-sm">
                              {bill.dueDate
                                ? format(new Date(bill.dueDate), "dd MMM yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-[#2C2C2C]">
                              {formatCurrency(bill.originalAmount)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-teal-600">
                              {formatCurrency(bill.outstandingAmount)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${
                                  STATUS_BADGES[bill.status].className
                                }`}
                              >
                                {STATUS_BADGES[bill.status].label}
                              </span>
                              {bill.settlements &&
                                bill.settlements.length > 0 && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {bill.settlements.length} settlement
                                    {bill.settlements.length > 1 ? "s" : ""}
                                  </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                              {(bill.status === "OPEN" ||
                                bill.status === "PARTIAL") && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="text-xs"
                                  onClick={() => handleOpenSettlement(bill)}
                                >
                                  Settle
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="text-xs text-muted-foreground">
                      Showing up to 50 recent bills. Use filters in future
                      iterations for deeper review.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="text-lg">
                  Create{" "}
                  {billType === "RECEIVABLE" ? "Patient Account" : "Vendor"}{" "}
                  Entry
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Record patient charges, insurance claims, or vendor invoices
                  with due dates and tracking references.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreateBill}>
                  <div className="space-y-2">
                    <Label>Bill Number *</Label>
                    <Input
                      value={billForm.billNumber}
                      onChange={(event) =>
                        handleBillFormChange("billNumber", event.target.value)
                      }
                      placeholder="INV-001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ledger Name *</Label>
                    <Input
                      value={billForm.ledgerName}
                      onChange={(event) =>
                        handleBillFormChange("ledgerName", event.target.value)
                      }
                      placeholder={
                        billType === "RECEIVABLE"
                          ? "Customer / Party Ledger"
                          : "Supplier Ledger"
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Bill Date</Label>
                      <Input
                        type="date"
                        value={billForm.billDate}
                        onChange={(event) =>
                          handleBillFormChange("billDate", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={billForm.dueDate}
                        onChange={(event) =>
                          handleBillFormChange("dueDate", event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Original Amount *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={billForm.originalAmount}
                      onChange={(event) =>
                        handleBillFormChange(
                          "originalAmount",
                          event.target.value
                        )
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reference</Label>
                    <Input
                      value={billForm.reference}
                      onChange={(event) =>
                        handleBillFormChange("reference", event.target.value)
                      }
                      placeholder="PO number or external reference"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Narration</Label>
                    <Textarea
                      value={billForm.narration}
                      onChange={(event) =>
                        handleBillFormChange("narration", event.target.value)
                      }
                      placeholder="Optional narration"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#2C2C2C]">
                      Link to Voucher (Optional)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Attach the voucher entry that originated this bill (e.g.,
                      Sales invoice for receivables).
                    </p>
                    <select
                      value={billForm.voucherId}
                      onChange={(event) => {
                        const voucherId = event.target.value;
                        handleBillFormChange("voucherId", voucherId);
                        if (!voucherId) {
                          handleBillFormChange("voucherEntryId", "");
                          return;
                        }
                        const voucher = voucherOptions.find(
                          (item) => item.id === voucherId
                        );
                        const entry =
                          voucher?.entries.find(
                            (entry) =>
                              entry.ledgerName.toLowerCase() ===
                              billForm.ledgerName.toLowerCase()
                          ) ?? voucher?.entries[0];
                        handleBillFormChange(
                          "voucherEntryId",
                          entry ? entry.id : ""
                        );
                      }}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select voucher</option>
                      {voucherOptions.map((voucher) => (
                        <option key={voucher.id} value={voucher.id}>
                          {voucher.voucherNumber} • {voucher.voucherType.name} (
                          {format(new Date(voucher.date), "dd MMM yyyy")})
                        </option>
                      ))}
                    </select>
                    {billForm.voucherId && (
                      <select
                        value={billForm.voucherEntryId}
                        onChange={(event) =>
                          handleBillFormChange(
                            "voucherEntryId",
                            event.target.value
                          )
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Select voucher entry</option>
                        {getSettlementEntryOptions(
                          voucherOptions.find(
                            (voucher) => voucher.id === billForm.voucherId
                          ),
                          null
                        ).map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.ledgerName} • {entry.entryType} •{" "}
                            {formatCurrency(entry.amount)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Bill
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Bill Reminders */}
          {reminders.length > 0 && (
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Bill Reminders</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bills approaching due date or overdue that need attention.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reminders.slice(0, 10).map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`rounded-lg border p-4 ${
                        reminder.isOverdue
                          ? "border-red-200 bg-red-50"
                          : reminder.reminderType === "URGENT"
                            ? "border-orange-200 bg-orange-50"
                            : "border-yellow-200 bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-[#2C2C2C]">
                              {reminder.billNumber}
                            </span>
                            <Badge
                              className={
                                reminder.isOverdue
                                  ? "bg-red-100 text-red-700"
                                  : reminder.reminderType === "URGENT"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }
                            >
                              {reminder.isOverdue
                                ? `Overdue ${reminder.daysOverdue} days`
                                : `Due in ${reminder.daysUntilDue} days`}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reminder.ledgerName} •{" "}
                            {formatCurrency(reminder.outstandingAmount)}
                          </div>
                          {reminder.dueDate && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Due:{" "}
                              {format(
                                new Date(reminder.dueDate),
                                "dd MMM yyyy"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reminders.length > 10 && (
                    <div className="text-xs text-muted-foreground text-center">
                      + {reminders.length - 10} more reminders
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cash Flow Projections */}
          {cashFlowProjections.length > 0 && (
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  <CardTitle className="text-lg">
                    Cash Flow Projections
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  6-month projection based on outstanding bills and their due
                  dates.
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">
                        Receivables Expected
                      </TableHead>
                      <TableHead className="text-right">
                        Payables Expected
                      </TableHead>
                      <TableHead className="text-right">
                        Net Cash Flow
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlowProjections.map((projection, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {format(
                            new Date(projection.month + "-01"),
                            "MMM yyyy"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(projection.receivablesExpected)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(projection.payablesExpected)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            projection.netCashFlow >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(projection.netCashFlow)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Analytics */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-lg border-0 bg-white">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">
                      Receivables Analytics
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-lg font-semibold text-[#2C2C2C]">
                        {formatCurrency(analytics.receivables?.total || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Outstanding
                      </div>
                      <div className="text-lg font-semibold text-amber-600">
                        {formatCurrency(
                          analytics.receivables?.outstanding || 0
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Settled
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(analytics.receivables?.settled || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Collection Rate
                      </div>
                      <div className="text-lg font-semibold text-[#2C2C2C]">
                        {analytics.receivables?.collectionRate?.toFixed(1) || 0}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-1">
                      Average Collection Days
                    </div>
                    <div className="text-sm font-medium text-[#2C2C2C]">
                      {analytics.receivables?.averageCollectionDays || 0} days
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-lg border-0 bg-white">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">
                      Payables Analytics
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-lg font-semibold text-[#2C2C2C]">
                        {formatCurrency(analytics.payables?.total || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Outstanding
                      </div>
                      <div className="text-lg font-semibold text-amber-600">
                        {formatCurrency(analytics.payables?.outstanding || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Settled
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(analytics.payables?.settled || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Payment Rate
                      </div>
                      <div className="text-lg font-semibold text-[#2C2C2C]">
                        {analytics.payables?.paymentRate?.toFixed(1) || 0}%
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-1">
                      Average Payment Days
                    </div>
                    <div className="text-sm font-medium text-[#2C2C2C]">
                      {analytics.payables?.averagePaymentDays || 0} days
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="text-lg">Outstanding by Account</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review open balances by patient or insurance provider. Drill
                down into each account&apos;s outstanding charges.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {ledgerSummary.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-muted-foreground">
                  No outstanding amounts for this bill type.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ledgerSummary.map((ledger) => (
                    <div
                      key={ledger.ledgerName}
                      className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-[#2C2C2C]">
                            {ledger.ledgerName}
                          </h3>
                          {ledger.ledgerCode && (
                            <p className="text-xs text-muted-foreground">
                              {ledger.ledgerCode}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ledger.billCount} bill
                          {ledger.billCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-teal-600">
                        {formatCurrency(ledger.totalOutstanding)}
                      </div>
                      <div className="space-y-2">
                        {ledger.bills.slice(0, 3).map((bill) => (
                          <div
                            key={bill.billNumber}
                            className="text-xs text-[#2C2C2C]/80 flex justify-between"
                          >
                            <span>{bill.billNumber}</span>
                            <span>
                              {formatCurrency(bill.outstandingAmount)}
                            </span>
                          </div>
                        ))}
                        {ledger.bills.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            + {ledger.bills.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={settleDialogOpen && Boolean(selectedBill)}
            onOpenChange={(open) => {
              setSettleDialogOpen(open);
              if (!open) {
                setSelectedBill(null);
                setSettleForm(defaultSettleForm());
              }
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  Settle Bill
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  Link a payment or receipt voucher to settle this bill with
                  precise bill references like TallyPrime.
                </DialogDescription>
              </DialogHeader>

              {selectedBill && (
                <form className="space-y-4 pt-4" onSubmit={handleSettleBill}>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-1 text-sm">
                    <div className="font-medium text-[#2C2C2C]">
                      {selectedBill.billNumber} • {selectedBill.ledgerName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Outstanding:{" "}
                      {formatCurrency(selectedBill.outstandingAmount)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Voucher *</Label>
                    <Select
                      value={settleForm.voucherId}
                      onValueChange={(value) =>
                        handleSettleFormChange("voucherId", value)
                      }
                      required
                      disabled={voucherLoading}
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                        <SelectValue placeholder="Select voucher" />
                      </SelectTrigger>
                      <SelectContent>
                        {voucherOptions.map((voucher) => (
                          <SelectItem key={voucher.id} value={voucher.id}>
                            {voucher.voucherNumber} • {voucher.voucherType.name}{" "}
                            ({format(new Date(voucher.date), "dd MMM yyyy")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {voucherLoading && (
                      <p className="text-xs text-[#2C2C2C]/70 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading vouchers...
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Select Voucher Entry *</Label>
                    <Select
                      value={settleForm.voucherEntryId}
                      onValueChange={(value) =>
                        handleSettleFormChange("voucherEntryId", value)
                      }
                      required
                      disabled={!settleForm.voucherId}
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                        <SelectValue placeholder="Select entry" />
                      </SelectTrigger>
                      <SelectContent>
                        {settlementEntries.map((entry) => (
                          <SelectItem key={entry.id} value={entry.id}>
                            {entry.ledgerName} • {entry.entryType} •{" "}
                            {formatCurrency(entry.amount)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Settlement Amount *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settleForm.settlementAmount}
                      onChange={(event) =>
                        handleSettleFormChange(
                          "settlementAmount",
                          event.target.value
                        )
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Reference</Label>
                      <Input
                        value={settleForm.reference}
                        onChange={(event) =>
                          handleSettleFormChange(
                            "reference",
                            event.target.value
                          )
                        }
                        placeholder="Voucher reference"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Remarks</Label>
                      <Input
                        value={settleForm.remarks}
                        onChange={(event) =>
                          handleSettleFormChange("remarks", event.target.value)
                        }
                        placeholder="Optional remarks"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSettleDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={settling}
                      className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                    >
                      {settling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Settling...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Settle Bill
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
