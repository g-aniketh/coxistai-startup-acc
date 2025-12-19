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

export default function DeliveryNotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerLedgers, setCustomerLedgers] = useState<Ledger[]>([]);
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
    customerLedgerId: "",
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
        const customers = ledgersRes.data.filter(
          (l) => l.ledgerSubtype === "CUSTOMER"
        );
        setCustomerLedgers(customers);
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

      const deliveryNoteType = typesRes.data.find(
        (t) => t.category === "DELIVERY_NOTE"
      );
      if (!deliveryNoteType) {
        throw new Error("Delivery Note voucher type not found");
      }

      const voucherRes = await apiClient.vouchers.create({
        voucherTypeId: deliveryNoteType.id,
        date: form.date,
        reference: form.reference,
        narration: form.narration,
        partyLedgerId: form.customerLedgerId || undefined,
        inventoryLines: inventoryLines.map((line) => ({
          itemId: line.itemId,
          warehouseId: line.warehouseId,
          quantity: Number(line.quantity),
          rate: 0, // Delivery note doesn't need rate
          discountAmount: 0,
        })),
        autoPost: true,
      });

      if (voucherRes.success) {
        toast.success("Delivery Note created successfully");
        router.push("/vouchers");
      } else {
        throw new Error(voucherRes.error || "Failed to create delivery note");
      }
    } catch (error) {
      console.error("Create delivery note error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create delivery note"
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
                Delivery Note
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Record physical dispatch of goods (inventory only, no ledger
                entries)
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#2C2C2C]">
                Delivery Note Details
              </CardTitle>
              <p className="text-sm text-[#2C2C2C]/70 mt-2">
                This voucher only affects inventory stock. No accounting entries
                are created.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-[#2C2C2C]">
                      Delivery Date *
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
                    <Label
                      htmlFor="customerLedgerId"
                      className="text-[#2C2C2C]"
                    >
                      Customer (Reference)
                    </Label>
                    <Select
                      value={form.customerLedgerId}
                      onValueChange={(value) =>
                        setForm({ ...form, customerLedgerId: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select customer (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerLedgers.map((ledger) => (
                          <SelectItem key={ledger.id} value={ledger.id}>
                            {ledger.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      placeholder="Sales order number, etc."
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#2C2C2C] font-semibold">
                      Items to Deliver
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
                              <Select
                                value={line.itemId}
                                onValueChange={(value) =>
                                  updateLine(index, "itemId", value)
                                }
                                required
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {items.map((item: ItemMaster) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.itemName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3">
                              <Select
                                value={line.warehouseId}
                                onValueChange={(value) =>
                                  updateLine(index, "warehouseId", value)
                                }
                                required
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                  {warehouses.map(
                                    (warehouse: WarehouseMaster) => (
                                      <SelectItem
                                        key={warehouse.id}
                                        value={warehouse.id}
                                      >
                                        {warehouse.name}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(index, "quantity", e.target.value)
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
