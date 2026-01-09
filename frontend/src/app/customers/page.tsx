"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  apiClient,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/lib/api";
import { Plus, Edit, Trash2, Loader2, User, Building2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

type CustomerFormData = CreateCustomerInput & {
  id?: string; // For edit mode
};

const INITIAL_FORM_DATA: CustomerFormData = {
  customerName: "",
  customerType: "INDIVIDUAL",
  phone: "",
  email: "",
  billingAddressLine1: "",
  billingAddressLine2: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  gstApplicable: false,
  gstin: "",
  placeOfSupplyState: "",
  creditLimitAmount: undefined,
  creditPeriodDays: undefined,
  openingBalanceAmount: undefined,
  openingBalanceType: "DR",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(INITIAL_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.customers.list({
        isActive: true,
      });
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingCustomer(null);
    setShowAdvanced(false);
  };

  const handleOpenForm = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        customerName: customer.customerName,
        customerType: customer.customerType,
        phone: customer.phone || "",
        email: customer.email || "",
        billingAddressLine1: customer.billingAddressLine1 || "",
        billingAddressLine2: customer.billingAddressLine2 || "",
        city: customer.city || "",
        state: customer.state || "",
        country: customer.country || "",
        pincode: customer.pincode || "",
        gstApplicable: customer.gstApplicable,
        gstin: customer.gstin || "",
        placeOfSupplyState: customer.placeOfSupplyState || "",
        creditLimitAmount: customer.creditLimitAmount
          ? Number(customer.creditLimitAmount)
          : undefined,
        creditPeriodDays: customer.creditPeriodDays || undefined,
        openingBalanceAmount: customer.openingBalanceAmount
          ? Number(customer.openingBalanceAmount)
          : undefined,
        openingBalanceType:
          customer.openingBalanceType === "CREDIT" ? "CR" : "DR",
        id: customer.id,
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!formData.phone?.trim() && !formData.email?.trim()) {
      toast.error("Either phone number or email is required");
      return;
    }

    if (formData.gstApplicable && !formData.gstin?.trim()) {
      toast.error("GSTIN is required when GST is applicable");
      return;
    }

    try {
      setSubmitting(true);

      if (editingCustomer) {
        // Update existing customer
        const updateData: UpdateCustomerInput = {
          customerName: formData.customerName.trim(),
          customerType: formData.customerType,
          phone: formData.phone?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          billingAddressLine1:
            formData.billingAddressLine1?.trim() || undefined,
          billingAddressLine2:
            formData.billingAddressLine2?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          state: formData.state?.trim() || undefined,
          country: formData.country?.trim() || undefined,
          pincode: formData.pincode?.trim() || undefined,
          gstApplicable: formData.gstApplicable,
          gstin: formData.gstin?.trim() || undefined,
          placeOfSupplyState: formData.placeOfSupplyState?.trim() || undefined,
          creditLimitAmount: formData.creditLimitAmount,
          creditPeriodDays: formData.creditPeriodDays,
        };

        const response = await apiClient.customers.update(
          editingCustomer.id,
          updateData
        );

        if (response.success) {
          toast.success("Customer updated successfully");
          handleCloseForm();
          loadCustomers();
        } else {
          toast.error(response.message || "Failed to update customer");
        }
      } else {
        // Create new customer
        const createData: CreateCustomerInput = {
          customerName: formData.customerName.trim(),
          customerType: formData.customerType,
          phone: formData.phone?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          billingAddressLine1:
            formData.billingAddressLine1?.trim() || undefined,
          billingAddressLine2:
            formData.billingAddressLine2?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          state: formData.state?.trim() || undefined,
          country: formData.country?.trim() || undefined,
          pincode: formData.pincode?.trim() || undefined,
          gstApplicable: formData.gstApplicable,
          gstin: formData.gstin?.trim() || undefined,
          placeOfSupplyState: formData.placeOfSupplyState?.trim() || undefined,
          creditLimitAmount: formData.creditLimitAmount,
          creditPeriodDays: formData.creditPeriodDays,
          openingBalanceAmount: formData.openingBalanceAmount,
          openingBalanceType: formData.openingBalanceType,
        };

        const response = await apiClient.customers.create(createData);

        if (response.success) {
          toast.success("Customer created successfully");
          handleCloseForm();
          loadCustomers();
        } else {
          toast.error(response.message || "Failed to create customer");
        }
      }
    } catch (error: any) {
      console.error("Failed to save customer:", error);
      toast.error(error.response?.data?.message || "Failed to save customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (
      !confirm(
        `Are you sure you want to delete "${customer.customerName}"? This will deactivate the customer.`
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.customers.delete(customer.id);
      if (response.success) {
        toast.success("Customer deleted successfully");
        loadCustomers();
      } else {
        toast.error(response.message || "Failed to delete customer");
      }
    } catch (error: any) {
      console.error("Failed to delete customer:", error);
      toast.error(error.response?.data?.message || "Failed to delete customer");
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6 pb-32">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                Customers
              </h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                Manage your customer database
              </p>
            </div>
            <Button
              onClick={() => handleOpenForm()}
              className="bg-[#607c47] hover:bg-[#4a6129] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>

          {/* Customers Table Card */}
          <Card className="rounded-2xl border border-gray-200 shadow-lg bg-white">
            <CardHeader className="px-6 pt-6 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-[#2C2C2C]">
                  All Customers
                </CardTitle>
                <CardDescription className="text-sm text-[#2C2C2C]/60 mt-1">
                  View and manage all your customers
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#607c47]" />
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-12 text-[#2C2C2C]/60">
                  <p className="text-sm">
                    No customers found. Click "Add Customer" to create your
                    first customer.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="px-4 py-3 text-sm font-semibold text-[#2C2C2C]">
                          Name
                        </TableHead>
                        <TableHead className="px-4 py-3 text-sm font-semibold text-[#2C2C2C]">
                          Type
                        </TableHead>
                        <TableHead className="px-4 py-3 text-sm font-semibold text-[#2C2C2C]">
                          Contact
                        </TableHead>
                        <TableHead className="px-4 py-3 text-sm font-semibold text-[#2C2C2C]">
                          GSTIN
                        </TableHead>
                        <TableHead className="px-4 py-3 text-sm font-semibold text-[#2C2C2C]">
                          Credit Limit
                        </TableHead>
                        <TableHead className="px-4 py-3 text-sm font-semibold text-[#2C2C2C]">
                          Status
                        </TableHead>
                        <TableHead className="px-4 py-3 text-sm font-semibold text-[#2C2C2C] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow
                          key={customer.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <TableCell className="px-4 py-3">
                            <div className="font-medium text-[#2C2C2C]">
                              {customer.customerName}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "flex items-center gap-1.5 w-fit px-2.5 py-1",
                                customer.customerType === "BUSINESS"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              )}
                            >
                              {customer.customerType === "BUSINESS" ? (
                                <Building2 className="h-3.5 w-3.5" />
                              ) : (
                                <User className="h-3.5 w-3.5" />
                              )}
                              <span className="text-xs font-medium">
                                {customer.customerType}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="text-sm space-y-0.5">
                              {customer.phone && (
                                <div className="text-[#2C2C2C] font-medium">
                                  {customer.phone}
                                </div>
                              )}
                              {customer.email && (
                                <div className="text-[#2C2C2C]/60 text-xs">
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {customer.gstin ? (
                              <span className="text-sm font-mono text-[#2C2C2C] font-medium">
                                {customer.gstin}
                              </span>
                            ) : (
                              <span className="text-sm text-[#2C2C2C]/40">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {customer.creditLimitAmount ? (
                              <span className="text-sm font-semibold text-[#2C2C2C]">
                                ₹
                                {Number(
                                  customer.creditLimitAmount
                                ).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-sm text-[#2C2C2C]/40">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge
                              className={
                                customer.isActive
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }
                              variant="outline"
                            >
                              {customer.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenForm(customer)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4 text-[#2C2C2C]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(customer)}
                                className="h-8 w-8 p-0 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
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

          {/* Add/Edit Customer Dialog */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dialog-scrollbar">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "Edit Customer" : "Add Customer"}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer
                    ? "Update customer information"
                    : "Create a new customer. A ledger will be automatically created."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Required Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">
                        Customer Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerName: e.target.value,
                          })
                        }
                        required
                        placeholder="Enter customer name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerType">
                        Customer Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.customerType}
                        onValueChange={(value: "BUSINESS" | "INDIVIDUAL") =>
                          setFormData({ ...formData, customerType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                          <SelectItem value="BUSINESS">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number{" "}
                        <span className="text-muted-foreground text-xs">
                          (at least one required)
                        </span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email{" "}
                        <span className="text-muted-foreground text-xs">
                          (at least one required)
                        </span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Billing Address</h3>

                  <div className="space-y-2">
                    <Label htmlFor="billingAddressLine1">Address Line 1</Label>
                    <Input
                      id="billingAddressLine1"
                      value={formData.billingAddressLine1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddressLine1: e.target.value,
                        })
                      }
                      placeholder="Enter address line 1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingAddressLine2">Address Line 2</Label>
                    <Input
                      id="billingAddressLine2"
                      value={formData.billingAddressLine2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAddressLine2: e.target.value,
                        })
                      }
                      placeholder="Enter address line 2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="Enter city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        placeholder="Enter state"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData({ ...formData, pincode: e.target.value })
                        }
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      placeholder="Enter country"
                    />
                  </div>
                </div>

                {/* Tax Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tax Information</h3>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gstApplicable"
                      checked={formData.gstApplicable}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          gstApplicable: checked === true,
                        })
                      }
                    />
                    <Label htmlFor="gstApplicable" className="cursor-pointer">
                      GST Applicable
                    </Label>
                  </div>

                  {formData.gstApplicable && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gstin">
                          GSTIN <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="gstin"
                          value={formData.gstin}
                          onChange={(e) =>
                            setFormData({ ...formData, gstin: e.target.value })
                          }
                          placeholder="Enter GSTIN"
                          required={formData.gstApplicable}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="placeOfSupplyState">
                          Place of Supply State
                        </Label>
                        <Input
                          id="placeOfSupplyState"
                          value={formData.placeOfSupplyState}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              placeOfSupplyState: e.target.value,
                            })
                          }
                          placeholder="Enter state code"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Credit Control */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Credit Control</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="creditLimitAmount">
                        Credit Limit Amount
                      </Label>
                      <Input
                        id="creditLimitAmount"
                        type="number"
                        step="0.01"
                        value={formData.creditLimitAmount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            creditLimitAmount: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="Enter credit limit"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creditPeriodDays">
                        Credit Period (Days)
                      </Label>
                      <Input
                        id="creditPeriodDays"
                        type="number"
                        value={formData.creditPeriodDays || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            creditPeriodDays: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="Enter credit period in days"
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Settings (Hidden by default) */}
                {!editingCustomer && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Accounting Settings
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        {showAdvanced ? "Hide" : "Show"} Advanced
                      </Button>
                    </div>

                    {showAdvanced && (
                      <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-2">
                          <Label htmlFor="openingBalanceAmount">
                            Opening Balance Amount
                          </Label>
                          <Input
                            id="openingBalanceAmount"
                            type="number"
                            step="0.01"
                            value={formData.openingBalanceAmount || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                openingBalanceAmount: e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              })
                            }
                            placeholder="Enter opening balance"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="openingBalanceType">
                            Opening Balance Type
                          </Label>
                          <Select
                            value={formData.openingBalanceType}
                            onValueChange={(value: "DR" | "CR") =>
                              setFormData({
                                ...formData,
                                openingBalanceType: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DR">Debit (DR)</SelectItem>
                              <SelectItem value="CR">Credit (CR)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseForm}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {editingCustomer ? "Updating..." : "Creating..."}
                      </>
                    ) : editingCustomer ? (
                      "Update Customer"
                    ) : (
                      "Create Customer"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
