"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Trash2,
  BookOpen,
  FolderTree,
  Plus,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  apiClient,
  InterestComputationCode,
  Ledger,
  LedgerBalanceTypeCode,
  LedgerCategoryCode,
  LedgerGroup,
  TrialBalanceRow,
  BalanceSheetItem,
} from "@/lib/api";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LedgerGroupTree = LedgerGroup & { children: LedgerGroupTree[] };
type FeedbackState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

type BookkeepingTabId =
  | "chart"
  | "ledgers"
  | "trial-balance"
  | "profit-loss"
  | "balance-sheet"
  | "cash-flow"
  | "ratios"
  | "cash-book"
  | "bank-book"
  | "day-book"
  | "ledger-book"
  | "journals"
  | "budgeting"
  | "year-end";

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
  {
    id: "trial-balance",
    label: "Trial Balance",
    description: "View trial balance report",
    icon: Layers,
  },
  {
    id: "profit-loss",
    label: "Profit & Loss",
    description: "View profit and loss statement",
    icon: Layers,
  },
  {
    id: "balance-sheet",
    label: "Balance Sheet",
    description: "View balance sheet report",
    icon: Layers,
  },
  {
    id: "cash-flow",
    label: "Cash Flow",
    description: "View cash flow statement",
    icon: Layers,
  },
  {
    id: "ratios",
    label: "Financial Ratios",
    description: "View financial ratios dashboard",
    icon: Layers,
  },
  {
    id: "cash-book",
    label: "Cash Book",
    description: "View all cash transactions",
    icon: Layers,
  },
  {
    id: "bank-book",
    label: "Bank Book",
    description: "View bank transactions",
    icon: Layers,
  },
  {
    id: "day-book",
    label: "Day Book",
    description: "View all vouchers for a day",
    icon: Layers,
  },
  {
    id: "ledger-book",
    label: "Ledger Book",
    description: "View ledger-wise entries",
    icon: Layers,
  },
  {
    id: "journals",
    label: "Journals",
    description: "View journals by type",
    icon: Layers,
  },
  {
    id: "budgeting",
    label: "Budgeting",
    description: "Budget definitions, variance analytics, and breach alerts",
    icon: FolderTree,
  },
  {
    id: "year-end",
    label: "Year-End Operations",
    description:
      "Closing entries, depreciation runs, and carry-forward workflows",
    icon: FolderTree,
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
    ledgerGroups.forEach((group) => {
      map.set(group.id, { ...group, children: [] });
    });

    const roots: LedgerGroupTree[] = [];
    map.forEach((node) => {
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
        .forEach((node) => {
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
      setLedgerForm((prev) => ({ ...prev, groupId: flattenedGroups[0].id }));
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
              (option) => option.value === node.category
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
          {node.children.map((child) => renderGroupNode(child))}
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

  const activeTabMeta = bookkeepingTabs.find((tab) => tab.id === activeTab);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 min-h-screen">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6 pb-32 max-w-full">
              {/* Header */}
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-[#607c47] font-semibold">
                  Bookkeeping
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                  Ledger Master Control Room
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your chart of accounts, ledger groups, and individual
                  ledgers with complete metadata, tax settings, and opening
                  balances.
                </p>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="flex gap-1 min-w-max pb-2">
                    {bookkeepingTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0",
                            activeTab === tab.id
                              ? "text-gray-900 border-teal-600 bg-white"
                              : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
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
                            onChange={(e) =>
                              setGroupForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="e.g., Sundry Debtors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Select
                            value={groupForm.category}
                            onValueChange={(value) =>
                              setGroupForm((prev) => ({
                                ...prev,
                                category: value as LedgerCategoryCode,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {ledgerCategoryOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
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
                            onValueChange={(value) =>
                              setGroupForm((prev) => ({
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
                              {flattenedGroups.map((group) => (
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
                            onChange={(e) =>
                              setGroupForm((prev) => ({
                                ...prev,
                                code: e.target.value,
                              }))
                            }
                            placeholder="Optional code"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={groupForm.description}
                            onChange={(e) =>
                              setGroupForm((prev) => ({
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
                            <p className="text-xs mt-1">
                              Use the form to start building your chart of
                              accounts
                            </p>
                          </div>
                        ) : (
                          groupTree.map((node) => renderGroupNode(node))
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
                        Capture canonical ledger metadata, taxation, and opening
                        balances
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Ledger Name *</Label>
                          <Input
                            value={ledgerForm.name}
                            onChange={(e) =>
                              setLedgerForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="e.g., ACME Supplies"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Under Group *</Label>
                          <Select
                            value={ledgerForm.groupId || "none"}
                            onValueChange={(value) =>
                              setLedgerForm((prev) => ({
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
                                flattenedGroups.map((group) => (
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
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
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
                              onValueChange={(value) =>
                                setLedgerForm((prev) => ({
                                  ...prev,
                                  openingBalanceType:
                                    value as LedgerBalanceTypeCode,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {openingSideOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
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
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
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
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
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
                              onValueChange={(value) =>
                                setLedgerForm((prev) => ({
                                  ...prev,
                                  interestComputation:
                                    value as InterestComputationCode,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {interestOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
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
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
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
                            onCheckedChange={(checked) =>
                              setLedgerForm((prev) => ({
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
                            onCheckedChange={(checked) =>
                              setLedgerForm((prev) => ({
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
                            onChange={(e) =>
                              setLedgerForm((prev) => ({
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
                            onChange={(e) =>
                              setLedgerForm((prev) => ({
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
                            onChange={(e) =>
                              setLedgerForm((prev) => ({
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
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
                                  ...prev,
                                  city: e.target.value,
                                }))
                              }
                              placeholder="City"
                            />
                            <Input
                              value={ledgerForm.state}
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
                                  ...prev,
                                  state: e.target.value,
                                }))
                              }
                              placeholder="State"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={ledgerForm.postalCode}
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
                                  ...prev,
                                  postalCode: e.target.value,
                                }))
                              }
                              placeholder="Postal Code"
                            />
                            <Input
                              value={ledgerForm.country}
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
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
                            onChange={(e) =>
                              setLedgerForm((prev) => ({
                                ...prev,
                                bankName: e.target.value,
                              }))
                            }
                            placeholder="Bank Name"
                          />
                          <Input
                            value={ledgerForm.branch}
                            onChange={(e) =>
                              setLedgerForm((prev) => ({
                                ...prev,
                                branch: e.target.value,
                              }))
                            }
                            placeholder="Branch"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={ledgerForm.accountName}
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
                                  ...prev,
                                  accountName: e.target.value,
                                }))
                              }
                              placeholder="Account Name"
                            />
                            <Input
                              value={ledgerForm.accountNumber}
                              onChange={(e) =>
                                setLedgerForm((prev) => ({
                                  ...prev,
                                  accountNumber: e.target.value,
                                }))
                              }
                              placeholder="Account Number"
                            />
                          </div>
                          <Input
                            value={ledgerForm.ifsc}
                            onChange={(e) =>
                              setLedgerForm((prev) => ({
                                ...prev,
                                ifsc: e.target.value,
                              }))
                            }
                            placeholder="IFSC / SWIFT"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={ledgerForm.costCenterApplicable}
                            onCheckedChange={(checked) =>
                              setLedgerForm((prev) => ({
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
                            disabled={
                              ledgerSaving || flattenedGroups.length === 0
                            }
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
                    <CardContent className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                      <div className="min-w-full">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[#2C2C2C]">
                                Name
                              </TableHead>
                              <TableHead className="text-[#2C2C2C]">
                                Group
                              </TableHead>
                              <TableHead className="text-[#2C2C2C]">
                                Opening
                              </TableHead>
                              <TableHead className="text-[#2C2C2C]">
                                Interest
                              </TableHead>
                              <TableHead className="text-[#2C2C2C]">
                                Flags
                              </TableHead>
                              <TableHead className="w-16 text-[#2C2C2C]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ledgers.length === 0 && !ledgersLoading ? (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center text-sm text-gray-500 py-8"
                                >
                                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  <p className="font-medium">No ledgers yet</p>
                                  <p className="text-xs mt-1">
                                    Use the form above to add one
                                  </p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              ledgers.map((ledger) => (
                                <TableRow
                                  key={ledger.id}
                                  className="hover:bg-gray-50"
                                >
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
                                        ? formatCurrency(
                                            Number(ledger.openingBalance)
                                          )
                                        : "₹0.00"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {ledger.openingBalanceType === "DEBIT"
                                        ? "Dr"
                                        : "Cr"}
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
                                      onClick={() =>
                                        handleDeleteLedger(ledger.id)
                                      }
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
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Financial Statements Tabs */}
              {activeTab === "trial-balance" && <TrialBalanceTab />}
              {activeTab === "profit-loss" && <ProfitLossTab />}
              {activeTab === "balance-sheet" && <BalanceSheetTab />}
              {activeTab === "cash-flow" && <CashFlowTab />}
              {activeTab === "ratios" && <RatiosTab />}

              {/* Books & Registers Tabs */}
              {activeTab === "cash-book" && <CashBookTab />}
              {activeTab === "bank-book" && <BankBookTab />}
              {activeTab === "day-book" && <DayBookTab />}
              {activeTab === "ledger-book" && <LedgerBookTab />}
              {activeTab === "journals" && <JournalsTab />}

              {/* Budgeting & Year-End Tabs */}
              {activeTab === "budgeting" && <BudgetingTab />}
              {activeTab === "year-end" && <YearEndTab />}
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

// Trial Balance Tab Component
function TrialBalanceTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrialBalanceRow[]>([]);
  const [asOnDate, setAsOnDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadTrialBalance = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.getTrialBalance(asOnDate);
      if (response.success) {
        setData(response.data ?? []);
      }
    } catch (error) {
      console.error("Failed to load trial balance:", error);
    } finally {
      setLoading(false);
    }
  }, [asOnDate]);

  useEffect(() => {
    loadTrialBalance();
  }, [loadTrialBalance]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Trial Balance</CardTitle>
              <CardDescription>As on {asOnDate}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={asOnDate}
                onChange={(e) => setAsOnDate(e.target.value)}
                className="w-auto"
              />
              <Button onClick={loadTrialBalance} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ledger Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className={
                      row.ledgerName === "TOTAL" ? "font-bold bg-gray-50" : ""
                    }
                  >
                    <TableCell>{row.ledgerName}</TableCell>
                    <TableCell>{row.groupName}</TableCell>
                    <TableCell className="text-right">
                      {row.debit ? formatCurrency(row.debit) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.credit ? formatCurrency(row.credit) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Profit & Loss Tab Component
type ProfitLossData = {
  trading?: Array<{ name: string; amount: number }>;
  indirectExpenses?: Array<{ name: string; amount: number }>;
  indirectIncomes?: Array<{ name: string; amount: number }>;
  netProfit?: number;
  grossProfit?: number;
};

function ProfitLossTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const loadPL = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.getProfitAndLoss({
        fromDate,
        toDate,
      });
      if (response.success) {
        setData(response.data ?? null);
      }
    } catch (error) {
      console.error("Failed to load P&L:", error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadPL();
  }, [loadPL]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                Period: {fromDate} to {toDate}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-auto"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-auto"
              />
              <Button onClick={loadPL} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Trading Account</h3>
                <Table>
                  <TableBody>
                    {data.trading?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>Gross Profit</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.grossProfit ?? 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Profit & Loss Account</h3>
                <Table>
                  <TableBody>
                    {data.indirectExpenses?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.indirectIncomes?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>Net Profit / Loss</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.netProfit ?? 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// Balance Sheet Tab Component
type BalanceSheetData = {
  assets?: Array<{ name: string; amount: number }>;
  liabilities?: Array<{ name: string; amount: number }>;
  capital?: Array<{ name: string; amount: number }>;
  totalAssets?: number;
  totalLiabilities?: number;
};

function BalanceSheetTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [asOnDate, setAsOnDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadBalanceSheet = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.getBalanceSheet(asOnDate);
      if (response.success) {
        setData(response.data ?? null);
      }
    } catch (error) {
      console.error("Failed to load balance sheet:", error);
    } finally {
      setLoading(false);
    }
  }, [asOnDate]);

  useEffect(() => {
    loadBalanceSheet();
  }, [loadBalanceSheet]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>As on {asOnDate}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={asOnDate}
                onChange={(e) => setAsOnDate(e.target.value)}
                className="w-auto"
              />
              <Button onClick={loadBalanceSheet} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Liabilities & Capital</h3>
                <Table>
                  <TableBody>
                    {data.liabilities?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.capital?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>Total Liabilities & Capital</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          (data.totalLiabilities ?? 0) +
                            (data.capital?.reduce(
                              (sum: number, c: { amount: number }) =>
                                sum + c.amount,
                              0
                            ) || 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Assets</h3>
                <Table>
                  <TableBody>
                    {data?.assets?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>Total Assets</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.totalAssets ?? 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// Cash Flow Tab Component
type CashFlowItem = {
  description: string;
  amount: number;
};

type CashFlowData = {
  openingBalance?: number;
  operating?: CashFlowItem[];
  investing?: CashFlowItem[];
  financing?: CashFlowItem[];
  netCashFlow?: number;
  closingBalance?: number;
};

function CashFlowTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CashFlowData | null>(null);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const loadCashFlow = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.getCashFlow({
        fromDate,
        toDate,
      });
      if (response.success) {
        setData(response.data ?? null);
      }
    } catch (error) {
      console.error("Failed to load cash flow:", error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadCashFlow();
  }, [loadCashFlow]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>
                Period: {fromDate} to {toDate}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-auto"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-auto"
              />
              <Button onClick={loadCashFlow} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600">
                  Opening Balance: {formatCurrency(data.openingBalance ?? 0)}
                </p>
              </div>
              {data.operating && data.operating.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Operating Activities</h3>
                  <Table>
                    <TableBody>
                      {data.operating.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {data.investing && data.investing.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Investing Activities</h3>
                  <Table>
                    <TableBody>
                      {data.investing.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {data.financing && data.financing.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Financing Activities</h3>
                  <Table>
                    <TableBody>
                      {data.financing.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm">
                  Net Cash Flow: {formatCurrency(data.netCashFlow ?? 0)}
                </p>
                <p className="text-sm font-semibold">
                  Closing Balance: {formatCurrency(data.closingBalance ?? 0)}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// Financial Ratios Tab Component
type FinancialRatios = {
  liquidity?: {
    currentRatio?: number;
    quickRatio?: number;
  };
  profitability?: {
    grossProfitMargin?: number;
    netProfitMargin?: number;
    returnOnAssets?: number;
  };
  efficiency?: {
    assetTurnover?: number;
    inventoryTurnover?: number;
  };
  leverage?: {
    debtToEquity?: number;
    debtRatio?: number;
  };
};

function RatiosTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FinancialRatios | null>(null);
  const [asOnDate, setAsOnDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadRatios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.getFinancialRatios(asOnDate);
      if (response.success) {
        setData(response.data ?? null);
      }
    } catch (error) {
      console.error("Failed to load ratios:", error);
    } finally {
      setLoading(false);
    }
  }, [asOnDate]);

  useEffect(() => {
    loadRatios();
  }, [loadRatios]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Financial Ratios</CardTitle>
              <CardDescription>As on {asOnDate}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={asOnDate}
                onChange={(e) => setAsOnDate(e.target.value)}
                className="w-auto"
              />
              <Button onClick={loadRatios} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data ? (
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Liquidity Ratios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Current Ratio</span>
                      <span className="font-semibold">
                        {data.liquidity?.currentRatio?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quick Ratio</span>
                      <span className="font-semibold">
                        {data.liquidity?.quickRatio?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Profitability Ratios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Gross Profit Margin (%)</span>
                      <span className="font-semibold">
                        {data.profitability?.grossProfitMargin?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Profit Margin (%)</span>
                      <span className="font-semibold">
                        {data.profitability?.netProfitMargin?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Return on Assets (%)</span>
                      <span className="font-semibold">
                        {data.profitability?.returnOnAssets?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Efficiency Ratios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Asset Turnover</span>
                      <span className="font-semibold">
                        {data.efficiency?.assetTurnover?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inventory Turnover</span>
                      <span className="font-semibold">
                        {data.efficiency?.inventoryTurnover?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Leverage Ratios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Debt to Equity</span>
                      <span className="font-semibold">
                        {data.leverage?.debtToEquity?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Debt Ratio</span>
                      <span className="font-semibold">
                        {data.leverage?.debtRatio?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function BudgetingTab() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [variance, setVariance] = useState<any>(null);
  const [breaches, setBreaches] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    periodStart: new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0],
    periodEnd: new Date(new Date().getFullYear(), 11, 31)
      .toISOString()
      .split("T")[0],
    budgetType: "LEDGER" as "LEDGER" | "GROUP" | "COST_CENTRE",
    ledgerId: "",
    ledgerGroupId: "",
    costCentreId: "",
    amount: "",
  });

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.listBudgets();
      if (response.success) {
        setBudgets(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load budgets:", error);
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const loadVariance = async () => {
    try {
      const response = await apiClient.bookkeeping.getBudgetVariance();
      if (response.success) {
        setVariance(response.data);
      }
    } catch (error) {
      console.error("Failed to load variance:", error);
    }
  };

  const loadBreaches = async () => {
    try {
      const response = await apiClient.bookkeeping.getBudgetBreaches();
      if (response.success) {
        setBreaches(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load breaches:", error);
    }
  };

  useEffect(() => {
    loadBudgets();
    loadVariance();
    loadBreaches();
  }, []);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.bookkeeping.createBudget({
        ...form,
        amount: Number(form.amount),
      });
      if (response.success) {
        toast.success("Budget created successfully");
        setFormOpen(false);
        setForm({
          name: "",
          description: "",
          periodStart: new Date(new Date().getFullYear(), 0, 1)
            .toISOString()
            .split("T")[0],
          periodEnd: new Date(new Date().getFullYear(), 11, 31)
            .toISOString()
            .split("T")[0],
          budgetType: "LEDGER",
          ledgerId: "",
          ledgerGroupId: "",
          costCentreId: "",
          amount: "",
        });
        loadBudgets();
        loadVariance();
        loadBreaches();
      }
    } catch (error) {
      console.error("Failed to create budget:", error);
      toast.error("Failed to create budget");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Budgeting & Variance
          </h2>
          <p className="text-sm text-muted-foreground">
            Define budgets and track variance against actuals
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {variance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                Total Budgeted
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatCurrency(variance.totalBudgeted)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Actual</div>
              <div className="text-2xl font-semibold text-teal-600">
                {formatCurrency(variance.totalActual)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                Total Variance
              </div>
              <div
                className={`text-2xl font-semibold ${variance.totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(variance.totalVariance)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Breaches</div>
              <div className="text-2xl font-semibold text-red-600">
                {variance.breaches?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {breaches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Budget Breaches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Budget</TableHead>
                  <TableHead className="text-right">Budgeted</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breaches.map((breach, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {breach.budgetName}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(breach.budgetAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(breach.actualAmount)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(breach.variance)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-700">BREACH</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No budgets defined yet. Create your first budget to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{budget.name}</TableCell>
                    <TableCell>
                      <Badge>{budget.budgetType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(budget.periodStart).toLocaleDateString()} -{" "}
                      {new Date(budget.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(budget.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create Budget</DialogTitle>
            <DialogDescription className="text-gray-600">
              Define a budget for ledger, group, or cost centre
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBudget} className="space-y-4">
            <div>
              <Label>Budget Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period Start *</Label>
                <Input
                  type="date"
                  value={form.periodStart}
                  onChange={(e) =>
                    setForm({ ...form, periodStart: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Period End *</Label>
                <Input
                  type="date"
                  value={form.periodEnd}
                  onChange={(e) =>
                    setForm({ ...form, periodEnd: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label>Budget Type *</Label>
              <select
                value={form.budgetType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    budgetType: e.target.value as
                      | "LEDGER"
                      | "GROUP"
                      | "COST_CENTRE",
                  })
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                required
              >
                <option value="LEDGER">Ledger</option>
                <option value="GROUP">Group</option>
                <option value="COST_CENTRE">Cost Centre</option>
              </select>
            </div>
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Create Budget
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function YearEndTab() {
  const [loading, setLoading] = useState(false);
  const [closingForm, setClosingForm] = useState({
    financialYearEnd: new Date(new Date().getFullYear(), 11, 31)
      .toISOString()
      .split("T")[0],
    narration: "",
  });
  const [depreciationForm, setDepreciationForm] = useState({
    asOnDate: new Date().toISOString().split("T")[0],
    depreciationRate: "10",
    narration: "",
  });
  const [carryForwardForm, setCarryForwardForm] = useState({
    fromFinancialYearEnd: new Date(new Date().getFullYear(), 11, 31)
      .toISOString()
      .split("T")[0],
    toFinancialYearStart: new Date(new Date().getFullYear() + 1, 0, 1)
      .toISOString()
      .split("T")[0],
  });

  const handleGenerateClosingEntries = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response =
        await apiClient.bookkeeping.generateClosingEntries(closingForm);
      if (response.success) {
        toast.success(
          `Closing entries generated. Net Profit: ${formatCurrency(response.data.netProfit)}`
        );
      } else {
        toast.error(response.error || "Failed to generate closing entries");
      }
    } catch (error) {
      console.error("Failed to generate closing entries:", error);
      toast.error("Failed to generate closing entries");
    } finally {
      setLoading(false);
    }
  };

  const handleRunDepreciation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.runDepreciation({
        ...depreciationForm,
        depreciationRate: Number(depreciationForm.depreciationRate),
      });
      if (response.success) {
        toast.success("Depreciation run completed successfully");
      } else {
        toast.error(response.error || "Failed to run depreciation");
      }
    } catch (error) {
      console.error("Failed to run depreciation:", error);
      toast.error("Failed to run depreciation");
    } finally {
      setLoading(false);
    }
  };

  const handleCarryForward = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response =
        await apiClient.bookkeeping.carryForwardBalances(carryForwardForm);
      if (response.success) {
        toast.success(
          response.data.message || "Balances carried forward successfully"
        );
      } else {
        toast.error(response.error || "Failed to carry forward balances");
      }
    } catch (error) {
      console.error("Failed to carry forward balances:", error);
      toast.error("Failed to carry forward balances");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Year-End Operations
        </h2>
        <p className="text-sm text-muted-foreground">
          Generate closing entries, run depreciation, and carry forward balances
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Closing Entries</CardTitle>
            <CardDescription>
              Transfer P&L balances to Capital/Retained Earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateClosingEntries} className="space-y-4">
              <div>
                <Label>Financial Year End *</Label>
                <Input
                  type="date"
                  value={closingForm.financialYearEnd}
                  onChange={(e) =>
                    setClosingForm({
                      ...closingForm,
                      financialYearEnd: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label>Narration</Label>
                <Textarea
                  value={closingForm.narration}
                  onChange={(e) =>
                    setClosingForm({
                      ...closingForm,
                      narration: e.target.value,
                    })
                  }
                  placeholder="Year-end closing entries"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                Generate Closing Entries
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Depreciation Run</CardTitle>
            <CardDescription>
              Calculate and post depreciation on fixed assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRunDepreciation} className="space-y-4">
              <div>
                <Label>As On Date *</Label>
                <Input
                  type="date"
                  value={depreciationForm.asOnDate}
                  onChange={(e) =>
                    setDepreciationForm({
                      ...depreciationForm,
                      asOnDate: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label>Depreciation Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={depreciationForm.depreciationRate}
                  onChange={(e) =>
                    setDepreciationForm({
                      ...depreciationForm,
                      depreciationRate: e.target.value,
                    })
                  }
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Narration</Label>
                <Textarea
                  value={depreciationForm.narration}
                  onChange={(e) =>
                    setDepreciationForm({
                      ...depreciationForm,
                      narration: e.target.value,
                    })
                  }
                  placeholder="Annual depreciation"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                Run Depreciation
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carry Forward Balances</CardTitle>
            <CardDescription>
              Carry forward closing balances as opening balances for new year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCarryForward} className="space-y-4">
              <div>
                <Label>From (Financial Year End) *</Label>
                <Input
                  type="date"
                  value={carryForwardForm.fromFinancialYearEnd}
                  onChange={(e) =>
                    setCarryForwardForm({
                      ...carryForwardForm,
                      fromFinancialYearEnd: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label>To (Financial Year Start) *</Label>
                <Input
                  type="date"
                  value={carryForwardForm.toFinancialYearStart}
                  onChange={(e) =>
                    setCarryForwardForm({
                      ...carryForwardForm,
                      toFinancialYearStart: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                Carry Forward Balances
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Cash Book Tab Component
function CashBookTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<
    Array<{
      date: string;
      voucherNumber: string;
      narration: string;
      debit: number;
      credit: number;
      balance: number;
    }>
  >([]);
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const loadCashBook = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.getCashBook({
        fromDate,
        toDate,
      });
      if (response.success && response.data) {
        setData(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load cash book:", error);
      toast.error("Failed to load cash book");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadCashBook();
  }, [loadCashBook]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cash Book</CardTitle>
          <CardDescription>View all cash transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No cash transactions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.voucherNumber}</TableCell>
                    <TableCell>{row.narration}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.debit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.credit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Bank Book Tab Component
function BankBookTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<
    Array<{
      date: string;
      voucherNumber: string;
      narration: string;
      debit: number;
      credit: number;
      balance: number;
    }>
  >([]);
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const loadBankBook = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.getBankBook({
        fromDate,
        toDate,
      });
      if (response.success && response.data) {
        setData(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load bank book:", error);
      toast.error("Failed to load bank book");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadBankBook();
  }, [loadBankBook]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bank Book</CardTitle>
          <CardDescription>View all bank transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No bank transactions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.voucherNumber}</TableCell>
                    <TableCell>{row.narration}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.debit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.credit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Day Book Tab Component
function DayBookTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<
    Array<{
      voucherNumber: string;
      voucherType: string;
      date: string;
      narration: string;
      debit: number;
      credit: number;
    }>
  >([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const loadDayBook = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.getDayBook(date);
      if (response.success && response.data) {
        setData(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load day book:", error);
      toast.error("Failed to load day book");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadDayBook();
  }, [loadDayBook]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Day Book</CardTitle>
          <CardDescription>
            View all vouchers for a specific day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No vouchers found for this date
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.voucherNumber}</TableCell>
                    <TableCell>{row.voucherType}</TableCell>
                    <TableCell>{row.narration}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.debit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.credit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Ledger Book Tab Component
function LedgerBookTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<
    Array<{
      date: string;
      voucherNumber: string;
      narration: string;
      debit: number;
      credit: number;
      balance: number;
    }>
  >([]);
  const [ledgerId, setLedgerId] = useState<string>("");
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const loadLedgers = async () => {
      try {
        const response = await apiClient.bookkeeping.listLedgers();
        if (response.success && response.data) {
          setLedgers(response.data);
        }
      } catch (error) {
        console.error("Failed to load ledgers:", error);
      }
    };
    loadLedgers();
  }, []);

  const loadLedgerBook = useCallback(async () => {
    if (!ledgerId) return;
    setLoading(true);
    try {
      const selectedLedger = ledgers.find((l) => l.id === ledgerId);
      const response = await apiClient.bookkeeping.getLedgerBook({
        ledgerName: selectedLedger?.name,
        fromDate,
        toDate,
      });
      if (response.success && response.data) {
        setData(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load ledger book:", error);
      toast.error("Failed to load ledger book");
    } finally {
      setLoading(false);
    }
  }, [ledgerId, ledgers, fromDate, toDate]);

  useEffect(() => {
    if (ledgerId) {
      loadLedgerBook();
    }
  }, [ledgerId, loadLedgerBook]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ledger Book</CardTitle>
          <CardDescription>
            View transactions for a specific ledger
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div>
              <Label>Ledger</Label>
              <Select value={ledgerId} onValueChange={setLedgerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ledger" />
                </SelectTrigger>
                <SelectContent>
                  {ledgers.map((ledger) => (
                    <SelectItem key={ledger.id} value={ledger.id}>
                      {ledger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          {!ledgerId ? (
            <div className="text-center py-8 text-gray-500">
              Please select a ledger
            </div>
          ) : loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.voucherNumber}</TableCell>
                    <TableCell>{row.narration}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.debit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.credit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Journals Tab Component
function JournalsTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<
    Array<{
      voucherNumber: string;
      date: string;
      narration: string;
      entries: Array<{
        ledgerName: string;
        debit: number;
        credit: number;
      }>;
    }>
  >([]);
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const loadJournals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.bookkeeping.getJournals({
        fromDate,
        toDate,
      });
      if (response.success && response.data) {
        setData(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load journals:", error);
      toast.error("Failed to load journals");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Journals</CardTitle>
          <CardDescription>View all journal vouchers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No journal vouchers found
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((journal, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {journal.voucherNumber} - {journal.date}
                    </CardTitle>
                    <CardDescription>{journal.narration}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ledger</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {journal.entries.map((entry, entryIdx) => (
                          <TableRow key={entryIdx}>
                            <TableCell>{entry.ledgerName}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(entry.debit)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(entry.credit)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BookkeepingPage;
