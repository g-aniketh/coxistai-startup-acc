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
import { apiClient, ItemMaster } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Search,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function ItemsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMaster | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
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

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.itemName.toLowerCase().includes(query) ||
        item.alias?.toLowerCase().includes(query) ||
        item.hsnSac?.toLowerCase().includes(query) ||
        item.unit?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

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

    if (submitting) return;

    try {
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ItemMaster) => {
    if (!confirm(`Are you sure you want to delete "${item.itemName}"?`)) {
      return;
    }

    if (deleting === item.id) return;

    try {
      setDeleting(item.id);
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
    } finally {
      setDeleting(null);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 flex-1 bg-gray-200" />
          <Skeleton className="h-12 w-24 bg-gray-200" />
          <Skeleton className="h-12 w-24 bg-gray-200" />
          <Skeleton className="h-12 w-24 bg-gray-200" />
          <Skeleton className="h-12 w-24 bg-gray-200" />
          <Skeleton className="h-12 w-20 bg-gray-200" />
        </div>
      ))}
    </div>
  );

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
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg text-[#2C2C2C] mb-2">
                  Items
                </CardTitle>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#2C2C2C]/50" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-200 text-[#2C2C2C]"
                  />
                </div>
              </div>
              <Button
                onClick={openCreateDialog}
                className="bg-[#607c47] hover:bg-[#4a6129] text-white w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSkeleton />
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-[#2C2C2C]/70 mb-4">
                    No items found. Create your first item to get started.
                  </p>
                  <Button
                    onClick={openCreateDialog}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Item
                  </Button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-[#2C2C2C]/70">
                    No items match your search query.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
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
                        {filteredItems.map((item) => (
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
                                variant={
                                  item.isActive ? "default" : "secondary"
                                }
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-white"
                                >
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(item)}
                                    className="text-[#2C2C2C] cursor-pointer"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(item)}
                                    disabled={deleting === item.id}
                                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deleting === item.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {searchQuery && (
                    <div className="mt-4 text-sm text-[#2C2C2C]/70 text-center">
                      Showing {filteredItems.length} of {items.length} items
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl">
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
                    <Label
                      htmlFor="defaultSalesRate"
                      className="text-[#2C2C2C]"
                    >
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
                      <Select
                        value={form.isActive ? "true" : "false"}
                        onValueChange={(value) =>
                          setForm({
                            ...form,
                            isActive: value === "true",
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
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
                  disabled={submitting}
                  className="bg-[#607c47] hover:bg-[#4a6129] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingItem ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingItem ? "Update" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
