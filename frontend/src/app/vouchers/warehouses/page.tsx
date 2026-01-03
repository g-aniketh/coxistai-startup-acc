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
import { apiClient, WarehouseMaster } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  Warehouse,
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

export default function WarehousesPage() {
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<WarehouseMaster[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseMaster | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    alias: "",
    address: "",
    isActive: true,
  });

  const filteredWarehouses = useMemo(() => {
    if (!searchQuery.trim()) return warehouses;
    const query = searchQuery.toLowerCase();
    return warehouses.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(query) ||
        warehouse.alias?.toLowerCase().includes(query) ||
        warehouse.address?.toLowerCase().includes(query)
    );
  }, [warehouses, searchQuery]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.warehouses.list();
      if (res.success && res.data) {
        setWarehouses(res.data);
      } else {
        toast.error(res.error || "Failed to load warehouses");
      }
    } catch (error) {
      console.error("Load warehouses error:", error);
      toast.error("Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      alias: "",
      address: "",
      isActive: true,
    });
    setEditingWarehouse(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (warehouse: WarehouseMaster) => {
    setEditingWarehouse(warehouse);
    setForm({
      name: warehouse.name,
      alias: warehouse.alias || "",
      address: warehouse.address || "",
      isActive: warehouse.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Warehouse name is required");
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);
      if (editingWarehouse) {
        const res = await apiClient.warehouses.update(editingWarehouse.id, {
          name: form.name.trim(),
          alias: form.alias.trim() || undefined,
          address: form.address.trim() || undefined,
          isActive: form.isActive,
        });

        if (res.success) {
          toast.success("Warehouse updated successfully");
          setDialogOpen(false);
          await loadWarehouses();
        } else {
          toast.error(res.error || "Failed to update warehouse");
        }
      } else {
        const res = await apiClient.warehouses.create({
          name: form.name.trim(),
          alias: form.alias.trim() || undefined,
          address: form.address.trim() || undefined,
        });

        if (res.success) {
          toast.success("Warehouse created successfully");
          setDialogOpen(false);
          await loadWarehouses();
        } else {
          toast.error(res.error || "Failed to create warehouse");
        }
      }
    } catch (error) {
      console.error("Submit warehouse error:", error);
      toast.error("Failed to save warehouse");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (warehouse: WarehouseMaster) => {
    if (!confirm(`Are you sure you want to delete "${warehouse.name}"?`)) {
      return;
    }

    if (deleting === warehouse.id) return;

    try {
      setDeleting(warehouse.id);
      const res = await apiClient.warehouses.delete(warehouse.id);
      if (res.success) {
        toast.success("Warehouse deleted successfully");
        await loadWarehouses();
      } else {
        toast.error(res.error || "Failed to delete warehouse");
      }
    } catch (error) {
      console.error("Delete warehouse error:", error);
      toast.error("Failed to delete warehouse");
    } finally {
      setDeleting(null);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 flex-1 bg-gray-200" />
          <Skeleton className="h-12 w-32 bg-gray-200" />
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
                Warehouse Master
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Manage warehouses and storage locations for inventory
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg text-[#2C2C2C] mb-2">
                  Warehouses
                </CardTitle>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#2C2C2C]/50" />
                  <Input
                    placeholder="Search warehouses..."
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
                Add Warehouse
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSkeleton />
              ) : warehouses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
                  <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-[#2C2C2C]/70 mb-4">
                    No warehouses found. Create your first warehouse to get
                    started.
                  </p>
                  <Button
                    onClick={openCreateDialog}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Warehouse
                  </Button>
                </div>
              ) : filteredWarehouses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-[#2C2C2C]/70">
                    No warehouses match your search query.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b border-gray-200">
                          <TableHead className="text-[#2C2C2C] font-semibold">
                            Name
                          </TableHead>
                          <TableHead className="text-[#2C2C2C] font-semibold">
                            Alias
                          </TableHead>
                          <TableHead className="text-[#2C2C2C] font-semibold">
                            Address
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
                        {filteredWarehouses.map((warehouse) => (
                          <TableRow
                            key={warehouse.id}
                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                          >
                            <TableCell className="font-medium text-[#2C2C2C]">
                              {warehouse.name}
                            </TableCell>
                            <TableCell className="text-[#2C2C2C]">
                              {warehouse.alias || "-"}
                            </TableCell>
                            <TableCell className="text-[#2C2C2C]">
                              {warehouse.address || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  warehouse.isActive ? "default" : "secondary"
                                }
                                className={
                                  warehouse.isActive
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-gray-100 text-gray-600"
                                }
                              >
                                {warehouse.isActive ? "Active" : "Inactive"}
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
                                    onClick={() => openEditDialog(warehouse)}
                                    className="text-[#2C2C2C] cursor-pointer"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(warehouse)}
                                    disabled={deleting === warehouse.id}
                                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deleting === warehouse.id ? (
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
                      Showing {filteredWarehouses.length} of {warehouses.length}{" "}
                      warehouses
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
                  {editingWarehouse ? "Edit Warehouse" : "Create Warehouse"}
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  {editingWarehouse
                    ? "Update warehouse details below"
                    : "Enter warehouse details to create a new storage location"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#2C2C2C]">
                      Warehouse Name *
                    </Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Enter warehouse name"
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
                  {editingWarehouse && (
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
                  <Label htmlFor="address" className="text-[#2C2C2C]">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Warehouse address"
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
                      {editingWarehouse ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingWarehouse ? "Update" : "Create"
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
