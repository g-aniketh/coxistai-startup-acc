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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  apiClient,
  VoucherType,
  CreateVoucherRequest,
  VoucherEntryType,
  VoucherBillReferenceType,
  Voucher,
} from "@/lib/api";
import { format } from "date-fns";
import {
  Plus,
  Receipt,
  Trash2,
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  BookOpen,
  ShoppingCart,
  Package,
  FileCheck,
  FileX,
  Truck,
  Boxes,
  RefreshCw,
  Settings,
  Warehouse,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

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
        <div className="p-6 md:p-8 lg:p-10 space-y-6 bg-[#f6f7fb] min-h-full">
          <div className="flex items-center gap-4 pb-2">
            <Receipt className="h-8 w-8 text-[#607c47]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                Vouchers
              </h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                Create typed vouchers with debit/credit entries and bill-wise
                tracking.
              </p>
            </div>
          </div>

          {/* Quick Actions - Type-Specific Forms */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#2C2C2C]">
                Quick Create - Type-Specific Forms
              </CardTitle>
              <p className="text-sm text-[#2C2C2C]/70">
                Use dedicated forms for each voucher type with automatic posting
                rules
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="core" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-50">
                  <TabsTrigger
                    value="core"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#607c47]"
                  >
                    Core
                  </TabsTrigger>
                  <TabsTrigger
                    value="sales"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#607c47]"
                  >
                    Sales & Purchase
                  </TabsTrigger>
                  <TabsTrigger
                    value="inventory"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#607c47]"
                  >
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger
                    value="advanced"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#607c47]"
                  >
                    Advanced
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="core" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/vouchers/payment">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <Wallet className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Payment
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/receipt">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <ArrowDownCircle className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Receipt
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/contra">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <ArrowLeftRight className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Contra
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/journal">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <BookOpen className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Journal
                        </span>
                      </Button>
                    </Link>
                  </div>
                </TabsContent>

                <TabsContent value="sales" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/vouchers/sales">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <ShoppingCart className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Sales
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/purchase">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <Package className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Purchase
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/credit-note">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <FileCheck className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Credit Note
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/debit-note">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <FileX className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Debit Note
                        </span>
                      </Button>
                    </Link>
                  </div>
                </TabsContent>

                <TabsContent value="inventory" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Link href="/vouchers/delivery-note">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <Truck className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Delivery Note
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/receipt-note">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <Boxes className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Receipt Note
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/stock-journal">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <RefreshCw className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Stock Journal
                        </span>
                      </Button>
                    </Link>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/vouchers/memo">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <FileText className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Memo Voucher
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/reversing-journal">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <RefreshCw className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Reversing Journal
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/items">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <Layers className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Items
                        </span>
                      </Button>
                    </Link>
                    <Link href="/vouchers/warehouses">
                      <Button
                        variant="outline"
                        className="w-full h-auto flex-col gap-3 py-5 border-2 border-gray-200 hover:border-[#607c47] hover:shadow-lg hover:shadow-[#607c47]/10 transition-all duration-300 group relative overflow-hidden"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="p-3 rounded-xl bg-white border-2 border-gray-100 shadow-sm group-hover:border-[#607c47] group-hover:shadow-md group-hover:bg-[#607c47]/5 transition-all duration-300">
                          <Warehouse className="h-6 w-6 text-[#607c47] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#607c47] transition-colors duration-300">
                          Warehouses
                        </span>
                      </Button>
                    </Link>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 border border-gray-200 shadow-sm bg-white rounded-3xl">
              <CardHeader className="flex flex-col gap-3 px-6 pt-6 pb-5">
                <CardTitle className="text-xl font-semibold text-[#2C2C2C]">
                  Create Voucher (Manual Entry)
                </CardTitle>
                <p className="text-sm text-[#2C2C2C]/70">
                  Select the voucher type, enter ledger lines, and ensure the
                  voucher remains balanced. For type-specific forms, use the
                  quick actions above.
                </p>
              </CardHeader>
              <Separator className="mx-6 mb-6" />
              <CardContent className="px-6 pb-6">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="space-y-2.5">
                      <Label htmlFor="voucherTypeId" className="text-sm font-medium text-[#2C2C2C]">Voucher Type *</Label>
                      <Select
                        value={form.voucherTypeId}
                        onValueChange={handleTypeChange}
                        required
                      >
                        <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                          <SelectValue placeholder="Select voucher type" />
                        </SelectTrigger>
                        <SelectContent>
                          {voucherTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="numberingSeriesId" className="text-sm font-medium text-[#2C2C2C]">
                        Numbering Series
                      </Label>
                      <Select
                        value={form.numberingSeriesId ?? undefined}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            numberingSeriesId:
                              value === "default" ? undefined : value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                          <SelectValue placeholder="Default" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          {numberingSeriesOptions.map((series) => (
                            <SelectItem key={series.id} value={series.id}>
                              {series.name} (
                              {numberingMethodLabels[series.numberingMethod]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="voucherDate" className="text-sm font-medium text-[#2C2C2C]">Date</Label>
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

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label htmlFor="voucherReference" className="text-sm font-medium text-[#2C2C2C]">Reference</Label>
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
                    <div className="space-y-2.5">
                      <Label htmlFor="voucherNarration" className="text-sm font-medium text-[#2C2C2C]">Narration</Label>
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

                  <Separator className="my-6" />
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-[#2C2C2C]">
                          Voucher Entries
                        </h3>
                        <p className="text-sm text-[#2C2C2C]/70 mt-1.5">
                          Debit and credit lines must balance. Add bill
                          references to match Tally's bill-wise tracking.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addEntry}
                        className="flex items-center gap-2 border-gray-200 hover:border-[#607c47] hover:bg-[#607c47]/5"
                      >
                        <Plus className="h-4 w-4" /> Add Entry
                      </Button>
                    </div>

                    {form.entries.map((entry, index) => (
                      <div
                        key={index}
                        className="space-y-5 rounded-xl border border-gray-200 p-6 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                entry.entryType === "DEBIT"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-green-100 text-green-700 border border-green-200"
                              }`}
                            >
                              {entry.entryType === "DEBIT" ? (
                                <ArrowUpCircle className="h-3 w-3 inline mr-1" />
                              ) : (
                                <ArrowDownCircle className="h-3 w-3 inline mr-1" />
                              )}
                              {entry.entryType}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                              Entry #{index + 1}
                            </span>
                          </div>
                          {form.entries.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeEntry(index)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2.5 md:col-span-2">
                            <Label className="text-sm font-medium text-[#2C2C2C]">Ledger Name *</Label>
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
                          <div className="space-y-2.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">Ledger Code</Label>
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
                          <div className="space-y-2.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">Type</Label>
                            <Select
                              value={entry.entryType}
                              onValueChange={(value) =>
                                updateEntry(index, (prevEntry) => ({
                                  ...prevEntry,
                                  entryType: value as VoucherEntryType,
                                }))
                              }
                            >
                              <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DEBIT">Debit</SelectItem>
                                <SelectItem value="CREDIT">Credit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">Amount *</Label>
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
                          <div className="space-y-2.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">Narration</Label>
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
                          <div className="space-y-2.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">Cost Center</Label>
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
                          <div className="space-y-2.5">
                            <Label className="text-sm font-medium text-[#2C2C2C]">Cost Category</Label>
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
                                    <Select
                                      value={bill.referenceType}
                                      onValueChange={(value) =>
                                        updateBillReference(
                                          index,
                                          billIndex,
                                          (prevBill) => ({
                                            ...prevBill,
                                            referenceType:
                                              value as VoucherBillReferenceType,
                                          })
                                        )
                                      }
                                    >
                                      <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C] h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {billReferenceOptions.map((option) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
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

                  <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-r from-white to-gray-50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-[#2C2C2C]">
                          Total Debit:
                        </span>
                        <span className="text-lg font-semibold text-blue-600">
                          ₹{totalDebit.toFixed(2)}
                        </span>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-[#2C2C2C]">
                          Total Credit:
                        </span>
                        <span className="text-lg font-semibold text-green-600">
                          ₹{totalCredit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBalanced ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span
                        className={`text-base font-semibold ${
                          isBalanced ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {isBalanced ? "Balanced" : "Not Balanced"}
                      </span>
                    </div>
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

            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-[#2C2C2C]">
                  Recent Vouchers
                </CardTitle>
              </CardHeader>
              <Separator className="mb-4" />
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
                    {vouchers.map((voucher) => {
                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case "POSTED":
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3" />
                                Posted
                              </span>
                            );
                          case "DRAFT":
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                <Clock className="h-3 w-3" />
                                Draft
                              </span>
                            );
                          case "CANCELLED":
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                <XCircle className="h-3 w-3" />
                                Cancelled
                              </span>
                            );
                          default:
                            return null;
                        }
                      };

                      return (
                        <div
                          key={voucher.id}
                          className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-4 space-y-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-base font-semibold text-[#2C2C2C]">
                                  {voucher.voucherNumber}
                                </p>
                                {getStatusBadge(voucher.status)}
                              </div>
                              <p className="text-xs text-[#2C2C2C]/70">
                                {voucher.voucherType.name} •{" "}
                                {format(new Date(voucher.date), "dd MMM yyyy")}
                              </p>
                            </div>
                            <div className="text-lg font-bold text-[#607c47]">
                              ₹{Number(voucher.totalAmount ?? 0).toFixed(2)}
                            </div>
                          </div>
                          {voucher.narration && (
                            <p className="text-xs text-muted-foreground">
                              {voucher.narration}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {voucher.entries.length} entries
                              {voucher.inventoryLines &&
                                voucher.inventoryLines.length > 0 && (
                                  <> • {voucher.inventoryLines.length} items</>
                                )}
                              {voucher.numberingSeries && (
                                <> • Series: {voucher.numberingSeries.name}</>
                              )}
                            </div>
                            {voucher.status === "DRAFT" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const res = await apiClient.vouchers.post(
                                      voucher.id
                                    );
                                    if (res.success) {
                                      toast.success(
                                        "Voucher posted successfully"
                                      );
                                      await loadVoucherData();
                                    } else {
                                      toast.error(
                                        res.error || "Failed to post voucher"
                                      );
                                    }
                                  } catch (error) {
                                    console.error("Post voucher error:", error);
                                    toast.error("Failed to post voucher");
                                  }
                                }}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Post
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
