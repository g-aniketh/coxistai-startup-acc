"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2, Layers, Trash2, BookOpen, FolderTree } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  apiClient,
  InterestComputationCode,
  Ledger,
  LedgerBalanceTypeCode,
  LedgerCategoryCode,
  LedgerGroup,
} from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";

type LedgerGroupTree = LedgerGroup & { children: LedgerGroupTree[] };
type FeedbackState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

type BookkeepingTabId = "chart" | "ledgers";

const bookkeepingTabs: Array<{
  id: BookkeepingTabId;
  label: string;
  description: string;
  icon: typeof Layers;
}> = [
  {
    id: "chart",
    label: "Chart of Accounts",
    description: "Manage ledger groups and hierarchy",
    icon: FolderTree,
  },
  {
    id: "ledgers",
    label: "Ledger Master",
    description: "Create and manage individual ledgers",
    icon: BookOpen,
  },
];

const ledgerCategoryOptions: { value: LedgerCategoryCode; label: string }[] = [
  { value: "CAPITAL", label: "Capital Accounts" },
  { value: "LOAN", label: "Loans (Secured/Unsecured)" },
  { value: "CURRENT_ASSET", label: "Current Assets" },
  { value: "CURRENT_LIABILITY", label: "Current Liabilities" },
  { value: "SUNDRY_DEBTOR", label: "Sundry Debtors" },
  { value: "SUNDRY_CREDITOR", label: "Sundry Creditors" },
  { value: "BANK_ACCOUNT", label: "Bank Accounts" },
  { value: "CASH", label: "Cash-in-hand" },
  { value: "INVESTMENT", label: "Investments" },
  { value: "STOCK", label: "Stock-in-hand" },
  { value: "PURCHASE", label: "Purchase Accounts" },
  { value: "SALES", label: "Sales Accounts" },
  { value: "DIRECT_EXPENSE", label: "Direct Expenses" },
  { value: "DIRECT_INCOME", label: "Direct Incomes" },
  { value: "INDIRECT_EXPENSE", label: "Indirect Expenses" },
  { value: "INDIRECT_INCOME", label: "Indirect Incomes" },
  { value: "OTHER", label: "Other / P&L" },
];

const interestOptions: { value: InterestComputationCode; label: string }[] = [
  { value: "NONE", label: "No Interest" },
  { value: "SIMPLE", label: "Simple Interest" },
  { value: "COMPOUND", label: "Compound Interest" },
];

const openingSideOptions: { value: LedgerBalanceTypeCode; label: string }[] = [
  { value: "DEBIT", label: "Debit (Dr)" },
  { value: "CREDIT", label: "Credit (Cr)" },
];

const BookkeepingPage = () => {
  const [activeTab, setActiveTab] = useState<BookkeepingTabId>("chart");
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [ledgersLoading, setLedgersLoading] = useState(true);
  const [groupSaving, setGroupSaving] = useState(false);
  const [ledgerSaving, setLedgerSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const [groupForm, setGroupForm] = useState({
    name: "",
    code: "",
    description: "",
    category: "CURRENT_ASSET" as LedgerCategoryCode,
    parentId: "",
  });

  const [ledgerForm, setLedgerForm] = useState({
    name: "",
    alias: "",
    description: "",
    groupId: "",
    inventoryAffectsStock: false,
    maintainBillByBill: false,
    defaultCreditPeriodDays: "",
    creditLimit: "",
    interestComputation: "NONE" as InterestComputationCode,
    interestRate: "",
    penalRate: "",
    interestGraceDays: "",
    panNumber: "",
    gstNumber: "",
    taxNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    email: "",
    phone: "",
    bankName: "",
    branch: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    openingBalance: "",
    openingBalanceType: "DEBIT" as LedgerBalanceTypeCode,
    costCenterApplicable: false,
  });

  const loadLedgerGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const response = await apiClient.bookkeeping.listLedgerGroups();
      if (response.success) {
        setLedgerGroups(response.data ?? []);
      } else {
        throw new Error(response.message || "Unable to load ledger groups");
      }
    } catch (error) {
      console.error("Failed to load ledger groups:", error);
      setFeedback({
        type: "error",
        message: "Unable to load ledger groups. Please try again.",
      });
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const loadLedgers = useCallback(async () => {
    setLedgersLoading(true);
    try {
      const response = await apiClient.bookkeeping.listLedgers();
      if (response.success) {
        setLedgers(response.data ?? []);
      } else {
        throw new Error(response.message || "Unable to load ledgers");
      }
    } catch (error) {
      console.error("Failed to load ledgers:", error);
      setFeedback({
        type: "error",
        message: "Unable to load ledgers. Please try again.",
      });
    } finally {
      setLedgersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLedgerGroups();
    loadLedgers();
  }, [loadLedgerGroups, loadLedgers]);

  const groupTree = useMemo<LedgerGroupTree[]>(() => {
    const map = new Map<string, LedgerGroupTree>();
    ledgerGroups.forEach(group => {
      map.set(group.id, { ...group, children: [] });
    });

    const roots: LedgerGroupTree[] = [];
    map.forEach(node => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [ledgerGroups]);

  const flattenedGroups = useMemo(() => {
    const options: { id: string; label: string }[] = [];

    const traverse = (nodes: LedgerGroupTree[], depth = 0) => {
      nodes
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(node => {
          options.push({
            id: node.id,
            label: `${"— ".repeat(depth)}${node.name}`,
          });
          if (node.children?.length) {
            traverse(node.children, depth + 1);
          }
        });
    };

    traverse(groupTree);
    return options;
  }, [groupTree]);

  useEffect(() => {
    if (!ledgerForm.groupId && flattenedGroups.length > 0) {
      setLedgerForm(prev => ({ ...prev, groupId: flattenedGroups[0].id }));
    }
  }, [flattenedGroups, ledgerForm.groupId]);

  const resetGroupForm = () => {
    setGroupForm({
      name: "",
      code: "",
      description: "",
      category: "CURRENT_ASSET",
      parentId: "",
    });
  };

  const resetLedgerForm = () => {
    setLedgerForm({
      name: "",
      alias: "",
      description: "",
      groupId: flattenedGroups[0]?.id ?? "",
      inventoryAffectsStock: false,
      maintainBillByBill: false,
      defaultCreditPeriodDays: "",
      creditLimit: "",
      interestComputation: "NONE",
      interestRate: "",
      penalRate: "",
      interestGraceDays: "",
      panNumber: "",
      gstNumber: "",
      taxNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
      bankName: "",
      branch: "",
      accountName: "",
      accountNumber: "",
      ifsc: "",
      openingBalance: "",
      openingBalanceType: "DEBIT",
      costCenterApplicable: false,
    });
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      setFeedback({ type: "error", message: "Group name is required." });
      return;
    }

    setGroupSaving(true);
    try {
      await apiClient.bookkeeping.createLedgerGroup({
        name: groupForm.name.trim(),
        category: groupForm.category,
        code: groupForm.code || undefined,
        description: groupForm.description || undefined,
        parentId: groupForm.parentId || undefined,
      });
      setFeedback({
        type: "success",
        message: "Ledger group created successfully.",
      });
      resetGroupForm();
      await loadLedgerGroups();
    } catch (error) {
      console.error("Create ledger group failed:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create ledger group.",
      });
    } finally {
      setGroupSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const confirmDelete = window.confirm(
      "Delete this group? Make sure it has no child groups or ledgers."
    );
    if (!confirmDelete) return;

    try {
      await apiClient.bookkeeping.deleteLedgerGroup(groupId);
      setFeedback({
        type: "success",
        message: "Ledger group deleted.",
      });
      await loadLedgerGroups();
    } catch (error) {
      console.error("Delete ledger group failed:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete ledger group.",
      });
    }
  };

  const handleCreateLedger = async () => {
    if (!ledgerForm.name.trim() || !ledgerForm.groupId) {
      setFeedback({
        type: "error",
        message: "Ledger name and group are required.",
      });
      return;
    }

    setLedgerSaving(true);
    try {
      await apiClient.bookkeeping.createLedger({
        name: ledgerForm.name.trim(),
        alias: ledgerForm.alias || undefined,
        description: ledgerForm.description || undefined,
        groupId: ledgerForm.groupId,
        inventoryAffectsStock: ledgerForm.inventoryAffectsStock,
        maintainBillByBill: ledgerForm.maintainBillByBill,
        defaultCreditPeriodDays: ledgerForm.defaultCreditPeriodDays
          ? Number(ledgerForm.defaultCreditPeriodDays)
          : undefined,
        creditLimit: ledgerForm.creditLimit
          ? Number(ledgerForm.creditLimit)
          : undefined,
        interestComputation: ledgerForm.interestComputation,
        interestRate: ledgerForm.interestRate
          ? Number(ledgerForm.interestRate)
          : undefined,
        penalRate: ledgerForm.penalRate
          ? Number(ledgerForm.penalRate)
          : undefined,
        interestGraceDays: ledgerForm.interestGraceDays
          ? Number(ledgerForm.interestGraceDays)
          : undefined,
        panNumber: ledgerForm.panNumber || undefined,
        gstNumber: ledgerForm.gstNumber || undefined,
        taxNumber: ledgerForm.taxNumber || undefined,
        mailingAddress:
          ledgerForm.addressLine1 ||
          ledgerForm.city ||
          ledgerForm.state ||
          ledgerForm.postalCode
            ? {
                line1: ledgerForm.addressLine1,
                line2: ledgerForm.addressLine2,
                city: ledgerForm.city,
                state: ledgerForm.state,
                postalCode: ledgerForm.postalCode,
                country: ledgerForm.country,
                email: ledgerForm.email,
                phone: ledgerForm.phone,
              }
            : undefined,
        bankDetails: ledgerForm.accountNumber
          ? {
              bankName: ledgerForm.bankName,
              branch: ledgerForm.branch,
              accountName: ledgerForm.accountName,
              accountNumber: ledgerForm.accountNumber,
              ifsc: ledgerForm.ifsc,
            }
          : undefined,
        costCenterApplicable: ledgerForm.costCenterApplicable,
        openingBalance: ledgerForm.openingBalance
          ? Number(ledgerForm.openingBalance)
          : undefined,
        openingBalanceType: ledgerForm.openingBalanceType,
      });

      setFeedback({
        type: "success",
        message: "Ledger created successfully.",
      });
      resetLedgerForm();
      await loadLedgers();
    } catch (error) {
      console.error("Create ledger failed:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to create ledger.",
      });
    } finally {
      setLedgerSaving(false);
    }
  };

  const handleDeleteLedger = async (ledgerId: string) => {
    const confirmDelete = window.confirm(
      "Delete this ledger? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await apiClient.bookkeeping.deleteLedger(ledgerId);
      setFeedback({
        type: "success",
        message: "Ledger removed successfully.",
      });
      await loadLedgers();
    } catch (error) {
      console.error("Delete ledger failed:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete ledger.",
      });
    }
  };

  const renderGroupNode = (node: LedgerGroupTree) => (
    <div key={node.id} className="space-y-2">
      <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#607c47]" />
            <p className="font-semibold text-[#2C2C2C]">{node.name}</p>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {ledgerCategoryOptions.find(
              option => option.value === node.category
            )?.label ?? node.category}
          </p>
        </div>
        {!node.children?.length && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteGroup(node.id)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {node.children?.length ? (
        <div className="ml-6 border-l-2 border-dashed border-gray-300 pl-6">
          {node.children.map(child => renderGroupNode(child))}
        </div>
      ) : null}
    </div>
  );

  const feedbackBanner = feedback ? (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm flex items-center gap-2",
        feedback.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {feedback.type === "success" ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span>{feedback.message}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setFeedback(null)}
        className="ml-auto text-current hover:bg-transparent"
      >
        Dismiss
      </Button>
    </div>
  ) : null;

  const activeTabMeta = bookkeepingTabs.find(tab => tab.id === activeTab);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 min-h-screen">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-[#607c47] font-semibold">
                  Bookkeeping
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                  Ledger Master Control Room
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your chart of accounts, ledger groups, and individual ledgers with complete metadata, tax settings, and opening balances.
                </p>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex gap-1">
                  {bookkeepingTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2",
                          activeTab === tab.id
                            ? "text-[#2C2C2C] border-[#607c47] bg-white"
                            : "text-gray-600 border-transparent hover:text-[#2C2C2C] hover:bg-gray-50"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                {activeTabMeta && (
                  <p className="mt-2 text-sm text-gray-600 px-4">
                    {activeTabMeta.description}
                  </p>
                )}
              </div>

              {feedbackBanner}

              {/* Chart of Accounts Tab */}
              {activeTab === "chart" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border border-gray-200 shadow-sm bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg text-[#2C2C2C]">
                          Create Ledger Group
                        </CardTitle>
                        <CardDescription>
                          Build your chart of accounts hierarchy
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Group Name *</Label>
                          <Input
                            value={groupForm.name}
                            onChange={e =>
                              setGroupForm(prev => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g., Sundry Debtors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Select
                            value={groupForm.category}
                            onValueChange={value =>
                              setGroupForm(prev => ({
                                ...prev,
                                category: value as LedgerCategoryCode,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {ledgerCategoryOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Parent Group</Label>
                          <Select
                            value={groupForm.parentId || "root"}
                            onValueChange={value =>
                              setGroupForm(prev => ({
                                ...prev,
                                parentId: value === "root" ? "" : value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Root level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="root">Root Level</SelectItem>
                              {flattenedGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Code</Label>
                          <Input
                            value={groupForm.code}
                            onChange={e =>
                              setGroupForm(prev => ({ ...prev, code: e.target.value }))
                            }
                            placeholder="Optional code"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={groupForm.description}
                            onChange={e =>
                              setGroupForm(prev => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Optional description..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCreateGroup}
                            disabled={groupSaving}
                            className="flex-1 bg-[#607c47] hover:bg-[#4a6129] text-white"
                          >
                            {groupSaving ? "Saving..." : "Create Group"}
                          </Button>
                          <Button variant="outline" onClick={resetGroupForm}>
                            Clear
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm bg-white lg:col-span-2">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-[#2C2C2C]">
                            Chart of Accounts
                          </CardTitle>
                          <CardDescription>
                            {groupsLoading
                              ? "Loading..."
                              : `${ledgerGroups.length} group${ledgerGroups.length !== 1 ? "s" : ""} configured`}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="max-h-[600px] overflow-y-auto space-y-4 custom-scrollbar">
                        {groupTree.length === 0 && !groupsLoading ? (
                          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 bg-gray-50">
                            <FolderTree className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p className="font-medium">No groups yet</p>
                            <p className="text-xs mt-1">Use the form to start building your chart of accounts</p>
                          </div>
                        ) : (
                          groupTree.map(node => renderGroupNode(node))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Ledger Master Tab */}
              {activeTab === "ledgers" && (
                <div className="space-y-6">
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#2C2C2C]">
                        Create Ledger
                      </CardTitle>
                      <CardDescription>
                        Capture canonical ledger metadata, taxation, and opening balances
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Ledger Name *</Label>
                          <Input
                            value={ledgerForm.name}
                            onChange={e =>
                              setLedgerForm(prev => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g., ACME Supplies"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Under Group *</Label>
                          <Select
                            value={ledgerForm.groupId || "none"}
                            onValueChange={value =>
                              setLedgerForm(prev => ({
                                ...prev,
                                groupId: value === "none" ? "" : value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select group" />
                            </SelectTrigger>
                            <SelectContent>
                              {flattenedGroups.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Create a group first
                                </SelectItem>
                              ) : (
                                flattenedGroups.map(group => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Opening Balance</Label>
                            <Input
                              type="number"
                              value={ledgerForm.openingBalance}
                              onChange={e =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  openingBalance: e.target.value,
                                }))
                              }
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Balance Type</Label>
                            <Select
                              value={ledgerForm.openingBalanceType}
                              onValueChange={value =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  openingBalanceType: value as LedgerBalanceTypeCode,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {openingSideOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Default Credit Period (days)</Label>
                            <Input
                              type="number"
                              value={ledgerForm.defaultCreditPeriodDays}
                              onChange={e =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  defaultCreditPeriodDays: e.target.value,
                                }))
                              }
                              placeholder="30"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Credit Limit</Label>
                            <Input
                              type="number"
                              value={ledgerForm.creditLimit}
                              onChange={e =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  creditLimit: e.target.value,
                                }))
                              }
                              placeholder="500000"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Interest Method</Label>
                            <Select
                              value={ledgerForm.interestComputation}
                              onValueChange={value =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  interestComputation: value as InterestComputationCode,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {interestOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Interest Rate (%)</Label>
                            <Input
                              type="number"
                              value={ledgerForm.interestRate}
                              onChange={e =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  interestRate: e.target.value,
                                }))
                              }
                              placeholder="12"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={ledgerForm.maintainBillByBill}
                            onCheckedChange={checked =>
                              setLedgerForm(prev => ({
                                ...prev,
                                maintainBillByBill: Boolean(checked),
                              }))
                            }
                          />
                          <div>
                            <Label>Maintain bill-by-bill</Label>
                            <p className="text-xs text-gray-500">
                              Track outstanding bills and settlements
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={ledgerForm.inventoryAffectsStock}
                            onCheckedChange={checked =>
                              setLedgerForm(prev => ({
                                ...prev,
                                inventoryAffectsStock: Boolean(checked),
                              }))
                            }
                          />
                          <div>
                            <Label>Inventory values affected</Label>
                            <p className="text-xs text-gray-500">
                              Impacts stock valuation for trading ledgers
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>GST Number</Label>
                          <Input
                            value={ledgerForm.gstNumber}
                            onChange={e =>
                              setLedgerForm(prev => ({
                                ...prev,
                                gstNumber: e.target.value,
                              }))
                            }
                            placeholder="27ABCDE1234F1Z5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>PAN / Tax Number</Label>
                          <Input
                            value={ledgerForm.taxNumber}
                            onChange={e =>
                              setLedgerForm(prev => ({
                                ...prev,
                                taxNumber: e.target.value,
                              }))
                            }
                            placeholder="AAAPT1234A"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mailing Address</Label>
                          <Textarea
                            value={ledgerForm.addressLine1}
                            onChange={e =>
                              setLedgerForm(prev => ({
                                ...prev,
                                addressLine1: e.target.value,
                              }))
                            }
                            placeholder="Line 1"
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={ledgerForm.city}
                              onChange={e =>
                                setLedgerForm(prev => ({ ...prev, city: e.target.value }))
                              }
                              placeholder="City"
                            />
                            <Input
                              value={ledgerForm.state}
                              onChange={e =>
                                setLedgerForm(prev => ({ ...prev, state: e.target.value }))
                              }
                              placeholder="State"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={ledgerForm.postalCode}
                              onChange={e =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  postalCode: e.target.value,
                                }))
                              }
                              placeholder="Postal Code"
                            />
                            <Input
                              value={ledgerForm.country}
                              onChange={e =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  country: e.target.value,
                                }))
                              }
                              placeholder="Country"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Bank Details</Label>
                          <Input
                            value={ledgerForm.bankName}
                            onChange={e =>
                              setLedgerForm(prev => ({
                                ...prev,
                                bankName: e.target.value,
                              }))
                            }
                            placeholder="Bank Name"
                          />
                          <Input
                            value={ledgerForm.branch}
                            onChange={e =>
                              setLedgerForm(prev => ({
                                ...prev,
                                branch: e.target.value,
                              }))
                            }
                            placeholder="Branch"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={ledgerForm.accountName}
                              onChange={e =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  accountName: e.target.value,
                                }))
                              }
                              placeholder="Account Name"
                            />
                            <Input
                              value={ledgerForm.accountNumber}
                              onChange={e =>
                                setLedgerForm(prev => ({
                                  ...prev,
                                  accountNumber: e.target.value,
                                }))
                              }
                              placeholder="Account Number"
                            />
                          </div>
                          <Input
                            value={ledgerForm.ifsc}
                            onChange={e =>
                              setLedgerForm(prev => ({ ...prev, ifsc: e.target.value }))
                            }
                            placeholder="IFSC / SWIFT"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={ledgerForm.costCenterApplicable}
                            onCheckedChange={checked =>
                              setLedgerForm(prev => ({
                                ...prev,
                                costCenterApplicable: Boolean(checked),
                              }))
                            }
                          />
                          <div>
                            <Label>Cost centres applicable</Label>
                            <p className="text-xs text-gray-500">
                              Enable multi-dimension allocations
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={handleCreateLedger}
                            disabled={ledgerSaving || flattenedGroups.length === 0}
                            className="flex-1 bg-[#607c47] hover:bg-[#4a6129] text-white"
                          >
                            {ledgerSaving ? "Saving..." : "Create Ledger"}
                          </Button>
                          <Button variant="outline" onClick={resetLedgerForm}>
                            Reset
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <CardTitle className="text-lg text-[#2C2C2C]">
                          Ledger Register
                        </CardTitle>
                        <CardDescription>
                          {ledgersLoading
                            ? "Loading ledgers..."
                            : `${ledgers.length} ledger${ledgers.length !== 1 ? "s" : ""} available`}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[#2C2C2C]">Name</TableHead>
                            <TableHead className="text-[#2C2C2C]">Group</TableHead>
                            <TableHead className="text-[#2C2C2C]">Opening</TableHead>
                            <TableHead className="text-[#2C2C2C]">Interest</TableHead>
                            <TableHead className="text-[#2C2C2C]">Flags</TableHead>
                            <TableHead className="w-16 text-[#2C2C2C]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledgers.length === 0 && !ledgersLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">
                                <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="font-medium">No ledgers yet</p>
                                <p className="text-xs mt-1">Use the form above to add one</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            ledgers.map(ledger => (
                              <TableRow key={ledger.id} className="hover:bg-gray-50">
                                <TableCell>
                                  <div className="font-semibold text-[#2C2C2C]">
                                    {ledger.name}
                                  </div>
                                  {ledger.alias && (
                                    <div className="text-xs text-gray-500">
                                      {ledger.alias}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                                    {ledger.group?.name}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium text-[#2C2C2C]">
                                    {ledger.openingBalance !== null &&
                                    ledger.openingBalance !== undefined
                                      ? formatCurrency(Number(ledger.openingBalance))
                                      : "₹0.00"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {ledger.openingBalanceType === "DEBIT" ? "Dr" : "Cr"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {ledger.interestComputation === "NONE" ? (
                                    <span className="text-xs text-gray-500">
                                      Disabled
                                    </span>
                                  ) : (
                                    <div className="text-sm text-[#2C2C2C]">
                                      {ledger.interestComputation} ·{" "}
                                      {ledger.interestRate ?? 0}%
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {ledger.maintainBillByBill && (
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                        Bill-wise
                                      </Badge>
                                    )}
                                    {ledger.inventoryAffectsStock && (
                                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                        Inventory
                                      </Badge>
                                    )}
                                    {ledger.costCenterApplicable && (
                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                        Cost Centre
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteLedger(ledger.id)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default BookkeepingPage;
