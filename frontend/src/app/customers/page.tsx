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
import { Plus, Search, Edit, Trash2, Loader2, User, Building2 } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
    null
  );
  const [formData, setFormData] = useState<CustomerFormData>(INITIAL_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.customers.list({
        isActive: true,
        searchTerm: searchTerm || undefined,
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
  }, [searchTerm]);

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
          billingAddressLine1: formData.billingAddressLine1?.trim() || undefined,
          billingAddressLine2: formData.billingAddressLine2?.trim() || undefined,
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
          billingAddressLine1: formData.billingAddressLine1?.trim() || undefined,
          billingAddressLine2: formData.billingAddressLine2?.trim() || undefined,
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
      toast.error(
        error.response?.data?.message || "Failed to save customer"
      );
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
      toast.error(
        error.response?.data?.message || "Failed to delete customer"
      );
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-6 pb-32">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Customers</h1>
              <p className="text-muted-foreground mt-1">
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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Customers</CardTitle>
                  <CardDescription>
                    View and manage all your customers
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No customers found. Click "Add Customer" to create your first
                  customer.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Credit Limit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.customerName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "flex items-center gap-1 w-fit",
                              customer.customerType === "BUSINESS"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            )}
                          >
                            {customer.customerType === "BUSINESS" ? (
                              <Building2 className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {customer.customerType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {customer.phone && (
                              <div>{customer.phone}</div>
                            )}
                            {customer.email && (
                              <div className="text-muted-foreground">
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.gstin ? (
                            <Badge variant="outline">{customer.gstin}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.creditLimitAmount
                            ? `₹${Number(customer.creditLimitAmount).toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={customer.isActive ? "default" : "secondary"}
                          >
                            {customer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenForm(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                          setFormData({ ...formData, customerName: e.target.value })
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
                    <Label htmlFor="billingAddressLine1">
                      Address Line 1
                    </Label>
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
                    <Label htmlFor="billingAddressLine2">
                      Address Line 2
                    </Label>
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

