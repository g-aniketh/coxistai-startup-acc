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
import { apiClient, ItemMaster, WarehouseMaster } from "@/lib/api";
import { format } from "date-fns";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

type StockLine = {
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: string;
};

export default function StockJournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseMaster[]>([]);
  const [stockLines, setStockLines] = useState<StockLine[]>([
    {
      itemId: "",
      fromWarehouseId: "",
      toWarehouseId: "",
      quantity: "",
    },
  ]);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    narration: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, warehousesRes] = await Promise.all([
        apiClient.items.list(),
        apiClient.warehouses.list(),
      ]);

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

  const updateLine = (index: number, field: keyof StockLine, value: string) => {
    const newLines = [...stockLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setStockLines(newLines);
  };

  const addLine = () => {
    setStockLines([
      ...stockLines,
      {
        itemId: "",
        fromWarehouseId: "",
        toWarehouseId: "",
        quantity: "",
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (stockLines.length <= 1) {
      toast.error("At least one stock line is required");
      return;
    }
    setStockLines(stockLines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (stockLines.length === 0) {
      toast.error("Please add at least one stock movement");
      return;
    }

    for (const line of stockLines) {
      if (
        !line.itemId ||
        !line.fromWarehouseId ||
        !line.toWarehouseId ||
        !line.quantity
      ) {
        toast.error("Please fill all required fields in stock lines");
        return;
      }

      if (line.fromWarehouseId === line.toWarehouseId) {
        toast.error("From and To warehouses must be different");
        return;
      }
    }

    try {
      setSubmitting(true);
      const typesRes = await apiClient.vouchers.listTypes();
      if (!typesRes.success || !typesRes.data) {
        throw new Error("Failed to load voucher types");
      }

      const stockJournalType = typesRes.data.find(
        (t) => t.category === "STOCK_JOURNAL"
      );
      if (!stockJournalType) {
        throw new Error("Stock Journal voucher type not found");
      }

      // Create inventory lines: one for OUT (from) and one for IN (to)
      const inventoryLines: Array<{
        itemId: string;
        warehouseId: string;
        quantity: number;
        rate: number;
        discountAmount: number;
      }> = [];

      for (const line of stockLines) {
        // Out from source warehouse (negative quantity handled by backend)
        inventoryLines.push({
          itemId: line.itemId,
          warehouseId: line.fromWarehouseId,
          quantity: Number(line.quantity),
          rate: 0,
          discountAmount: 0,
        });

        // In to destination warehouse
        inventoryLines.push({
          itemId: line.itemId,
          warehouseId: line.toWarehouseId,
          quantity: Number(line.quantity),
          rate: 0,
          discountAmount: 0,
        });
      }

      const voucherRes = await apiClient.vouchers.create({
        voucherTypeId: stockJournalType.id,
        date: form.date,
        narration: form.narration,
        inventoryLines,
        autoPost: true,
      });

      if (voucherRes.success) {
        toast.success("Stock Journal created successfully");
        router.push("/vouchers");
      } else {
        throw new Error(voucherRes.error || "Failed to create stock journal");
      }
    } catch (error) {
      console.error("Create stock journal error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create stock journal"
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
                Stock Journal
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Record stock movements between warehouses (inventory only, no
                ledger entries)
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#2C2C2C]">
                Stock Movement Details
              </CardTitle>
              <p className="text-sm text-[#2C2C2C]/70 mt-2">
                Transfer stock from one warehouse to another. No accounting
                entries are created.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-[#2C2C2C]">
                      Movement Date *
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
                      Stock Movements
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLine}
                      className="border-gray-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Movement
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2C2C2C]">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2C2C2C]">
                            From Warehouse
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2C2C2C]">
                            To Warehouse
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
                        {stockLines.map((line, index) => (
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
                                value={line.fromWarehouseId}
                                onValueChange={(value) =>
                                  updateLine(index, "fromWarehouseId", value)
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
                              <Select
                                value={line.toWarehouseId}
                                onValueChange={(value) =>
                                  updateLine(index, "toWarehouseId", value)
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
                              {stockLines.length > 1 && (
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
