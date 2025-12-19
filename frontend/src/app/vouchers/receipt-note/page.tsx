"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiClient, Ledger, ItemMaster, WarehouseMaster } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

type InventoryLine = {
  itemId: string;
  warehouseId: string;
  quantity: string;
};

export default function ReceiptNotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [supplierLedgers, setSupplierLedgers] = useState<Ledger[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseMaster[]>([]);
  const [inventoryLines, setInventoryLines] = useState<InventoryLine[]>([
    {
      itemId: "",
      warehouseId: "",
      quantity: "",
    },
  ]);
  const [form, setForm] = useState({
    supplierLedgerId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    reference: "",
    narration: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ledgersRes, itemsRes, warehousesRes] = await Promise.all([
        apiClient.bookkeeping.listLedgers(),
        apiClient.items.list(),
        apiClient.warehouses.list(),
      ]);

      if (ledgersRes.success && ledgersRes.data) {
        const suppliers = ledgersRes.data.filter(
          (l) => l.ledgerSubtype === "SUPPLIER"
        );
        setSupplierLedgers(suppliers);
      }

      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data.filter((i) => i.isActive));
      }

      if (warehousesRes.success && warehousesRes.data) {
        setWarehouses(warehousesRes.data.filter((w) => w.isActive));
      }
    } catch (error) {
      console.error("Load data error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const updateLine = (
    index: number,
    field: keyof InventoryLine,
    value: string
  ) => {
    const newLines = [...inventoryLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setInventoryLines(newLines);
  };

  const addLine = () => {
    setInventoryLines([
      ...inventoryLines,
      {
        itemId: "",
        warehouseId: "",
        quantity: "",
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (inventoryLines.length <= 1) {
      toast.error("At least one item line is required");
      return;
    }
    setInventoryLines(inventoryLines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inventoryLines.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    for (const line of inventoryLines) {
      if (!line.itemId || !line.warehouseId || !line.quantity) {
        toast.error("Please fill all required fields in item lines");
        return;
      }
    }

    try {
      setSubmitting(true);
      const typesRes = await apiClient.vouchers.listTypes();
      if (!typesRes.success || !typesRes.data) {
        throw new Error("Failed to load voucher types");
      }

      const receiptNoteType = typesRes.data.find(
        (t) => t.category === "RECEIPT_NOTE"
      );
      if (!receiptNoteType) {
        throw new Error("Receipt Note voucher type not found");
      }

      const voucherRes = await apiClient.vouchers.create({
        voucherTypeId: receiptNoteType.id,
        date: form.date,
        reference: form.reference,
        narration: form.narration,
        partyLedgerId: form.supplierLedgerId || undefined,
        inventoryLines: inventoryLines.map((line) => ({
          itemId: line.itemId,
          warehouseId: line.warehouseId,
          quantity: Number(line.quantity),
          rate: 0, // Receipt note doesn't need rate
          discountAmount: 0,
        })),
        autoPost: true,
      });

      if (voucherRes.success) {
        toast.success("Receipt Note created successfully");
        router.push("/vouchers");
      } else {
        throw new Error(voucherRes.error || "Failed to create receipt note");
      }
    } catch (error) {
      console.error("Create receipt note error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create receipt note"
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
              <p className="mt-4 text-[#2C2C2C]/70">Loading data...</p>
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
                Receipt Note
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Record physical receiving of goods (inventory only, no ledger entries)
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#2C2C2C]">
                Receipt Note Details
              </CardTitle>
              <p className="text-sm text-[#2C2C2C]/70 mt-2">
                This voucher only affects inventory stock. No accounting entries are created.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-[#2C2C2C]">
                      Receipt Date *
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
                    <Label htmlFor="supplierLedgerId" className="text-[#2C2C2C]">
                      Supplier (Reference)
                    </Label>
                    <select
                      id="supplierLedgerId"
                      value={form.supplierLedgerId}
                      onChange={(e) =>
                        setForm({ ...form, supplierLedgerId: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#607c47] focus:border-transparent"
                    >
                      <option value="">Select supplier (optional)</option>
                      {supplierLedgers.map((ledger) => (
                        <option key={ledger.id} value={ledger.id}>
                          {ledger.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference" className="text-[#2C2C2C]">
                      Reference
                    </Label>
                    <Input
                      id="reference"
                      value={form.reference}
                      onChange={(e) =>
                        setForm({ ...form, reference: e.target.value })
                      }
                      placeholder="Purchase order number, etc."
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#2C2C2C] font-semibold">
                      Items Received
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLine}
                      className="border-gray-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2C2C2C]">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2C2C2C]">
                            Warehouse
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2C2C2C]">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-[#2C2C2C] w-20">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryLines.map((line, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <select
                                value={line.itemId}
                                onChange={(e) =>
                                  updateLine(index, "itemId", e.target.value)
                                }
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#607c47] focus:border-transparent"
                                required
                              >
                                <option value="">Select item</option>
                                {items.map((item: ItemMaster) => (
                                  <option key={item.id} value={item.id}>
                                    {item.itemName}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={line.warehouseId}
                                onChange={(e) =>
                                  updateLine(
                                    index,
                                    "warehouseId",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#607c47] focus:border-transparent"
                                required
                              >
                                <option value="">Select warehouse</option>
                                {warehouses.map(
                                  (warehouse: WarehouseMaster) => (
                                    <option
                                      key={warehouse.id}
                                      value={warehouse.id}
                                    >
                                      {warehouse.name}
                                    </option>
                                  )
                                )}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                className="text-right w-24 bg-white border-gray-200 text-[#2C2C2C]"
                                required
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {inventoryLines.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLine(index)}
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
                    <Button type="button" variant="outline" className="border-gray-200">
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

