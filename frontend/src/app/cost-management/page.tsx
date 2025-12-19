"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  apiClient,
  CostCategory,
  CostCenter,
  InterestProfile,
  PartyInterestSetting,
  CostCategoryInput,
  CostCenterInput,
  InterestProfileInput,
  PartyInterestInput,
  InterestCompoundingFrequency,
  Party,
  PartyInput,
  CostCentreReport,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import {
  Building2,
  Calculator,
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
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
} from "@/components/ui/dialog";

type TabType =
  | "categories"
  | "centers"
  | "interest"
  | "party-interest"
  | "cost-centre-reporting";
type CategoryTreeNode = CostCategory & { children?: CategoryTreeNode[] };

const createEmptyPartyForm = (): PartyInput => ({
  name: "",
  type: "Customer",
  email: "",
  phone: "",
  openingBalance: 0,
  balanceType: "Debit",
});

const PARTY_TYPES = ["Customer", "Supplier", "Employee", "Other"];
const BALANCE_TYPES = ["Debit", "Credit"];

const flattenCategoryTree = (
  nodes: CategoryTreeNode[],
  depth = 0
): Array<CategoryTreeNode & { depth: number }> => {
  const flattened: Array<CategoryTreeNode & { depth: number }> = [];
  nodes.forEach((node) => {
    flattened.push({ ...node, depth });
    if (node.children && node.children.length > 0) {
      flattened.push(...flattenCategoryTree(node.children, depth + 1));
    }
  });
  return flattened;
};

const normalizeCategoryData = (items: CostCategory[]): CategoryTreeNode[] => {
  if (!items || items.length === 0) {
    return [];
  }

  const alreadyNested = items.some(
    (item) => Array.isArray(item.children) && item.children.length > 0
  );

  if (alreadyNested) {
    return items as CategoryTreeNode[];
  }

  const map = new Map<string, CategoryTreeNode>();
  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  const roots: CategoryTreeNode[] = [];

  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

const collectCategoryIds = (nodes: CategoryTreeNode[], bucket: Set<string>) => {
  nodes.forEach((node) => {
    bucket.add(node.id);
    if (node.children && node.children.length > 0) {
      collectCategoryIds(node.children, bucket);
    }
  });
};

const collectNodeAndDescendants = (
  node: CategoryTreeNode,
  bucket: Set<string>
) => {
  bucket.add(node.id);
  node.children?.forEach((child) => collectNodeAndDescendants(child, bucket));
};

export default function CostManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("categories");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [interestProfiles, setInterestProfiles] = useState<InterestProfile[]>(
    []
  );
  const [partySettings, setPartySettings] = useState<PartyInterestSetting[]>(
    []
  );
  const [parties, setParties] = useState<Party[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Category form state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryTreeNode | null>(null);
  const [categoryForm, setCategoryForm] = useState<CostCategoryInput>({
    name: "",
    description: "",
    parentId: null,
    isPrimary: false,
  });
  const [categorySaving, setCategorySaving] = useState(false);

  // Center form state
  const [centerDialogOpen, setCenterDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [centerForm, setCenterForm] = useState<CostCenterInput>({
    categoryId: "",
    name: "",
    code: "",
    description: "",
    parentId: null,
    isBillable: true,
    status: "active",
  });
  const [centerSaving, setCenterSaving] = useState(false);

  // Interest profile form state
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [editingInterest, setEditingInterest] =
    useState<InterestProfile | null>(null);
  const [interestForm, setInterestForm] = useState<InterestProfileInput>({
    name: "",
    description: "",
    calculationMode: "SIMPLE",
    rate: 0,
    compoundingFrequency: "NONE",
    gracePeriodDays: null,
    calculateFromDueDate: true,
    penalRate: 0,
    penalGraceDays: null,
  });
  const [interestSaving, setInterestSaving] = useState(false);

  // Party interest form state
  const [partyInterestDialogOpen, setPartyInterestDialogOpen] = useState(false);
  const [partyInterestForm, setPartyInterestForm] =
    useState<PartyInterestInput>({
      partyId: "",
      interestProfileId: "",
      overrideRate: null,
      effectiveFrom: "",
      effectiveTo: "",
      applyOnReceivables: true,
      applyOnPayables: false,
    });
  const [partySaving, setPartySaving] = useState(false);
  const [partyDialogOpen, setPartyDialogOpen] = useState(false);
  const [partyForm, setPartyForm] = useState<PartyInput>(
    createEmptyPartyForm()
  );
  const [partyCreating, setPartyCreating] = useState(false);

  const flatCategories = useMemo(
    () => flattenCategoryTree(categories),
    [categories]
  );

  const blockedParentIds = useMemo(() => {
    const blocked = new Set<string>();
    if (editingCategory) {
      collectNodeAndDescendants(editingCategory, blocked);
    }
    return blocked;
  }, [editingCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, centersRes, interestRes, partySettingsRes, partiesRes] =
        await Promise.all([
          apiClient.costing.listCategories(),
          apiClient.costing.listCenters(),
          apiClient.costing.listInterestProfiles(),
          apiClient.costing.listPartyInterestSettings(),
          apiClient.parties.list(),
        ]);

      if (catsRes.success && catsRes.data) {
        const tree = normalizeCategoryData(catsRes.data);
        setCategories(tree);
        const expanded = new Set<string>();
        collectCategoryIds(tree, expanded);
        setExpandedCategories(expanded);
      } else {
        setCategories([]);
        setExpandedCategories(new Set());
      }
      if (centersRes.success && centersRes.data) {
        setCenters(centersRes.data);
      }
      if (interestRes.success && interestRes.data) {
        setInterestProfiles(interestRes.data);
      }
      if (partySettingsRes.success && partySettingsRes.data) {
        setPartySettings(partySettingsRes.data);
      }
      if (partiesRes.success && partiesRes.data) {
        setParties(partiesRes.data);
      } else {
        setParties([]);
      }
    } catch (error) {
      console.error("Load cost management data error:", error);
      toast.error("Failed to load cost management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshParties = async () => {
    try {
      const response = await apiClient.parties.list();
      if (response.success && response.data) {
        setParties(response.data);
      }
    } catch (error) {
      console.error("Load parties error:", error);
    }
  };

  // Category handlers
  const handleCreateCategory = async () => {
    try {
      setCategorySaving(true);
      const response = await apiClient.costing.createCategory(categoryForm);
      if (response.success && response.data) {
        toast.success("Cost category created successfully");
        setCategoryDialogOpen(false);
        resetCategoryForm();
        await loadData();
      } else {
        toast.error(response.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Create category error:", error);
      toast.error("Failed to create category");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      setCategorySaving(true);
      const response = await apiClient.costing.updateCategory(
        editingCategory.id,
        categoryForm
      );
      if (response.success && response.data) {
        toast.success("Cost category updated successfully");
        setCategoryDialogOpen(false);
        setEditingCategory(null);
        resetCategoryForm();
        await loadData();
      } else {
        toast.error(response.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Update category error:", error);
      toast.error("Failed to update category");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const response = await apiClient.costing.deleteCategory(categoryId);
      if (response.success) {
        toast.success("Category deleted successfully");
        await loadData();
      } else {
        toast.error(response.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Delete category error:", error);
      toast.error("Failed to delete category");
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      parentId: null,
      isPrimary: false,
    });
    setEditingCategory(null);
  };

  const resetPartyForm = () => {
    setPartyForm(createEmptyPartyForm());
  };

  const openCategoryDialog = (category?: CostCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        parentId: category.parentId || null,
        isPrimary: category.isPrimary,
      });
    } else {
      resetCategoryForm();
    }
    setCategoryDialogOpen(true);
  };

  // Center handlers
  const handleCreateCenter = async () => {
    try {
      setCenterSaving(true);
      const response = await apiClient.costing.createCenter(centerForm);
      if (response.success && response.data) {
        toast.success("Cost center created successfully");
        setCenterDialogOpen(false);
        resetCenterForm();
        await loadData();
      } else {
        toast.error(response.error || "Failed to create center");
      }
    } catch (error) {
      console.error("Create center error:", error);
      toast.error("Failed to create center");
    } finally {
      setCenterSaving(false);
    }
  };

  const handleUpdateCenter = async () => {
    if (!editingCenter) return;
    try {
      setCenterSaving(true);
      const response = await apiClient.costing.updateCenter(
        editingCenter.id,
        centerForm
      );
      if (response.success && response.data) {
        toast.success("Cost center updated successfully");
        setCenterDialogOpen(false);
        setEditingCenter(null);
        resetCenterForm();
        await loadData();
      } else {
        toast.error(response.error || "Failed to update center");
      }
    } catch (error) {
      console.error("Update center error:", error);
      toast.error("Failed to update center");
    } finally {
      setCenterSaving(false);
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    if (!confirm("Are you sure you want to delete this cost center?")) return;
    try {
      const response = await apiClient.costing.deleteCenter(centerId);
      if (response.success) {
        toast.success("Cost center deleted successfully");
        await loadData();
      } else {
        toast.error(response.error || "Failed to delete center");
      }
    } catch (error) {
      console.error("Delete center error:", error);
      toast.error("Failed to delete center");
    }
  };

  const resetCenterForm = () => {
    setCenterForm({
      categoryId: flatCategories[0]?.id || "",
      name: "",
      code: "",
      description: "",
      parentId: null,
      isBillable: true,
      status: "active",
    });
    setEditingCenter(null);
  };

  const openCenterDialog = (center?: CostCenter) => {
    if (center) {
      setEditingCenter(center);
      setCenterForm({
        categoryId: center.categoryId,
        name: center.name,
        code: center.code || "",
        description: center.description || "",
        parentId: center.parentId || null,
        isBillable: center.isBillable,
        status: center.status as "active" | "inactive",
      });
    } else {
      resetCenterForm();
    }
    setCenterDialogOpen(true);
  };

  // Interest profile handlers
  const handleCreateInterest = async () => {
    try {
      setInterestSaving(true);
      const response =
        await apiClient.costing.createInterestProfile(interestForm);
      if (response.success && response.data) {
        toast.success("Interest profile created successfully");
        setInterestDialogOpen(false);
        resetInterestForm();
        await loadData();
      } else {
        toast.error(response.error || "Failed to create interest profile");
      }
    } catch (error) {
      console.error("Create interest profile error:", error);
      toast.error("Failed to create interest profile");
    } finally {
      setInterestSaving(false);
    }
  };

  const handleUpdateInterest = async () => {
    if (!editingInterest) return;
    try {
      setInterestSaving(true);
      const response = await apiClient.costing.updateInterestProfile(
        editingInterest.id,
        interestForm
      );
      if (response.success && response.data) {
        toast.success("Interest profile updated successfully");
        setInterestDialogOpen(false);
        setEditingInterest(null);
        resetInterestForm();
        await loadData();
      } else {
        toast.error(response.error || "Failed to update interest profile");
      }
    } catch (error) {
      console.error("Update interest profile error:", error);
      toast.error("Failed to update interest profile");
    } finally {
      setInterestSaving(false);
    }
  };

  const handleDeleteInterest = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this interest profile?"))
      return;
    try {
      const response = await apiClient.costing.deleteInterestProfile(profileId);
      if (response.success) {
        toast.success("Interest profile deleted successfully");
        await loadData();
      } else {
        toast.error(response.error || "Failed to delete interest profile");
      }
    } catch (error) {
      console.error("Delete interest profile error:", error);
      toast.error("Failed to delete interest profile");
    }
  };

  const resetInterestForm = () => {
    setInterestForm({
      name: "",
      description: "",
      calculationMode: "SIMPLE",
      rate: 0,
      compoundingFrequency: "NONE",
      gracePeriodDays: null,
      calculateFromDueDate: true,
      penalRate: 0,
      penalGraceDays: null,
    });
    setEditingInterest(null);
  };

  const openInterestDialog = (profile?: InterestProfile) => {
    if (profile) {
      setEditingInterest(profile);
      setInterestForm({
        name: profile.name,
        description: profile.description || "",
        calculationMode: profile.calculationMode,
        rate: profile.rate,
        compoundingFrequency: profile.compoundingFrequency,
        gracePeriodDays: profile.gracePeriodDays || null,
        calculateFromDueDate: profile.calculateFromDueDate,
        penalRate: profile.penalRate,
        penalGraceDays: profile.penalGraceDays || null,
      });
    } else {
      resetInterestForm();
    }
    setInterestDialogOpen(true);
  };

  // Party interest handlers
  const handleAssignInterest = async () => {
    try {
      setPartySaving(true);
      const response =
        await apiClient.costing.assignInterestToParty(partyInterestForm);
      if (response.success && response.data) {
        toast.success("Interest assigned to party successfully");
        setPartyInterestDialogOpen(false);
        resetPartyInterestForm();
        await loadData();
      } else {
        toast.error(response.error || "Failed to assign interest");
      }
    } catch (error) {
      console.error("Assign interest error:", error);
      toast.error("Failed to assign interest");
    } finally {
      setPartySaving(false);
    }
  };

  const handleRemoveInterest = async (partyId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove interest settings for this party?"
      )
    )
      return;
    try {
      const response = await apiClient.costing.removeInterestForParty(partyId);
      if (response.success) {
        toast.success("Interest settings removed successfully");
        await loadData();
      } else {
        toast.error(response.error || "Failed to remove interest settings");
      }
    } catch (error) {
      console.error("Remove interest error:", error);
      toast.error("Failed to remove interest settings");
    }
  };

  const resetPartyInterestForm = () => {
    setPartyInterestForm({
      partyId: "",
      interestProfileId: "",
      overrideRate: null,
      effectiveFrom: "",
      effectiveTo: "",
      applyOnReceivables: true,
      applyOnPayables: false,
    });
  };

  const handleCreateParty = async () => {
    if (!partyForm.name.trim()) {
      toast.error("Party name is required");
      return;
    }
    try {
      setPartyCreating(true);
      const response = await apiClient.parties.create({
        ...partyForm,
        openingBalance: partyForm.openingBalance ?? 0,
      });
      if (response.success && response.data) {
        toast.success("Party created successfully");
        await refreshParties();
        setPartyDialogOpen(false);
        resetPartyForm();
        const partyId = response.data.id;
        if (partyId) {
          setPartyInterestForm((prev) => ({
            ...prev,
            partyId,
          }));
        }
      } else {
        toast.error(response.error || "Failed to create party");
      }
    } catch (error) {
      console.error("Create party error:", error);
      toast.error("Failed to create party");
    } finally {
      setPartyCreating(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoriesTab = () => {
    const rootCategories = categories;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2C2C2C]">
            Cost Categories
          </h3>
          <Button
            onClick={() => openCategoryDialog()}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
            No cost categories defined yet. Create your first category to get
            started.
          </div>
        ) : (
          <div className="space-y-2">
            {rootCategories.map((category) => (
              <CategoryTree
                key={category.id}
                category={category}
                expandedIds={expandedCategories}
                onToggle={toggleCategory}
                onEdit={openCategoryDialog}
                onDelete={handleDeleteCategory}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCentersTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2C2C2C]">Cost Centers</h3>
          <Button
            onClick={() => openCenterDialog()}
            className="flex items-center gap-2"
            disabled={categories.length === 0}
          >
            <Plus className="h-4 w-4" /> Add Center
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
          </div>
        ) : centers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
            No cost centers defined yet. Create your first center to get
            started.
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#2C2C2C]">Name</TableHead>
                  <TableHead className="text-[#2C2C2C]">Code</TableHead>
                  <TableHead className="text-[#2C2C2C]">Category</TableHead>
                  <TableHead className="text-[#2C2C2C]">Status</TableHead>
                  <TableHead className="text-[#2C2C2C]">Billable</TableHead>
                  <TableHead className="text-right text-[#2C2C2C]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centers.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>{center.code || "-"}</TableCell>
                    <TableCell>{center.category?.name || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          center.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {center.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {center.isBillable ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCenterDialog(center)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCenter(center.id)}
                          className="text-red-500 hover:text-red-600"
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
      </div>
    );
  };

  const renderInterestTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2C2C2C]">
            Interest Profiles
          </h3>
          <Button
            onClick={() => openInterestDialog()}
            className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white"
          >
            <Plus className="h-4 w-4" /> Add Profile
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
          </div>
        ) : interestProfiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
            No interest profiles defined yet. Create your first profile to get
            started.
          </div>
        ) : (
          <div className="space-y-3">
            {interestProfiles.map((profile) => (
              <Card
                key={profile.id}
                className="rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-[#2C2C2C]">
                        {profile.name}
                      </CardTitle>
                      {profile.description && (
                        <p className="text-xs text-[#2C2C2C]/70 mt-0.5">
                          {profile.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInterestDialog(profile)}
                        className="border-gray-300 text-[#2C2C2C] hover:bg-gray-100 text-xs px-3"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInterest(profile.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 text-xs px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm text-[#2C2C2C]">
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-[#2C2C2C]/60">
                        Rate
                      </p>
                      <p className="text-base font-semibold">{profile.rate}%</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-[#2C2C2C]/60">
                        Mode
                      </p>
                      <p className="text-base font-semibold">
                        {profile.calculationMode}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-[#2C2C2C]/60">
                        Compounding
                      </p>
                      <p className="text-base font-semibold">
                        {profile.compoundingFrequency}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-[#2C2C2C]/60">
                        Grace Period
                      </p>
                      <p className="text-base font-semibold">
                        {profile.gracePeriodDays ?? 0} days
                      </p>
                    </div>
                    {profile.penalRate > 0 && (
                      <>
                        <div className="rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[11px] uppercase tracking-wide text-[#2C2C2C]/60">
                            Penal Rate
                          </p>
                          <p className="text-base font-semibold">
                            {profile.penalRate}%
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2.5">
                          <p className="text-[11px] uppercase tracking-wide text-[#2C2C2C]/60">
                            Penal Grace
                          </p>
                          <p className="text-base font-semibold">
                            {profile.penalGraceDays ?? 0} days
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCostCentreReportingTab = () => {
    const [reportLoading, setReportLoading] = useState(false);
    const [reportData, setReportData] = useState<CostCentreReport | null>(null);
    const [selectedCostCentre, setSelectedCostCentre] = useState<string>("");
    const [fromDate, setFromDate] = useState(
      new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
    );
    const [toDate, setToDate] = useState(
      new Date().toISOString().split("T")[0]
    );

    const loadReport = async () => {
      setReportLoading(true);
      try {
        const response = await apiClient.bookkeeping.getCostCentrePL({
          costCentreId: selectedCostCentre || undefined,
          fromDate,
          toDate,
        });
        if (response.success) {
          setReportData(response.data ?? null);
        }
      } catch (error) {
        console.error("Failed to load cost centre report:", error);
        toast.error("Failed to load cost centre report");
      } finally {
        setReportLoading(false);
      }
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(value || 0);
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Label>Cost Centre (Optional)</Label>
                <select
                  value={selectedCostCentre}
                  onChange={(e) => setSelectedCostCentre(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm mt-1"
                >
                  <option value="">All Cost Centres</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadReport} disabled={reportLoading}>
                  Generate Report
                </Button>
              </div>
            </div>

            {reportLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : reportData ? (
              <div className="space-y-6">
                {reportData.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">
                          Total Sales
                        </div>
                        <div className="text-2xl font-semibold text-green-600">
                          {formatCurrency(reportData.summary.totalSales)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">
                          Total Expense
                        </div>
                        <div className="text-2xl font-semibold text-red-600">
                          {formatCurrency(
                            reportData.summary.totalDirectExpense +
                              reportData.summary.totalIndirectExpense
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">
                          Gross Profit
                        </div>
                        <div className="text-2xl font-semibold text-[#607c47]">
                          {formatCurrency(reportData.summary.totalGrossProfit)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">
                          Net Profit
                        </div>
                        <div
                          className={`text-2xl font-semibold ${reportData.summary.totalNetProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {formatCurrency(reportData.summary.totalNetProfit)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {reportData.centres && reportData.centres.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cost Centre</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Purchase</TableHead>
                        <TableHead className="text-right">
                          Direct Income
                        </TableHead>
                        <TableHead className="text-right">
                          Indirect Income
                        </TableHead>
                        <TableHead className="text-right">
                          Direct Expense
                        </TableHead>
                        <TableHead className="text-right">
                          Indirect Expense
                        </TableHead>
                        <TableHead className="text-right">
                          Gross Profit
                        </TableHead>
                        <TableHead className="text-right">Net Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.centres.map((centre, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {centre.costCentreName}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(centre.sales)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(centre.purchase)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(centre.directIncome)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(centre.indirectIncome)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(centre.directExpense)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(centre.indirectExpense)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-[#607c47]">
                            {formatCurrency(centre.grossProfit)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${centre.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(centre.netProfit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select date range and click "Generate Report" to view cost
                centre P&L
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPartyInterestTab = () => {
    const canAssignInterest = parties.length > 0 && interestProfiles.length > 0;

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-[#2C2C2C]">
            Party Interest Settings
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetPartyForm();
                setPartyDialogOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Party
            </Button>
            <Button
              onClick={() => {
                if (!canAssignInterest) {
                  toast.error(
                    "Create at least one party and interest profile first."
                  );
                  return;
                }
                setPartyInterestForm((prev) => ({
                  ...prev,
                  partyId: prev.partyId || parties[0]?.id || "",
                  interestProfileId:
                    prev.interestProfileId || interestProfiles[0]?.id || "",
                }));
                setPartyInterestDialogOpen(true);
              }}
              className="flex items-center gap-2"
              disabled={!canAssignInterest}
            >
              <Plus className="h-4 w-4" /> Assign Interest
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
          </div>
        ) : partySettings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
            No party interest settings defined yet. Assign interest profiles to
            parties to get started.
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#2C2C2C]">Party</TableHead>
                  <TableHead className="text-[#2C2C2C]">
                    Interest Profile
                  </TableHead>
                  <TableHead className="text-[#2C2C2C]">
                    Override Rate
                  </TableHead>
                  <TableHead className="text-[#2C2C2C]">Applies To</TableHead>
                  <TableHead className="text-right text-[#2C2C2C]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partySettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">
                      {setting.party?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {setting.interestProfile?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {setting.overrideRate ? `${setting.overrideRate}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {setting.applyOnReceivables && (
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                            Receivables
                          </span>
                        )}
                        {setting.applyOnPayables && (
                          <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">
                            Payables
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveInterest(setting.partyId)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                Cost Management
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Manage cost centres, categories, and interest calculation
                settings.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {[
              {
                id: "categories" as TabType,
                label: "Categories",
                icon: Building2,
              },
              {
                id: "centers" as TabType,
                label: "Cost Centers",
                icon: Calculator,
              },
              {
                id: "interest" as TabType,
                label: "Interest Profiles",
                icon: Settings,
              },
              {
                id: "party-interest" as TabType,
                label: "Party Interest",
                icon: Users,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-[#607c47] text-[#607c47] font-medium"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              {activeTab === "categories" && renderCategoriesTab()}
              {activeTab === "centers" && renderCentersTab()}
              {activeTab === "interest" && renderInterestTab()}
              {activeTab === "party-interest" && renderPartyInterestTab()}
              {activeTab === "cost-centre-reporting" &&
                renderCostCentreReportingTab()}
            </CardContent>
          </Card>

          {/* Category Dialog */}
          <Dialog
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  {editingCategory ? "Edit Category" : "Create Cost Category"}
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  {editingCategory
                    ? "Update the cost category details."
                    : "Create a new cost category for organizing expenses."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    placeholder="Category name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={categoryForm.description || ""}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <select
                    value={categoryForm.parentId || ""}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        parentId: e.target.value || null,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                  >
                    <option value="">None (Root Category)</option>
                    {flatCategories
                      .filter((cat) => !blockedParentIds.has(cat.id))
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {`${"— ".repeat(cat.depth)}${cat.name}`}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={categoryForm.isPrimary}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        isPrimary: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isPrimary" className="cursor-pointer">
                    Mark as Primary Category
                  </Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCategoryDialogOpen(false)}
                    className="text-[#2C2C2C] border-gray-300 hover:bg-gray-100"
                    disabled={categorySaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      editingCategory
                        ? handleUpdateCategory
                        : handleCreateCategory
                    }
                    disabled={categorySaving || !categoryForm.name.trim()}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {categorySaving
                      ? "Saving..."
                      : editingCategory
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Center Dialog */}
          <Dialog open={centerDialogOpen} onOpenChange={setCenterDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCenter ? "Edit Cost Center" : "Create Cost Center"}
                </DialogTitle>
                <DialogDescription>
                  {editingCenter
                    ? "Update the cost center details."
                    : "Create a new cost center for tracking expenses."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <select
                    value={centerForm.categoryId}
                    onChange={(e) =>
                      setCenterForm({
                        ...centerForm,
                        categoryId: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                    required
                  >
                    <option value="">Select category</option>
                    {flatCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {`${"— ".repeat(cat.depth)}${cat.name}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={centerForm.name}
                    onChange={(e) =>
                      setCenterForm({ ...centerForm, name: e.target.value })
                    }
                    placeholder="Cost center name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={centerForm.code || ""}
                    onChange={(e) =>
                      setCenterForm({ ...centerForm, code: e.target.value })
                    }
                    placeholder="Optional code"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={centerForm.description || ""}
                    onChange={(e) =>
                      setCenterForm({
                        ...centerForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Center</Label>
                  <select
                    value={centerForm.parentId || ""}
                    onChange={(e) =>
                      setCenterForm({
                        ...centerForm,
                        parentId: e.target.value || null,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                  >
                    <option value="">None (Root Center)</option>
                    {centers
                      .filter((c) => c.id !== editingCenter?.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isBillable"
                    checked={centerForm.isBillable}
                    onChange={(e) =>
                      setCenterForm({
                        ...centerForm,
                        isBillable: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isBillable" className="cursor-pointer">
                    Billable to customers
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={centerForm.status}
                    onChange={(e) =>
                      setCenterForm({
                        ...centerForm,
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCenterDialogOpen(false)}
                    className="text-[#2C2C2C] border-gray-300 hover:bg-gray-100"
                    disabled={centerSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      editingCenter ? handleUpdateCenter : handleCreateCenter
                    }
                    disabled={
                      centerSaving ||
                      !centerForm.name.trim() ||
                      !centerForm.categoryId
                    }
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {centerSaving
                      ? "Saving..."
                      : editingCenter
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Interest Profile Dialog */}
          <Dialog
            open={interestDialogOpen}
            onOpenChange={setInterestDialogOpen}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  {editingInterest
                    ? "Edit Interest Profile"
                    : "Create Interest Profile"}
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  {editingInterest
                    ? "Update the interest calculation profile."
                    : "Create a new interest profile for calculating interest on receivables/payables."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={interestForm.name}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="Profile name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate (%) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={interestForm.rate}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          rate:
                            e.target.value === ""
                              ? 0
                              : Math.max(0, Number(e.target.value)),
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={interestForm.description || ""}
                    onChange={(e) =>
                      setInterestForm({
                        ...interestForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Calculation Mode</Label>
                    <select
                      value={interestForm.calculationMode}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          calculationMode: e.target.value as
                            | "SIMPLE"
                            | "COMPOUND",
                        })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                    >
                      <option value="SIMPLE">Simple</option>
                      <option value="COMPOUND">Compound</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Compounding Frequency</Label>
                    <select
                      value={interestForm.compoundingFrequency}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          compoundingFrequency: e.target
                            .value as InterestCompoundingFrequency,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                    >
                      <option value="NONE">None</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grace Period (Days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={interestForm.gracePeriodDays || ""}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          gracePeriodDays: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Penal Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={interestForm.penalRate ?? 0}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          penalRate:
                            e.target.value === ""
                              ? 0
                              : Math.max(0, Number(e.target.value)),
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Penal Grace Period (Days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={interestForm.penalGraceDays || ""}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          penalGraceDays: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="calculateFromDueDate"
                      checked={interestForm.calculateFromDueDate}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          calculateFromDueDate: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="calculateFromDueDate"
                      className="cursor-pointer"
                    >
                      Calculate from due date
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setInterestDialogOpen(false)}
                    className="text-[#2C2C2C] border-gray-300 hover:bg-gray-100"
                    disabled={interestSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      editingInterest
                        ? handleUpdateInterest
                        : handleCreateInterest
                    }
                    disabled={interestSaving || !interestForm.name.trim()}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {interestSaving
                      ? "Saving..."
                      : editingInterest
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Party Interest Dialog */}
          <Dialog
            open={partyInterestDialogOpen}
            onOpenChange={setPartyInterestDialogOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Interest to Party</DialogTitle>
                <DialogDescription>
                  Assign an interest profile to a party for automatic interest
                  calculation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Interest Profile *</Label>
                  <select
                    value={partyInterestForm.interestProfileId}
                    onChange={(e) =>
                      setPartyInterestForm({
                        ...partyInterestForm,
                        interestProfileId: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                    required
                    disabled={interestProfiles.length === 0}
                  >
                    <option value="">Select profile</option>
                    {interestProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} ({profile.rate}%)
                      </option>
                    ))}
                  </select>
                  {interestProfiles.length === 0 && (
                    <p className="text-xs text-red-500">
                      Create an interest profile before assigning it to parties.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Party *</Label>
                  <select
                    value={partyInterestForm.partyId}
                    onChange={(e) =>
                      setPartyInterestForm({
                        ...partyInterestForm,
                        partyId: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                    disabled={parties.length === 0}
                    required
                  >
                    <option value="">Select party</option>
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.name} · {party.type}
                      </option>
                    ))}
                  </select>
                  {parties.length === 0 ? (
                    <p className="text-xs text-red-500">
                      Add a party before assigning interest.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Parties are managed via the "Add Party" button above.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Override Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={partyInterestForm.overrideRate || ""}
                    onChange={(e) =>
                      setPartyInterestForm({
                        ...partyInterestForm,
                        overrideRate: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Leave empty to use profile rate"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Effective From</Label>
                    <Input
                      type="date"
                      value={partyInterestForm.effectiveFrom || ""}
                      onChange={(e) =>
                        setPartyInterestForm({
                          ...partyInterestForm,
                          effectiveFrom: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effective To</Label>
                    <Input
                      type="date"
                      value={partyInterestForm.effectiveTo || ""}
                      onChange={(e) =>
                        setPartyInterestForm({
                          ...partyInterestForm,
                          effectiveTo: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Apply To</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="applyOnReceivables"
                        checked={partyInterestForm.applyOnReceivables}
                        onChange={(e) =>
                          setPartyInterestForm({
                            ...partyInterestForm,
                            applyOnReceivables: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor="applyOnReceivables"
                        className="cursor-pointer"
                      >
                        Receivables
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="applyOnPayables"
                        checked={partyInterestForm.applyOnPayables}
                        onChange={(e) =>
                          setPartyInterestForm({
                            ...partyInterestForm,
                            applyOnPayables: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor="applyOnPayables"
                        className="cursor-pointer"
                      >
                        Payables
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPartyInterestDialogOpen(false)}
                    className="text-[#2C2C2C] border-gray-300 hover:bg-gray-100"
                    disabled={partySaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignInterest}
                    disabled={
                      partySaving ||
                      !partyInterestForm.partyId.trim() ||
                      !partyInterestForm.interestProfileId.trim()
                    }
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {partySaving ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog
            open={partyDialogOpen}
            onOpenChange={(open) => {
              setPartyDialogOpen(open);
              if (!open) {
                resetPartyForm();
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Party</DialogTitle>
                <DialogDescription>
                  Create a party record to use across bills, receivables, and
                  interest assignments.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="partyName">Party Name *</Label>
                  <Input
                    id="partyName"
                    value={partyForm.name}
                    onChange={(e) =>
                      setPartyForm({ ...partyForm, name: e.target.value })
                    }
                    placeholder="e.g., Customer ABC Pvt Ltd"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partyType">Party Type</Label>
                    <select
                      id="partyType"
                      value={partyForm.type}
                      onChange={(e) =>
                        setPartyForm({ ...partyForm, type: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                    >
                      {PARTY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balanceType">Balance Type</Label>
                    <select
                      id="balanceType"
                      value={partyForm.balanceType}
                      onChange={(e) =>
                        setPartyForm({
                          ...partyForm,
                          balanceType: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                    >
                      {BALANCE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partyEmail">Email</Label>
                    <Input
                      id="partyEmail"
                      value={partyForm.email || ""}
                      onChange={(e) =>
                        setPartyForm({ ...partyForm, email: e.target.value })
                      }
                      placeholder="finance@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partyPhone">Phone</Label>
                    <Input
                      id="partyPhone"
                      value={partyForm.phone || ""}
                      onChange={(e) =>
                        setPartyForm({ ...partyForm, phone: e.target.value })
                      }
                      placeholder="+91-9000000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openingBalance">Opening Balance</Label>
                  <Input
                    id="openingBalance"
                    type="number"
                    step="0.01"
                    value={partyForm.openingBalance ?? 0}
                    onChange={(e) =>
                      setPartyForm({
                        ...partyForm,
                        openingBalance:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetPartyForm();
                      setPartyDialogOpen(false);
                    }}
                    disabled={partyCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateParty}
                    disabled={partyCreating || !partyForm.name.trim()}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {partyCreating ? "Creating..." : "Create Party"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

// Helper component for category tree
function CategoryTree({
  category,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
}: {
  category: CategoryTreeNode;
  expandedIds: Set<string>;
  onToggle: (categoryId: string) => void;
  onEdit: (cat: CategoryTreeNode) => void;
  onDelete: (id: string) => void;
}) {
  const children = category.children ?? [];
  const isExpanded = expandedIds.has(category.id);
  const childCount = children.length;
  const costCenterCount = category.costCenters?.length ?? 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between p-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            {childCount > 0 ? (
              <button
                onClick={() => onToggle(category.id)}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
                aria-label={
                  isExpanded ? "Collapse category" : "Expand category"
                }
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="h-9 w-9 rounded-full border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                •
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-semibold text-[#2C2C2C]">
                  {category.name}
                </span>
                {category.isPrimary && (
                  <Badge
                    variant="outline"
                    className="border-blue-200 text-blue-700 bg-blue-50"
                  >
                    Primary
                  </Badge>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-[#2C2C2C]/70">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wide text-[#2C2C2C]/70 pl-12">
            <span>
              Sub-categories:{" "}
              <span className="font-semibold text-[#2C2C2C]">{childCount}</span>
            </span>
            <span>
              Cost centres:{" "}
              <span className="font-semibold text-[#2C2C2C]">
                {costCenterCount}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(category)}
            className="border-gray-200 text-[#2C2C2C] hover:bg-gray-100 text-xs px-3"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(category.id)}
            className="border-red-200 text-red-600 hover:bg-red-50 text-xs px-3"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>
      {isExpanded && childCount > 0 && (
        <div className="pl-10 pr-4 pb-4 space-y-3">
          {children.map((child) => (
            <CategoryTree
              key={child.id}
              category={child}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
