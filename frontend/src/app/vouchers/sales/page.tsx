"use client";

import { useEffect, useState, useMemo } from "react";
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
  Ledger,
  ItemMaster,
  WarehouseMaster,
  Customer,
} from "@/lib/api";
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLedgers, setCustomerLedgers] = useState<Ledger[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseMaster[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
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
      const [customersRes, ledgersRes, itemsRes, warehousesRes] =
        await Promise.all([
          apiClient.customers.list({ isActive: true }),
        apiClient.bookkeeping.listLedgers(),
        apiClient.items.list(),
        apiClient.warehouses.list(),
      ]);

      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data);
        // Also populate customer ledgers for backward compatibility
        const customerLedgerList = customersRes.data
          .filter((c) => c.ledger)
          .map((c) => c.ledger!);
        setCustomerLedgers(customerLedgerList);
      }

      if (ledgersRes.success && ledgersRes.data) {
        // Also include any customer ledgers that might not have customers
        const existingCustomerLedgers = ledgersRes.data.filter(
          (l) => l.ledgerSubtype === "CUSTOMER"
        );
        setCustomerLedgers((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          return [
            ...prev,
            ...existingCustomerLedgers.filter((l) => !existingIds.has(l.id)),
          ];
        });
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

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      // Auto-fill customer details
      setForm({
        ...form,
        customerLedgerId: customer.ledgerId || "",
        billingName: customer.customerName,
        billingAddress: [
          customer.billingAddressLine1,
          customer.billingAddressLine2,
          customer.city,
          customer.state,
          customer.country,
          customer.pincode,
        ]
          .filter(Boolean)
          .join(", "),
        customerGstin: customer.gstin || "",
        placeOfSupplyState: customer.placeOfSupplyState || "",
      });
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
        <div className="p-4 md:p-8 space-y-6 pb-32">
          <div className="flex items-center gap-4">
            <Link href="/vouchers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                Sales Voucher (Invoice)
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Record sales of goods/services with inventory and GST
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#2C2C2C]">
                Sales Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-[#2C2C2C]">
                      Invoice Date *
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
                      htmlFor="customer"
                      className="text-[#2C2C2C]"
                    >
                      Customer *
                    </Label>
                    <Select
                      value={selectedCustomerId}
                      onValueChange={handleCustomerChange}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.length > 0 ? (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.customerName}
                              {customer.ledger && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({customer.ledger.name})
                                </span>
                              )}
                            </SelectItem>
                          ))
                        ) : customerLedgers.length > 0 ? (
                          // Fallback to ledgers if no customers
                          customerLedgers.map((ledger) => (
                          <SelectItem key={ledger.id} value={ledger.id}>
                            {ledger.name}
                            </SelectItem>
                          ))
                        ) : (
                          // Use a non-empty sentinel value for disabled item to satisfy Radix Select
                          <SelectItem value="__no_customers__" disabled>
                            No customers available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {customers.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        <Link
                          href="/customers"
                          className="text-[#607c47] hover:underline"
                        >
                          Add a customer
                        </Link>{" "}
                        to use this feature
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingName" className="text-[#2C2C2C]">
                      Billing Name
                    </Label>
                    <Input
                      id="billingName"
                      value={form.billingName}
                      onChange={(e) =>
                        setForm({ ...form, billingName: e.target.value })
                      }
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerGstin" className="text-[#2C2C2C]">
                      Customer GSTIN
                    </Label>
                    <Input
                      id="customerGstin"
                      value={form.customerGstin}
                      onChange={(e) =>
                        setForm({ ...form, customerGstin: e.target.value })
                      }
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="placeOfSupplyState"
                      className="text-[#2C2C2C]"
                    >
                      Place of Supply (State Code)
                    </Label>
                    <Input
                      id="placeOfSupplyState"
                      value={form.placeOfSupplyState}
                      onChange={(e) =>
                        setForm({ ...form, placeOfSupplyState: e.target.value })
                      }
                      placeholder="e.g., 09 for UP"
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
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
                      placeholder="PO number, etc."
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingAddress" className="text-[#2C2C2C]">
                    Billing Address
                  </Label>
                  <Textarea
                    id="billingAddress"
                    value={form.billingAddress}
                    onChange={(e) =>
                      setForm({ ...form, billingAddress: e.target.value })
                    }
                    rows={2}
                    className="bg-white border-gray-200 text-[#2C2C2C]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#2C2C2C] font-semibold">
                      Item Lines
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
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2C2C2C]">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2C2C2C]">
                            Warehouse
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2C2C2C]">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2C2C2C]">
                            Rate
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2C2C2C]">
                            Discount
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2C2C2C]">
                            GST %
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2C2C2C]">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-[#2C2C2C] w-20">
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
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={line.rate}
                                  onChange={(e) =>
                                    updateLine(index, "rate", e.target.value)
                                  }
                                  className="text-right w-24 bg-white border-gray-200 text-[#2C2C2C]"
                                  required
                                />
                              </td>
                              <td className="px-4 py-3">
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
                                  className="text-right w-24 bg-white border-gray-200 text-[#2C2C2C]"
                                />
                              </td>
                              <td className="px-4 py-3">
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
                                  className="text-right w-20 bg-white border-gray-200 text-[#2C2C2C]"
                                />
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-[#2C2C2C]">
                                ₹{amount.toFixed(2)}
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-[#2C2C2C]">
                        <span>Items Subtotal:</span>
                        <span className="font-medium">
                          ₹{totals.itemsSubtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#2C2C2C]">
                        <span>Total Tax:</span>
                        <span className="font-medium">
                          ₹{totals.totalTax.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-[#2C2C2C]">
                        <span>Grand Total:</span>
                        <span>₹{totals.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
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
