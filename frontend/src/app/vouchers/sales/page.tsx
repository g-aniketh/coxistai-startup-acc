"use client";

import { useEffect, useState, useMemo } from "react";
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
  rate: string;
  discountAmount: string;
  gstRatePercent: string;
};

export default function SalesVoucherPage() {
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
      rate: "",
      discountAmount: "0",
      gstRatePercent: "",
    },
  ]);
  const [form, setForm] = useState({
    customerLedgerId: "",
    billingName: "",
    billingAddress: "",
    customerGstin: "",
    placeOfSupplyState: "",
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
        setWarehouses(
          warehousesRes.data.filter((w) => w.isActive)
        );
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

    // Auto-fill rate and GST from item
    if (field === "itemId") {
      const item = items.find((i: ItemMaster) => i.id === value);
      if (item) {
        newLines[index].rate = String(item.defaultSalesRate || "");
        newLines[index].gstRatePercent = String(item.gstRatePercent || "");
      }
    }

    setInventoryLines(newLines);
  };

  const addLine = () => {
    setInventoryLines([
      ...inventoryLines,
      {
        itemId: "",
        warehouseId: "",
        quantity: "",
        rate: "",
        discountAmount: "0",
        gstRatePercent: "",
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

  const totals = useMemo(() => {
    let itemsSubtotal = 0;
    let totalTax = 0;

    for (const line of inventoryLines) {
      const quantity = Number(line.quantity) || 0;
      const rate = Number(line.rate) || 0;
      const discount = Number(line.discountAmount) || 0;
      const lineAmount = quantity * rate - discount;
      itemsSubtotal += lineAmount;

      const gstRate = Number(line.gstRatePercent) || 0;
      if (gstRate > 0) {
        // Simplified GST calculation - in real app, would use place of supply
        const tax = (lineAmount * gstRate) / 100;
        totalTax += tax;
      }
    }

    const grandTotal = itemsSubtotal + totalTax;

    return {
      itemsSubtotal: Math.round(itemsSubtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }, [inventoryLines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.customerLedgerId) {
      toast.error("Please select a customer");
      return;
    }

    if (inventoryLines.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    // Validate all lines
    for (const line of inventoryLines) {
      if (!line.itemId || !line.warehouseId || !line.quantity || !line.rate) {
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

      const salesType = typesRes.data.find((t) => t.category === "SALES");
      if (!salesType) {
        throw new Error("Sales voucher type not found");
      }

      const voucherRes = await apiClient.vouchers.create({
        voucherTypeId: salesType.id,
        date: form.date,
        reference: form.reference,
        narration: form.narration,
        partyLedgerId: form.customerLedgerId,
        placeOfSupplyState: form.placeOfSupplyState || undefined,
        billingName: form.billingName || undefined,
        billingAddress: form.billingAddress || undefined,
        customerGstin: form.customerGstin || undefined,
        inventoryLines: inventoryLines.map((line) => ({
          itemId: line.itemId,
          warehouseId: line.warehouseId,
          quantity: Number(line.quantity),
          rate: Number(line.rate),
          discountAmount: Number(line.discountAmount) || 0,
          gstRatePercent: Number(line.gstRatePercent) || undefined,
        })),
        autoPost: true,
      });

      if (voucherRes.success) {
        toast.success("Sales voucher created and posted successfully");
        router.push("/vouchers");
      } else {
        throw new Error(voucherRes.error || "Failed to create voucher");
      }
    } catch (error) {
      console.error("Create sales voucher error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create sales voucher"
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
              <h1 className="text-2xl font-bold">Sales Voucher (Invoice)</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Invoice Date *</Label>
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
                    <Label htmlFor="customerLedgerId">Customer *</Label>
                    <select
                      id="customerLedgerId"
                      value={form.customerLedgerId}
                      onChange={(e) =>
                        setForm({ ...form, customerLedgerId: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select customer</option>
                      {customerLedgers.map((ledger) => (
                        <option key={ledger.id} value={ledger.id}>
                          {ledger.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingName">Billing Name</Label>
                    <Input
                      id="billingName"
                      value={form.billingName}
                      onChange={(e) =>
                        setForm({ ...form, billingName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerGstin">Customer GSTIN</Label>
                    <Input
                      id="customerGstin"
                      value={form.customerGstin}
                      onChange={(e) =>
                        setForm({ ...form, customerGstin: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="placeOfSupplyState">
                      Place of Supply (State Code)
                    </Label>
                    <Input
                      id="placeOfSupplyState"
                      value={form.placeOfSupplyState}
                      onChange={(e) =>
                        setForm({ ...form, placeOfSupplyState: e.target.value })
                      }
                      placeholder="e.g., 09 for UP"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      value={form.reference}
                      onChange={(e) =>
                        setForm({ ...form, reference: e.target.value })
                      }
                      placeholder="PO number, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Textarea
                    id="billingAddress"
                    value={form.billingAddress}
                    onChange={(e) =>
                      setForm({ ...form, billingAddress: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Item Lines</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLine}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Item
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium">
                            Warehouse
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            Qty
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            Rate
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            Discount
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            GST %
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-medium">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-center text-sm font-medium w-20">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryLines.map((line, index) => {
                          const quantity = Number(line.quantity) || 0;
                          const rate = Number(line.rate) || 0;
                          const discount = Number(line.discountAmount) || 0;
                          const amount = quantity * rate - discount;

                          return (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2">
                                <select
                                  value={line.itemId}
                                  onChange={(e) =>
                                    updateLine(index, "itemId", e.target.value)
                                  }
                                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
                              <td className="px-4 py-2">
                                <select
                                  value={line.warehouseId}
                                  onChange={(e) =>
                                    updateLine(
                                      index,
                                      "warehouseId",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
                              <td className="px-4 py-2">
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
                                  className="text-right w-24"
                                  required
                                />
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={line.rate}
                                  onChange={(e) =>
                                    updateLine(index, "rate", e.target.value)
                                  }
                                  className="text-right w-24"
                                  required
                                />
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={line.discountAmount}
                                  onChange={(e) =>
                                    updateLine(
                                      index,
                                      "discountAmount",
                                      e.target.value
                                    )
                                  }
                                  className="text-right w-24"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={line.gstRatePercent}
                                  onChange={(e) =>
                                    updateLine(
                                      index,
                                      "gstRatePercent",
                                      e.target.value
                                    )
                                  }
                                  className="text-right w-20"
                                />
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                ₹{amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {inventoryLines.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLine(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-medium">
                          ₹{totals.itemsSubtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Tax:</span>
                        <span className="font-medium">
                          ₹{totals.totalTax.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 text-lg font-bold">
                        <span>Grand Total:</span>
                        <span>₹{totals.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
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
