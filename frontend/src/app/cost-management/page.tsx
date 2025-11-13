'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from '@/lib/api';
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
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TabType = 'categories' | 'centers' | 'interest' | 'party-interest';

export default function CostManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [interestProfiles, setInterestProfiles] = useState<InterestProfile[]>([]);
  const [partySettings, setPartySettings] = useState<PartyInterestSetting[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Category form state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CostCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CostCategoryInput>({
    name: '',
    description: '',
    parentId: null,
    isPrimary: false,
  });

  // Center form state
  const [centerDialogOpen, setCenterDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [centerForm, setCenterForm] = useState<CostCenterInput>({
    categoryId: '',
    name: '',
    code: '',
    description: '',
    parentId: null,
    isBillable: true,
    status: 'active',
  });

  // Interest profile form state
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [editingInterest, setEditingInterest] = useState<InterestProfile | null>(null);
  const [interestForm, setInterestForm] = useState<InterestProfileInput>({
    name: '',
    description: '',
    calculationMode: 'SIMPLE',
    rate: 0,
    compoundingFrequency: 'NONE',
    gracePeriodDays: null,
    calculateFromDueDate: true,
    penalRate: 0,
    penalGraceDays: null,
  });

  // Party interest form state
  const [partyInterestDialogOpen, setPartyInterestDialogOpen] = useState(false);
  const [partyInterestForm, setPartyInterestForm] = useState<PartyInterestInput>({
    partyId: '',
    interestProfileId: '',
    overrideRate: null,
    effectiveFrom: '',
    effectiveTo: '',
    applyOnReceivables: true,
    applyOnPayables: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, centersRes, interestRes, partyRes] = await Promise.all([
        apiClient.costing.listCategories(),
        apiClient.costing.listCenters(),
        apiClient.costing.listInterestProfiles(),
        apiClient.costing.listPartyInterestSettings(),
      ]);

      if (catsRes.success && catsRes.data) {
        setCategories(catsRes.data);
      }
      if (centersRes.success && centersRes.data) {
        setCenters(centersRes.data);
      }
      if (interestRes.success && interestRes.data) {
        setInterestProfiles(interestRes.data);
      }
      if (partyRes.success && partyRes.data) {
        setPartySettings(partyRes.data);
      }
    } catch (error) {
      console.error('Load cost management data error:', error);
      toast.error('Failed to load cost management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Category handlers
  const handleCreateCategory = async () => {
    try {
      const response = await apiClient.costing.createCategory(categoryForm);
      if (response.success && response.data) {
        toast.success('Cost category created successfully');
        setCategoryDialogOpen(false);
        resetCategoryForm();
        await loadData();
      } else {
        toast.error(response.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Create category error:', error);
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      const response = await apiClient.costing.updateCategory(editingCategory.id, categoryForm);
      if (response.success && response.data) {
        toast.success('Cost category updated successfully');
        setCategoryDialogOpen(false);
        setEditingCategory(null);
        resetCategoryForm();
        await loadData();
      } else {
        toast.error(response.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Update category error:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await apiClient.costing.deleteCategory(categoryId);
      if (response.success) {
        toast.success('Category deleted successfully');
        await loadData();
      } else {
        toast.error(response.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error('Failed to delete category');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      parentId: null,
      isPrimary: false,
    });
    setEditingCategory(null);
  };

  const openCategoryDialog = (category?: CostCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
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
      const response = await apiClient.costing.createCenter(centerForm);
      if (response.success && response.data) {
        toast.success('Cost center created successfully');
        setCenterDialogOpen(false);
        resetCenterForm();
        await loadData();
      } else {
        toast.error(response.error || 'Failed to create center');
      }
    } catch (error) {
      console.error('Create center error:', error);
      toast.error('Failed to create center');
    }
  };

  const handleUpdateCenter = async () => {
    if (!editingCenter) return;
    try {
      const response = await apiClient.costing.updateCenter(editingCenter.id, centerForm);
      if (response.success && response.data) {
        toast.success('Cost center updated successfully');
        setCenterDialogOpen(false);
        setEditingCenter(null);
        resetCenterForm();
        await loadData();
      } else {
        toast.error(response.error || 'Failed to update center');
      }
    } catch (error) {
      console.error('Update center error:', error);
      toast.error('Failed to update center');
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    if (!confirm('Are you sure you want to delete this cost center?')) return;
    try {
      const response = await apiClient.costing.deleteCenter(centerId);
      if (response.success) {
        toast.success('Cost center deleted successfully');
        await loadData();
      } else {
        toast.error(response.error || 'Failed to delete center');
      }
    } catch (error) {
      console.error('Delete center error:', error);
      toast.error('Failed to delete center');
    }
  };

  const resetCenterForm = () => {
    setCenterForm({
      categoryId: categories[0]?.id || '',
      name: '',
      code: '',
      description: '',
      parentId: null,
      isBillable: true,
      status: 'active',
    });
    setEditingCenter(null);
  };

  const openCenterDialog = (center?: CostCenter) => {
    if (center) {
      setEditingCenter(center);
      setCenterForm({
        categoryId: center.categoryId,
        name: center.name,
        code: center.code || '',
        description: center.description || '',
        parentId: center.parentId || null,
        isBillable: center.isBillable,
        status: center.status as 'active' | 'inactive',
      });
    } else {
      resetCenterForm();
    }
    setCenterDialogOpen(true);
  };

  // Interest profile handlers
  const handleCreateInterest = async () => {
    try {
      const response = await apiClient.costing.createInterestProfile(interestForm);
      if (response.success && response.data) {
        toast.success('Interest profile created successfully');
        setInterestDialogOpen(false);
        resetInterestForm();
        await loadData();
      } else {
        toast.error(response.error || 'Failed to create interest profile');
      }
    } catch (error) {
      console.error('Create interest profile error:', error);
      toast.error('Failed to create interest profile');
    }
  };

  const handleUpdateInterest = async () => {
    if (!editingInterest) return;
    try {
      const response = await apiClient.costing.updateInterestProfile(
        editingInterest.id,
        interestForm
      );
      if (response.success && response.data) {
        toast.success('Interest profile updated successfully');
        setInterestDialogOpen(false);
        setEditingInterest(null);
        resetInterestForm();
        await loadData();
      } else {
        toast.error(response.error || 'Failed to update interest profile');
      }
    } catch (error) {
      console.error('Update interest profile error:', error);
      toast.error('Failed to update interest profile');
    }
  };

  const handleDeleteInterest = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this interest profile?')) return;
    try {
      const response = await apiClient.costing.deleteInterestProfile(profileId);
      if (response.success) {
        toast.success('Interest profile deleted successfully');
        await loadData();
      } else {
        toast.error(response.error || 'Failed to delete interest profile');
      }
    } catch (error) {
      console.error('Delete interest profile error:', error);
      toast.error('Failed to delete interest profile');
    }
  };

  const resetInterestForm = () => {
    setInterestForm({
      name: '',
      description: '',
      calculationMode: 'SIMPLE',
      rate: 0,
      compoundingFrequency: 'NONE',
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
        description: profile.description || '',
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
      const response = await apiClient.costing.assignInterestToParty(partyInterestForm);
      if (response.success && response.data) {
        toast.success('Interest assigned to party successfully');
        setPartyInterestDialogOpen(false);
        resetPartyInterestForm();
        await loadData();
      } else {
        toast.error(response.error || 'Failed to assign interest');
      }
    } catch (error) {
      console.error('Assign interest error:', error);
      toast.error('Failed to assign interest');
    }
  };

  const handleRemoveInterest = async (partyId: string) => {
    if (!confirm('Are you sure you want to remove interest settings for this party?')) return;
    try {
      const response = await apiClient.costing.removeInterestForParty(partyId);
      if (response.success) {
        toast.success('Interest settings removed successfully');
        await loadData();
      } else {
        toast.error(response.error || 'Failed to remove interest settings');
      }
    } catch (error) {
      console.error('Remove interest error:', error);
      toast.error('Failed to remove interest settings');
    }
  };

  const resetPartyInterestForm = () => {
    setPartyInterestForm({
      partyId: '',
      interestProfileId: '',
      overrideRate: null,
      effectiveFrom: '',
      effectiveTo: '',
      applyOnReceivables: true,
      applyOnPayables: false,
    });
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
    const rootCategories = categories.filter((cat) => !cat.parentId);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cost Categories</h3>
          <Button onClick={() => openCategoryDialog()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
            No cost categories defined yet. Create your first category to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {rootCategories.map((category) => (
              <CategoryTree
                key={category.id}
                category={category}
                allCategories={categories}
                expanded={expandedCategories.has(category.id)}
                onToggle={() => toggleCategory(category.id)}
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
          <h3 className="text-lg font-semibold">Cost Centers</h3>
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
            No cost centers defined yet. Create your first center to get started.
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centers.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>{center.code || '-'}</TableCell>
                    <TableCell>{center.category?.name || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          center.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
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
          <h3 className="text-lg font-semibold">Interest Profiles</h3>
          <Button onClick={() => openInterestDialog()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Profile
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
          </div>
        ) : interestProfiles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
            No interest profiles defined yet. Create your first profile to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {interestProfiles.map((profile) => (
              <Card key={profile.id} className="rounded-xl border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{profile.name}</CardTitle>
                    {profile.description && (
                      <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInterestDialog(profile)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInterest(profile.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Rate:</span>{' '}
                      <span className="font-medium">{profile.rate}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mode:</span>{' '}
                      <span className="font-medium">{profile.calculationMode}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Compounding:</span>{' '}
                      <span className="font-medium">{profile.compoundingFrequency}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Grace Period:</span>{' '}
                      <span className="font-medium">
                        {profile.gracePeriodDays ?? 0} days
                      </span>
                    </div>
                    {profile.penalRate > 0 && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Penal Rate:</span>{' '}
                          <span className="font-medium">{profile.penalRate}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Penal Grace:</span>{' '}
                          <span className="font-medium">
                            {profile.penalGraceDays ?? 0} days
                          </span>
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

  const renderPartyInterestTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Party Interest Settings</h3>
          <Button
            onClick={() => setPartyInterestDialogOpen(true)}
            className="flex items-center gap-2"
            disabled={interestProfiles.length === 0}
          >
            <Plus className="h-4 w-4" /> Assign Interest
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
          </div>
        ) : partySettings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
            No party interest settings defined yet. Assign interest profiles to parties to get
            started.
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Party</TableHead>
                  <TableHead>Interest Profile</TableHead>
                  <TableHead>Override Rate</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partySettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">
                      {setting.party?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{setting.interestProfile?.name || '-'}</TableCell>
                    <TableCell>
                      {setting.overrideRate ? `${setting.overrideRate}%` : '-'}
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
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Cost Management</h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Manage cost centres, categories, and interest calculation settings.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { id: 'categories' as TabType, label: 'Categories', icon: Building2 },
              { id: 'centers' as TabType, label: 'Cost Centers', icon: Calculator },
              { id: 'interest' as TabType, label: 'Interest Profiles', icon: Settings },
              { id: 'party-interest' as TabType, label: 'Party Interest', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#607c47] text-[#607c47] font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
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
              {activeTab === 'categories' && renderCategoriesTab()}
              {activeTab === 'centers' && renderCentersTab()}
              {activeTab === 'interest' && renderInterestTab()}
              {activeTab === 'party-interest' && renderPartyInterestTab()}
            </CardContent>
          </Card>

          {/* Category Dialog */}
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Create Cost Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? 'Update the cost category details.'
                    : 'Create a new cost category for organizing expenses.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Category name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={categoryForm.description || ''}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <select
                    value={categoryForm.parentId || ''}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        parentId: e.target.value || null,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">None (Root Category)</option>
                    {categories
                      .filter((cat) => cat.id !== editingCategory?.id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
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
                      setCategoryForm({ ...categoryForm, isPrimary: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isPrimary" className="cursor-pointer">
                    Mark as Primary Category
                  </Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                    disabled={!categoryForm.name.trim()}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {editingCategory ? 'Update' : 'Create'}
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
                  {editingCenter ? 'Edit Cost Center' : 'Create Cost Center'}
                </DialogTitle>
                <DialogDescription>
                  {editingCenter
                    ? 'Update the cost center details.'
                    : 'Create a new cost center for tracking expenses.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <select
                    value={centerForm.categoryId}
                    onChange={(e) =>
                      setCenterForm({ ...centerForm, categoryId: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={centerForm.name}
                    onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                    placeholder="Cost center name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={centerForm.code || ''}
                    onChange={(e) => setCenterForm({ ...centerForm, code: e.target.value })}
                    placeholder="Optional code"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={centerForm.description || ''}
                    onChange={(e) =>
                      setCenterForm({ ...centerForm, description: e.target.value })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Center</Label>
                  <select
                    value={centerForm.parentId || ''}
                    onChange={(e) =>
                      setCenterForm({ ...centerForm, parentId: e.target.value || null })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
                      setCenterForm({ ...centerForm, isBillable: e.target.checked })
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
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setCenterDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={editingCenter ? handleUpdateCenter : handleCreateCenter}
                    disabled={!centerForm.name.trim() || !centerForm.categoryId}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {editingCenter ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Interest Profile Dialog */}
          <Dialog open={interestDialogOpen} onOpenChange={setInterestDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingInterest ? 'Edit Interest Profile' : 'Create Interest Profile'}
                </DialogTitle>
                <DialogDescription>
                  {editingInterest
                    ? 'Update the interest calculation profile.'
                    : 'Create a new interest profile for calculating interest on receivables/payables.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={interestForm.name}
                      onChange={(e) =>
                        setInterestForm({ ...interestForm, name: e.target.value })
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
                        setInterestForm({ ...interestForm, rate: Number(e.target.value) })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={interestForm.description || ''}
                    onChange={(e) =>
                      setInterestForm({ ...interestForm, description: e.target.value })
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
                          calculationMode: e.target.value as 'SIMPLE' | 'COMPOUND',
                        })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
                          compoundingFrequency: e.target.value as any,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
                      value={interestForm.gracePeriodDays || ''}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          gracePeriodDays: e.target.value ? Number(e.target.value) : null,
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
                      value={interestForm.penalRate || 0}
                      onChange={(e) =>
                        setInterestForm({ ...interestForm, penalRate: Number(e.target.value) })
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
                      value={interestForm.penalGraceDays || ''}
                      onChange={(e) =>
                        setInterestForm({
                          ...interestForm,
                          penalGraceDays: e.target.value ? Number(e.target.value) : null,
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
                    <Label htmlFor="calculateFromDueDate" className="cursor-pointer">
                      Calculate from due date
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setInterestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={editingInterest ? handleUpdateInterest : handleCreateInterest}
                    disabled={!interestForm.name.trim()}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {editingInterest ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Party Interest Dialog */}
          <Dialog open={partyInterestDialogOpen} onOpenChange={setPartyInterestDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Interest to Party</DialogTitle>
                <DialogDescription>
                  Assign an interest profile to a party for automatic interest calculation.
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
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select profile</option>
                    {interestProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} ({profile.rate}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Party ID *</Label>
                  <Input
                    value={partyInterestForm.partyId}
                    onChange={(e) =>
                      setPartyInterestForm({ ...partyInterestForm, partyId: e.target.value })
                    }
                    placeholder="Enter party ID"
                  />
                  <p className="text-xs text-muted-foreground">
                    Note: Party lookup will be added in a future update
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Override Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={partyInterestForm.overrideRate || ''}
                    onChange={(e) =>
                      setPartyInterestForm({
                        ...partyInterestForm,
                        overrideRate: e.target.value ? Number(e.target.value) : null,
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
                      value={partyInterestForm.effectiveFrom || ''}
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
                      value={partyInterestForm.effectiveTo || ''}
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
                      <Label htmlFor="applyOnReceivables" className="cursor-pointer">
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
                      <Label htmlFor="applyOnPayables" className="cursor-pointer">
                        Payables
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setPartyInterestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignInterest}
                    disabled={
                      !partyInterestForm.partyId.trim() ||
                      !partyInterestForm.interestProfileId.trim()
                    }
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    Assign
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
  allCategories,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  category: CostCategory;
  allCategories: CostCategory[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: (cat: CostCategory) => void;
  onDelete: (id: string) => void;
}) {
  const children = allCategories.filter((cat) => cat.parentId === category.id);

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-3 bg-gray-50">
        <div className="flex items-center gap-2 flex-1">
          {children.length > 0 ? (
            <button onClick={onToggle} className="p-1 hover:bg-gray-200 rounded">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <span className="font-medium">{category.name}</span>
          {category.isPrimary && (
            <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
              Primary
            </span>
          )}
          {category.description && (
            <span className="text-sm text-muted-foreground">- {category.description}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category.id)}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {expanded && children.length > 0 && (
        <div className="pl-8 border-t border-gray-200">
          {children.map((child) => (
            <CategoryTree
              key={child.id}
              category={child}
              allCategories={allCategories}
              expanded={false}
              onToggle={() => {}}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

