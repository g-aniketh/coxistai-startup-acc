"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiClient, ItemMaster } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Package, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";

export default function ItemsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMaster | null>(null);
  const [form, setForm] = useState({
    itemName: "",
    alias: "",
    hsnSac: "",
    unit: "",
    defaultSalesRate: "",
    defaultPurchaseRate: "",
    gstRatePercent: "",
    description: "",
    isActive: true,
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await apiClient.items.list();
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        toast.error(res.error || "Failed to load items");
      }
    } catch (error) {
      console.error("Load items error:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const resetForm = () => {
    setForm({
      itemName: "",
      alias: "",
      hsnSac: "",
      unit: "",
      defaultSalesRate: "",
      defaultPurchaseRate: "",
      gstRatePercent: "",
      description: "",
      isActive: true,
    });
    setEditingItem(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (item: ItemMaster) => {
    setEditingItem(item);
    setForm({
      itemName: item.itemName,
      alias: item.alias || "",
      hsnSac: item.hsnSac || "",
      unit: item.unit || "",
      defaultSalesRate: item.defaultSalesRate?.toString() || "",
      defaultPurchaseRate: item.defaultPurchaseRate?.toString() || "",
      gstRatePercent: item.gstRatePercent?.toString() || "",
      description: item.description || "",
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.itemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    try {
      if (editingItem) {
        const res = await apiClient.items.update(editingItem.id, {
          itemName: form.itemName.trim(),
          alias: form.alias.trim() || undefined,
          hsnSac: form.hsnSac.trim() || undefined,
          unit: form.unit.trim() || undefined,
          defaultSalesRate: form.defaultSalesRate
            ? Number(form.defaultSalesRate)
            : undefined,
          defaultPurchaseRate: form.defaultPurchaseRate
            ? Number(form.defaultPurchaseRate)
            : undefined,
          gstRatePercent: form.gstRatePercent
            ? Number(form.gstRatePercent)
            : undefined,
          description: form.description.trim() || undefined,
          isActive: form.isActive,
        });

        if (res.success) {
          toast.success("Item updated successfully");
          setDialogOpen(false);
          await loadItems();
        } else {
          toast.error(res.error || "Failed to update item");
        }
      } else {
        const res = await apiClient.items.create({
          itemName: form.itemName.trim(),
          alias: form.alias.trim() || undefined,
          hsnSac: form.hsnSac.trim() || undefined,
          unit: form.unit.trim() || undefined,
          defaultSalesRate: form.defaultSalesRate
            ? Number(form.defaultSalesRate)
            : undefined,
          defaultPurchaseRate: form.defaultPurchaseRate
            ? Number(form.defaultPurchaseRate)
            : undefined,
          gstRatePercent: form.gstRatePercent
            ? Number(form.gstRatePercent)
            : undefined,
          description: form.description.trim() || undefined,
        });

        if (res.success) {
          toast.success("Item created successfully");
          setDialogOpen(false);
          await loadItems();
        } else {
          toast.error(res.error || "Failed to create item");
        }
      }
    } catch (error) {
      console.error("Submit item error:", error);
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async (item: ItemMaster) => {
    if (!confirm(`Are you sure you want to delete "${item.itemName}"?`)) {
      return;
    }

    try {
      const res = await apiClient.items.delete(item.id);
      if (res.success) {
        toast.success("Item deleted successfully");
        await loadItems();
      } else {
        toast.error(res.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Delete item error:", error);
      toast.error("Failed to delete item");
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="p-4 md:p-8 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#607c47] mx-auto"></div>
              <p className="mt-4 text-[#2C2C2C]/70">Loading items...</p>
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
                Item Master
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Manage inventory items with HSN/SAC codes and GST rates
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[#2C2C2C]">Items</CardTitle>
              <Button
                onClick={openCreateDialog}
                className="bg-[#607c47] hover:bg-[#4a6129] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-[#2C2C2C]/70">
                    No items found. Create your first item to get started.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b border-gray-200">
                        <TableHead className="text-[#2C2C2C] font-semibold">
                          Item Name
                        </TableHead>
                        <TableHead className="text-[#2C2C2C] font-semibold">
                          HSN/SAC
                        </TableHead>
                        <TableHead className="text-[#2C2C2C] font-semibold">
                          Unit
                        </TableHead>
                        <TableHead className="text-right text-[#2C2C2C] font-semibold">
                          Sales Rate
                        </TableHead>
                        <TableHead className="text-right text-[#2C2C2C] font-semibold">
                          Purchase Rate
                        </TableHead>
                        <TableHead className="text-right text-[#2C2C2C] font-semibold">
                          GST %
                        </TableHead>
                        <TableHead className="text-center text-[#2C2C2C] font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-center text-[#2C2C2C] font-semibold">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow
                          key={item.id}
                          className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                        >
                          <TableCell className="font-medium text-[#2C2C2C]">
                            {item.itemName}
                            {item.alias && (
                              <span className="text-xs text-[#2C2C2C]/60 ml-2">
                                ({item.alias})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-[#2C2C2C]">
                            {item.hsnSac || "-"}
                          </TableCell>
                          <TableCell className="text-[#2C2C2C]">
                            {item.unit || "-"}
                          </TableCell>
                          <TableCell className="text-right text-[#2C2C2C]">
                            {item.defaultSalesRate != null &&
                            typeof item.defaultSalesRate === "number"
                              ? `₹${Number(item.defaultSalesRate).toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right text-[#2C2C2C]">
                            {item.defaultPurchaseRate != null &&
                            typeof item.defaultPurchaseRate === "number"
                              ? `₹${Number(item.defaultPurchaseRate).toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right text-[#2C2C2C]">
                            {item.gstRatePercent
                              ? `${item.gstRatePercent}%`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={item.isActive ? "default" : "secondary"}
                              className={
                                item.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-600"
                              }
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(item)}
                                className="text-[#607c47] hover:text-[#4a6129] hover:bg-[#607c47]/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  {editingItem ? "Edit Item" : "Create Item"}
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  {editingItem
                    ? "Update item details below"
                    : "Enter item details to create a new inventory item"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="itemName" className="text-[#2C2C2C]">
                      Item Name *
                    </Label>
                    <Input
                      id="itemName"
                      value={form.itemName}
                      onChange={(e) =>
                        setForm({ ...form, itemName: e.target.value })
                      }
                      placeholder="Enter item name"
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alias" className="text-[#2C2C2C]">
                      Alias
                    </Label>
                    <Input
                      id="alias"
                      value={form.alias}
                      onChange={(e) =>
                        setForm({ ...form, alias: e.target.value })
                      }
                      placeholder="Optional alias"
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hsnSac" className="text-[#2C2C2C]">
                      HSN/SAC Code
                    </Label>
                    <Input
                      id="hsnSac"
                      value={form.hsnSac}
                      onChange={(e) =>
                        setForm({ ...form, hsnSac: e.target.value })
                      }
                      placeholder="e.g., 998314"
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-[#2C2C2C]">
                      Unit
                    </Label>
                    <Input
                      id="unit"
                      value={form.unit}
                      onChange={(e) =>
                        setForm({ ...form, unit: e.target.value })
                      }
                      placeholder="e.g., Nos, Kgs, Ltrs"
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultSalesRate" className="text-[#2C2C2C]">
                      Default Sales Rate
                    </Label>
                    <Input
                      id="defaultSalesRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.defaultSalesRate}
                      onChange={(e) =>
                        setForm({ ...form, defaultSalesRate: e.target.value })
                      }
                      placeholder="0.00"
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="defaultPurchaseRate"
                      className="text-[#2C2C2C]"
                    >
                      Default Purchase Rate
                    </Label>
                    <Input
                      id="defaultPurchaseRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.defaultPurchaseRate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          defaultPurchaseRate: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstRatePercent" className="text-[#2C2C2C]">
                      GST Rate (%)
                    </Label>
                    <Input
                      id="gstRatePercent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={form.gstRatePercent}
                      onChange={(e) =>
                        setForm({ ...form, gstRatePercent: e.target.value })
                      }
                      placeholder="e.g., 18"
                      className="bg-white border-gray-200 text-[#2C2C2C]"
                    />
                  </div>
                  {editingItem && (
                    <div className="space-y-2">
                      <Label htmlFor="isActive" className="text-[#2C2C2C]">
                        Status
                      </Label>
                      <select
                        id="isActive"
                        value={form.isActive ? "true" : "false"}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            isActive: e.target.value === "true",
                          })
                        }
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[#2C2C2C]">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Optional description"
                    rows={3}
                    className="bg-white border-gray-200 text-[#2C2C2C]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                >
                  {editingItem ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

