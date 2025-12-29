"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth";
import {
  apiClient,
  CompanyProfile,
  CompanyProfileInput,
  CompanyAddressInput,
  CompanyFiscalConfig,
  CompanyFiscalInput,
  CompanySecurityConfig,
  CompanySecurityInput,
  CompanyCurrencyConfig,
  CompanyCurrencyInput,
  CompanyFeatureToggle,
  CompanyFeatureToggleInput,
  VoucherType,
  VoucherTypeInput,
  VoucherTypeUpdateInput,
  VoucherCategory,
  VoucherNumberingMethod,
  VoucherNumberingBehavior,
} from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
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
  User,
  Shield,
  Trash2,
  Settings,
  Link,
  Plus,
  Building2,
  Loader2,
  IndianRupee,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import PlaidLink from "@/components/ui/PlaidLink";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface AddressForm extends Omit<
  CompanyAddressInput,
  "isPrimary" | "isBilling" | "isShipping"
> {
  isPrimary?: boolean;
  isBilling?: boolean;
  isShipping?: boolean;
}

const emptyAddress: AddressForm = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  isPrimary: false,
  isBilling: false,
  isShipping: false,
};

const mapProfileToForm = (
  profile: CompanyProfile | null,
  fallbackName?: string
): CompanyProfileInput & { addresses: AddressForm[] } => {
  if (!profile) {
    return {
      displayName: fallbackName ?? "",
      legalName: "",
      mailingName: "",
      baseCurrency: "INR",
      country: "",
      state: "",
      city: "",
      postalCode: "",
      phone: "",
      mobile: "",
      email: "",
      website: "",
      addresses: [],
    };
  }

  return {
    displayName: profile.displayName || fallbackName || "",
    legalName: profile.legalName || "",
    mailingName: profile.mailingName || "",
    baseCurrency: profile.baseCurrency || "INR",
    country: profile.country || "",
    state: profile.state || "",
    city: profile.city || "",
    postalCode: profile.postalCode || "",
    phone: profile.phone || "",
    mobile: profile.mobile || "",
    email: profile.email || "",
    website: profile.website || "",
    addresses: (profile.addresses || []).map((address) => ({
      id: address.id,
      label: address.label || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "",
      postalCode: address.postalCode || "",
      isPrimary: address.isPrimary,
      isBilling: address.isBilling,
      isShipping: address.isShipping,
    })),
  };
};

interface FiscalForm {
  financialYearStart: string;
  booksStart: string;
  allowBackdatedEntries: boolean;
  backdatedFrom?: string;
  enableEditLog: boolean;
}

interface CurrencyForm {
  baseCurrencyCode: string;
  baseCurrencySymbol: string;
  baseCurrencyFormalName: string;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandSeparator: string;
  symbolOnRight: boolean;
  spaceBetweenAmountAndSymbol: boolean;
  showAmountInMillions: boolean;
}

interface SecurityForm {
  tallyVaultEnabled: boolean;
  initialTallyVaultEnabled: boolean;
  userAccessControlEnabled: boolean;
  multiFactorRequired: boolean;
  tallyVaultPasswordHint: string;
  newPassword: string;
  confirmNewPassword: string;
  currentPassword: string;
}

interface FeatureToggleForm {
  enableAccounting: boolean;
  enableInventory: boolean;
  enableTaxation: boolean;
  enablePayroll: boolean;
  enableAIInsights: boolean;
  enableScenarioPlanning: boolean;
  enableAutomations: boolean;
  enableVendorManagement: boolean;
  enableBillingAndInvoicing: boolean;
}

const voucherCategoryOptions: Array<{ value: VoucherCategory; label: string }> =
  [
    { value: "PAYMENT", label: "Payment" },
    { value: "RECEIPT", label: "Receipt" },
    { value: "CONTRA", label: "Contra" },
    { value: "JOURNAL", label: "Journal" },
    { value: "SALES", label: "Sales" },
    { value: "PURCHASE", label: "Purchase" },
    { value: "DEBIT_NOTE", label: "Debit Note" },
    { value: "CREDIT_NOTE", label: "Credit Note" },
    { value: "MEMO", label: "Memo" },
    { value: "REVERSING_JOURNAL", label: "Reversing Journal" },
    { value: "OPTIONAL", label: "Optional" },
    { value: "DELIVERY_NOTE", label: "Delivery Note" },
    { value: "RECEIPT_NOTE", label: "Receipt Note" },
    { value: "REJECTION_IN", label: "Rejection In" },
    { value: "REJECTION_OUT", label: "Rejection Out" },
    { value: "STOCK_JOURNAL", label: "Stock Journal" },
    { value: "PHYSICAL_STOCK", label: "Physical Stock" },
    { value: "JOB_WORK_IN", label: "Job Work In" },
    { value: "JOB_WORK_OUT", label: "Job Work Out" },
    { value: "MATERIAL_IN", label: "Material In" },
    { value: "MATERIAL_OUT", label: "Material Out" },
  ];

const numberingMethodOptions: Array<{
  value: VoucherNumberingMethod;
  label: string;
}> = [
  { value: "AUTOMATIC", label: "Automatic" },
  { value: "AUTOMATIC_WITH_OVERRIDE", label: "Automatic (Manual Override)" },
  { value: "MULTI_USER_AUTO", label: "Multi-user Automatic" },
  { value: "MANUAL", label: "Manual" },
  { value: "NONE", label: "None" },
];

const numberingBehaviorOptions: Array<{
  value: VoucherNumberingBehavior;
  label: string;
}> = [
  { value: "RENUMBER", label: "Renumber on insert/delete" },
  { value: "RETAIN", label: "Retain original numbers" },
];

type SettingsTabId = "general" | "financial" | "security" | "billing";

const settingsTabs: Array<{
  id: SettingsTabId;
  label: string;
  description: string;
}> = [
  {
    id: "general",
    label: "General",
    description:
      "Company identity, contacts, addresses, and banking connections.",
  },
  {
    id: "financial",
    label: "Financial",
    description:
      "Fiscal periods, base currency, and voucher numbering structure.",
  },
  {
    id: "security",
    label: "Security",
    description: "Vault encryption and workspace access controls.",
  },
  {
    id: "billing",
    label: "Billing & Subscription",
    description: "Module entitlements and feature-level subscriptions.",
  },
];

const subscriptionPlanCatalog: Record<
  string,
  {
    label: string;
    subLabel: string;
    priceSummary: string;
    seatSummary: string;
    description: string;
    features: string[];
    isEarlybird?: boolean;
  }
> = {
  starter_earlybird: {
    label: "Startup (Free Earlybird)",
    subLabel: "$50/mo value: locked-in for early adopters",
    priceSummary: "$0 during showcase",
    seatSummary: "Includes 1 admin + up to 5 role-based collaborators",
    description:
      "Full Starter pack capabilities at no cost until public launch.",
    features: [
      "Accounting, inventory & cost centers",
      "GST/statutory workflows",
      "AI anomaly detection & insights",
      "End-to-end vouchers, bills & settlements",
      "Tally / Excel import-export utilities",
    ],
    isEarlybird: true,
  },
  starter: {
    label: "Startup",
    subLabel: "$50/month billed monthly",
    priceSummary: "$50/mo",
    seatSummary: "Includes 1 admin + up to 5 role-based collaborators",
    description: "All core finance & AI workflows for growing teams.",
    features: [
      "Accounting, inventory & cost centers",
      "GST/statutory workflows",
      "AI anomaly detection & insights",
      "End-to-end vouchers, bills & settlements",
      "Tally / Excel import-export utilities",
    ],
  },
  pro: {
    label: "Scale",
    subLabel: "$129/month billed monthly",
    priceSummary: "$129/mo",
    seatSummary: "Includes 2 admins + up to 15 role-based collaborators",
    description: "Advanced approvals, automations and higher limits.",
    features: [
      "Everything in Startup",
      "Advanced approval flows",
      "Bank sync automations",
      "Dedicated success manager",
    ],
  },
  enterprise: {
    label: "Enterprise",
    subLabel: "Custom pricing",
    priceSummary: "Talk to us",
    seatSummary: "Includes 3 admins + up to 30 role-based collaborators",
    description: "Custom controls, SSO, and enterprise support SLAs.",
    features: [
      "Everything in Scale",
      "Custom AI workflows & alerts",
      "Enterprise security (SSO, SCIM)",
      "Dedicated pods with SLAs",
    ],
  },
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 10);
};

const mapFiscalToForm = (fiscal: CompanyFiscalConfig | null): FiscalForm => {
  const today = new Date();
  const defaultFinancialYearStart = () => {
    const year =
      today.getUTCMonth() >= 3
        ? today.getUTCFullYear()
        : today.getUTCFullYear() - 1;
    return new Date(Date.UTC(year, 3, 1)).toISOString();
  };

  if (!fiscal) {
    const financialYearStart = defaultFinancialYearStart();
    return {
      financialYearStart: toDateInputValue(financialYearStart),
      booksStart: toDateInputValue(today.toISOString()),
      allowBackdatedEntries: true,
      backdatedFrom: toDateInputValue(financialYearStart),
      enableEditLog: false,
    };
  }

  return {
    financialYearStart: toDateInputValue(fiscal.financialYearStart),
    booksStart: toDateInputValue(fiscal.booksStart),
    allowBackdatedEntries: fiscal.allowBackdatedEntries,
    backdatedFrom: fiscal.backdatedFrom
      ? toDateInputValue(fiscal.backdatedFrom)
      : "",
    enableEditLog: fiscal.enableEditLog,
  };
};

const toISOStringWithUTC = (value: string) => {
  if (!value) {
    throw new Error("Date value required");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date value");
  }
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  ).toISOString();
};

const mapSecurityToForm = (
  security: CompanySecurityConfig | null
): SecurityForm => ({
  tallyVaultEnabled: security?.tallyVaultEnabled ?? false,
  initialTallyVaultEnabled: security?.tallyVaultEnabled ?? false,
  userAccessControlEnabled: security?.userAccessControlEnabled ?? false,
  multiFactorRequired: security?.multiFactorRequired ?? false,
  tallyVaultPasswordHint: security?.tallyVaultPasswordHint || "",
  newPassword: "",
  confirmNewPassword: "",
  currentPassword: "",
});

const mapCurrencyToForm = (
  currency: CompanyCurrencyConfig | null
): CurrencyForm => ({
  baseCurrencyCode: currency?.baseCurrencyCode || "INR",
  baseCurrencySymbol: currency?.baseCurrencySymbol || "₹",
  baseCurrencyFormalName: currency?.baseCurrencyFormalName || "Indian Rupee",
  decimalPlaces: currency?.decimalPlaces ?? 2,
  decimalSeparator: currency?.decimalSeparator || ".",
  thousandSeparator: currency?.thousandSeparator || ",",
  symbolOnRight: currency?.symbolOnRight ?? false,
  spaceBetweenAmountAndSymbol: currency?.spaceBetweenAmountAndSymbol ?? false,
  showAmountInMillions: currency?.showAmountInMillions ?? false,
});

const mapFeatureToggleToForm = (
  toggle: CompanyFeatureToggle | null
): FeatureToggleForm => ({
  enableAccounting: toggle?.enableAccounting ?? true,
  enableInventory: toggle?.enableInventory ?? true,
  enableTaxation: toggle?.enableTaxation ?? true,
  enablePayroll: toggle?.enablePayroll ?? false,
  enableAIInsights: toggle?.enableAIInsights ?? true,
  enableScenarioPlanning: toggle?.enableScenarioPlanning ?? true,
  enableAutomations: toggle?.enableAutomations ?? false,
  enableVendorManagement: toggle?.enableVendorManagement ?? false,
  enableBillingAndInvoicing: toggle?.enableBillingAndInvoicing ?? true,
});

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTabId>("general");
  const [plaidItems, setPlaidItems] = useState<any[]>([]);
  const [profileForm, setProfileForm] = useState<
    (CompanyProfileInput & { addresses: AddressForm[] }) | null
  >(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [fiscalForm, setFiscalForm] = useState<FiscalForm | null>(null);
  const [fiscalLoading, setFiscalLoading] = useState(true);
  const [fiscalSaving, setFiscalSaving] = useState(false);
  const [securityForm, setSecurityForm] = useState<SecurityForm | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [currencyForm, setCurrencyForm] = useState<CurrencyForm | null>(null);
  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [currencySaving, setCurrencySaving] = useState(false);
  const [featureForm, setFeatureForm] = useState<FeatureToggleForm | null>(
    null
  );
  const [featureLoading, setFeatureLoading] = useState(true);
  const [featureSaving, setFeatureSaving] = useState(false);
  const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(true);
  const [voucherSaving, setVoucherSaving] = useState<Record<string, boolean>>(
    {}
  );
  const [newVoucherType, setNewVoucherType] = useState<
    VoucherTypeInput & {
      prefix?: string;
      suffix?: string;
      abbreviation?: string;
    }
  >({
    name: "",
    abbreviation: "",
    category: "PAYMENT",
    numberingMethod: "AUTOMATIC",
    numberingBehavior: "RENUMBER",
    prefix: "",
    suffix: "",
    allowManualOverride: false,
    allowDuplicateNumbers: false,
  });
  const [seriesDrafts, setSeriesDrafts] = useState<
    Record<string, { name: string; prefix: string; suffix: string }>
  >({});

  const hasAddresses = useMemo(
    () => (profileForm?.addresses?.length ?? 0) > 0,
    [profileForm]
  );

  useEffect(() => {
    fetchPlaidItems();
    loadCompanyData();
  }, []);

  const fetchPlaidItems = async () => {
    setPlaidItems([
      { id: "1", institutionName: "Bank of America", accounts: { length: 2 } },
      { id: "2", institutionName: "Chase", accounts: { length: 1 } },
    ]);
  };

  const loadCompanyData = async () => {
    try {
      setProfileLoading(true);
      setFiscalLoading(true);
      setSecurityLoading(true);
      setCurrencyLoading(true);
      setFeatureLoading(true);
      const [
        profileResponse,
        fiscalResponse,
        securityResponse,
        currencyResponse,
        featureResponse,
        voucherResponse,
      ] = await Promise.all([
        apiClient.company.getProfile(),
        apiClient.company.getFiscal(),
        apiClient.company.getSecurity(),
        apiClient.company.getCurrency(),
        apiClient.company.getFeatureToggles(),
        apiClient.vouchers.listTypes(),
      ]);
      const fallbackName = user?.startup?.name;
      if (profileResponse.success) {
        setProfileForm(
          mapProfileToForm(profileResponse.data || null, fallbackName)
        );
      } else {
        setProfileForm(mapProfileToForm(null, fallbackName));
        toast.error(profileResponse.error || "Failed to load company profile");
      }

      if (fiscalResponse.success) {
        setFiscalForm(mapFiscalToForm(fiscalResponse.data || null));
      } else {
        setFiscalForm(mapFiscalToForm(null));
        toast.error(
          fiscalResponse.error || "Failed to load fiscal configuration"
        );
      }

      if (securityResponse.success) {
        setSecurityForm(mapSecurityToForm(securityResponse.data || null));
      } else {
        setSecurityForm(mapSecurityToForm(null));
        toast.error(
          securityResponse.error || "Failed to load security configuration"
        );
      }

      if (currencyResponse.success) {
        setCurrencyForm(mapCurrencyToForm(currencyResponse.data || null));
      } else {
        setCurrencyForm(mapCurrencyToForm(null));
        toast.error(
          currencyResponse.error || "Failed to load currency configuration"
        );
      }

      if (featureResponse.success) {
        setFeatureForm(mapFeatureToggleToForm(featureResponse.data || null));
      } else {
        setFeatureForm(mapFeatureToggleToForm(null));
        toast.error(
          featureResponse.error || "Failed to load feature configuration"
        );
      }

      if (voucherResponse.success) {
        const items = voucherResponse.data ?? [];
        setVoucherTypes(items);
        const draftMap: Record<
          string,
          { name: string; prefix: string; suffix: string }
        > = {};
        items.forEach((type) => {
          draftMap[type.id] = { name: "", prefix: "", suffix: "" };
        });
        setSeriesDrafts(draftMap);
      } else {
        setVoucherTypes([]);
        setSeriesDrafts({});
        toast.error(
          voucherResponse.error || "Failed to load voucher configuration"
        );
      }
    } catch (error) {
      console.error("Failed to load company settings:", error);
      setProfileForm(mapProfileToForm(null, user?.startup?.name));
      setFiscalForm(mapFiscalToForm(null));
      setSecurityForm(mapSecurityToForm(null));
      setCurrencyForm(mapCurrencyToForm(null));
      setFeatureForm(mapFeatureToggleToForm(null));
      setVoucherTypes([]);
      setSeriesDrafts({});
      toast.error("Unable to load company settings");
    } finally {
      setProfileLoading(false);
      setFiscalLoading(false);
      setSecurityLoading(false);
      setCurrencyLoading(false);
      setFeatureLoading(false);
      setVoucherLoading(false);
    }
  };
  const syncVoucherTypes = (items: VoucherType[]) => {
    setVoucherTypes(items);
    const drafts: Record<
      string,
      { name: string; prefix: string; suffix: string }
    > = {};
    items.forEach((type) => {
      drafts[type.id] = { name: "", prefix: "", suffix: "" };
    });
    setSeriesDrafts(drafts);
  };

  const refreshVoucherTypes = async () => {
    try {
      setVoucherLoading(true);
      const response = await apiClient.vouchers.listTypes();
      if (response.success && response.data) {
        syncVoucherTypes(response.data);
      } else {
        syncVoucherTypes([]);
        if (!response.success) {
          toast.error(response.error || "Failed to load voucher types");
        }
      }
    } catch (error) {
      console.error("Refresh voucher types error:", error);
      syncVoucherTypes([]);
      toast.error("Unable to load voucher types");
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleVoucherTypeFieldChange = <K extends keyof VoucherType>(
    voucherTypeId: string,
    field: K,
    value: VoucherType[K]
  ) => {
    setVoucherTypes((prev) =>
      prev.map((type) =>
        type.id === voucherTypeId
          ? ({
              ...type,
              [field]: value,
            } as VoucherType)
          : type
      )
    );
  };

  const handleVoucherTypeSave = async (voucherTypeId: string) => {
    const voucherType = voucherTypes.find((type) => type.id === voucherTypeId);
    if (!voucherType) return;

    const payload: VoucherTypeUpdateInput = {
      abbreviation: voucherType.abbreviation ?? null,
      numberingMethod: voucherType.numberingMethod,
      numberingBehavior: voucherType.numberingBehavior,
      prefix: voucherType.prefix ?? null,
      suffix: voucherType.suffix ?? null,
      allowManualOverride: voucherType.allowManualOverride,
      allowDuplicateNumbers: voucherType.allowDuplicateNumbers,
      nextNumber: voucherType.nextNumber,
    };

    setVoucherSaving((prev) => ({ ...prev, [voucherTypeId]: true }));
    try {
      const response = await apiClient.vouchers.updateType(
        voucherTypeId,
        payload
      );
      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to update voucher type");
        return;
      }
      await refreshVoucherTypes();
      toast.success("Voucher type updated");
    } catch (error) {
      console.error("Save voucher type error:", error);
      toast.error("Unable to update voucher type");
    } finally {
      setVoucherSaving((prev) => ({ ...prev, [voucherTypeId]: false }));
    }
  };

  const handleGenerateNextNumber = async (
    voucherTypeId: string,
    numberingSeriesId?: string
  ) => {
    setVoucherSaving((prev) => ({ ...prev, [voucherTypeId]: true }));
    try {
      const response = await apiClient.vouchers.generateNextNumber(
        voucherTypeId,
        numberingSeriesId
      );
      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to generate voucher number");
        return;
      }
      toast.success(`Next voucher number: ${response.data.voucherNumber}`);
      await refreshVoucherTypes();
    } catch (error) {
      console.error("Generate voucher number error:", error);
      toast.error("Unable to generate voucher number");
    } finally {
      setVoucherSaving((prev) => ({ ...prev, [voucherTypeId]: false }));
    }
  };

  const handleNewVoucherTypeChange = <K extends keyof typeof newVoucherType>(
    field: K,
    value: (typeof newVoucherType)[K]
  ) => {
    setNewVoucherType((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateVoucherType = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!newVoucherType.name.trim()) {
      toast.error("Voucher type name is required");
      return;
    }

    try {
      setVoucherLoading(true);
      const response = await apiClient.vouchers.createType({
        name: newVoucherType.name.trim(),
        abbreviation: newVoucherType.abbreviation?.trim() || undefined,
        category: newVoucherType.category,
        numberingMethod: newVoucherType.numberingMethod,
        numberingBehavior: newVoucherType.numberingBehavior,
        prefix: newVoucherType.prefix?.trim() || undefined,
        suffix: newVoucherType.suffix?.trim() || undefined,
        allowManualOverride: newVoucherType.allowManualOverride,
        allowDuplicateNumbers: newVoucherType.allowDuplicateNumbers,
      });

      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to create voucher type");
        return;
      }

      setNewVoucherType({
        name: "",
        abbreviation: "",
        category: "PAYMENT",
        numberingMethod: "AUTOMATIC",
        numberingBehavior: "RENUMBER",
        prefix: "",
        suffix: "",
        allowManualOverride: false,
        allowDuplicateNumbers: false,
      });

      await refreshVoucherTypes();
      toast.success("Voucher type created");
    } catch (error) {
      console.error("Create voucher type error:", error);
      toast.error("Unable to create voucher type");
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleSeriesDraftChange = (
    voucherTypeId: string,
    field: "name" | "prefix" | "suffix",
    value: string
  ) => {
    setSeriesDrafts((prev) => ({
      ...prev,
      [voucherTypeId]: {
        ...(prev[voucherTypeId] ?? { name: "", prefix: "", suffix: "" }),
        [field]: value,
      },
    }));
  };

  const handleCreateSeries = async (voucherTypeId: string) => {
    const draft = seriesDrafts[voucherTypeId];
    if (!draft || !draft.name.trim()) {
      toast.error("Series name is required");
      return;
    }

    setVoucherSaving((prev) => ({ ...prev, [voucherTypeId]: true }));
    try {
      const response = await apiClient.vouchers.createSeries(voucherTypeId, {
        name: draft.name.trim(),
        prefix: draft.prefix?.trim() || undefined,
        suffix: draft.suffix?.trim() || undefined,
      });

      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to create numbering series");
        return;
      }

      toast.success("Numbering series created");
      await refreshVoucherTypes();
      setSeriesDrafts((prev) => ({
        ...prev,
        [voucherTypeId]: { name: "", prefix: "", suffix: "" },
      }));
    } catch (error) {
      console.error("Create numbering series error:", error);
      toast.error("Unable to create numbering series");
    } finally {
      setVoucherSaving((prev) => ({ ...prev, [voucherTypeId]: false }));
    }
  };

  const handlePlaidSuccess = () => {
    toast.success("Account connected! Refreshing...");
    setTimeout(fetchPlaidItems, 1000);
  };

  const handleDisconnectBank = async (plaidItemId: string) => {
    toast.success("Bank account disconnected.");
    setPlaidItems(plaidItems.filter((item) => item.id !== plaidItemId));
  };

  const handleProfileFieldChange = (
    field: keyof CompanyProfileInput,
    value: string
  ) => {
    setProfileForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddressChange = (
    index: number,
    field: keyof AddressForm,
    value: string | boolean
  ) => {
    setProfileForm((prev) => {
      if (!prev) return prev;
      const addresses = prev.addresses ? [...prev.addresses] : [];
      const current = addresses[index] || { ...emptyAddress };
      addresses[index] = { ...current, [field]: value } as AddressForm;
      return { ...prev, addresses };
    });
  };

  const handleAddAddress = () => {
    setProfileForm((prev) => {
      if (!prev) return prev;
      const addresses = prev.addresses ? [...prev.addresses] : [];
      addresses.push({ ...emptyAddress, isPrimary: addresses.length === 0 });
      return { ...prev, addresses };
    });
  };

  const handleRemoveAddress = (index: number) => {
    setProfileForm((prev) => {
      if (!prev) return prev;
      const addresses = prev.addresses ? [...prev.addresses] : [];
      addresses.splice(index, 1);
      if (addresses.length > 0 && !addresses.some((addr) => addr.isPrimary)) {
        addresses[0].isPrimary = true;
      }
      return { ...prev, addresses };
    });
  };

  const handleAddressToggle = (
    index: number,
    field: "isPrimary" | "isBilling" | "isShipping"
  ) => {
    setProfileForm((prev) => {
      if (!prev) return prev;
      const addresses = prev.addresses ? [...prev.addresses] : [];
      const current = addresses[index] || { ...emptyAddress };

      if (field === "isPrimary") {
        const updated = addresses.map((addr, idx) => ({
          ...addr,
          isPrimary: idx === index,
        }));
        return { ...prev, addresses: updated };
      }

      addresses[index] = {
        ...current,
        [field]: !current[field],
      } as AddressForm;
      return { ...prev, addresses };
    });
  };

  const handleProfileSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!profileForm) return;

    try {
      setProfileSaving(true);
      const payload: CompanyProfileInput = {
        ...profileForm,
        addresses: (profileForm.addresses || []).map((address) => ({
          id: address.id,
          label: address.label?.trim() || undefined,
          line1: address.line1,
          line2: address.line2?.trim() || undefined,
          city: address.city?.trim() || undefined,
          state: address.state?.trim() || undefined,
          country: address.country?.trim() || undefined,
          postalCode: address.postalCode?.trim() || undefined,
          isPrimary: !!address.isPrimary,
          isBilling: !!address.isBilling,
          isShipping: !!address.isShipping,
        })),
      };

      const response = await apiClient.company.updateProfile(payload);
      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to update company profile");
        return;
      }

      setProfileForm(mapProfileToForm(response.data, user?.startup?.name));
      if (user) {
        setUser({
          ...user,
          startup: {
            ...user.startup,
            companyProfile: response.data,
          },
        });
      }

      toast.success("Company profile updated successfully");
    } catch (error) {
      console.error("Update company profile error:", error);
      toast.error("Unable to update company profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFiscalFieldChange = (
    field: keyof FiscalForm,
    value: string | boolean
  ) => {
    setFiscalForm((prev) => {
      if (!prev) return prev;
      if (field === "allowBackdatedEntries") {
        const allow = Boolean(value);
        return {
          ...prev,
          allowBackdatedEntries: allow,
          backdatedFrom: allow
            ? prev.backdatedFrom || prev.financialYearStart
            : "",
        };
      }
      if (field === "financialYearStart" && typeof value === "string") {
        return {
          ...prev,
          financialYearStart: value,
          backdatedFrom:
            prev.allowBackdatedEntries &&
            (!prev.backdatedFrom ||
              prev.backdatedFrom === prev.financialYearStart)
              ? value
              : prev.backdatedFrom,
        };
      }
      return { ...prev, [field]: value } as FiscalForm;
    });
  };

  const handleFiscalSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!fiscalForm) return;

    try {
      setFiscalSaving(true);
      const payload: CompanyFiscalInput = {
        financialYearStart: toISOStringWithUTC(fiscalForm.financialYearStart),
        booksStart: toISOStringWithUTC(fiscalForm.booksStart),
        allowBackdatedEntries: fiscalForm.allowBackdatedEntries,
        backdatedFrom:
          fiscalForm.allowBackdatedEntries && fiscalForm.backdatedFrom
            ? toISOStringWithUTC(fiscalForm.backdatedFrom)
            : null,
        enableEditLog: fiscalForm.enableEditLog,
      };

      const response = await apiClient.company.updateFiscal(payload);
      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to update fiscal configuration");
        return;
      }

      setFiscalForm(mapFiscalToForm(response.data));
      if (user) {
        setUser({
          ...user,
          startup: {
            ...user.startup,
            fiscalConfig: response.data,
          },
        });
      }

      toast.success("Fiscal configuration updated successfully");
    } catch (error) {
      console.error("Update fiscal configuration error:", error);
      toast.error("Unable to update fiscal configuration");
    } finally {
      setFiscalSaving(false);
    }
  };

  const handleSecurityFieldChange = <K extends keyof SecurityForm>(
    field: K,
    value: SecurityForm[K]
  ) => {
    setSecurityForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSecuritySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!securityForm) return;

    const {
      tallyVaultEnabled,
      initialTallyVaultEnabled,
      userAccessControlEnabled,
      multiFactorRequired,
      tallyVaultPasswordHint,
      newPassword,
      confirmNewPassword,
      currentPassword,
    } = securityForm;

    const enablingTallyVault = !initialTallyVaultEnabled && tallyVaultEnabled;
    const disablingTallyVault = initialTallyVaultEnabled && !tallyVaultEnabled;
    const rotatingPassword =
      initialTallyVaultEnabled &&
      tallyVaultEnabled &&
      newPassword.trim().length > 0;

    try {
      if (enablingTallyVault) {
        if (!newPassword.trim() || !confirmNewPassword.trim()) {
          toast.error(
            "Provide and confirm a vault password to enable encryption."
          );
          return;
        }
        if (newPassword !== confirmNewPassword) {
          toast.error("Vault passwords do not match.");
          return;
        }
      }

      if (disablingTallyVault && !currentPassword.trim()) {
        toast.error(
          "Current vault password is required to disable encryption."
        );
        return;
      }

      if (rotatingPassword) {
        if (newPassword !== confirmNewPassword) {
          toast.error("Vault passwords do not match.");
          return;
        }
        if (!currentPassword.trim()) {
          toast.error(
            "Current vault password is required to rotate encryption password."
          );
          return;
        }
      }

      const payload: CompanySecurityInput = {
        tallyVaultEnabled,
        userAccessControlEnabled,
        multiFactorRequired,
        tallyVaultPasswordHint: tallyVaultPasswordHint.trim()
          ? tallyVaultPasswordHint.trim()
          : null,
      };

      if (enablingTallyVault || rotatingPassword) {
        payload.newTallyVaultPassword = newPassword;
      }

      if (disablingTallyVault || rotatingPassword) {
        payload.currentTallyVaultPassword = currentPassword.trim() || undefined;
      }

      setSecuritySaving(true);
      const response = await apiClient.company.updateSecurity(payload);
      if (!response.success || !response.data) {
        toast.error(
          response.error || "Failed to update security configuration"
        );
        return;
      }

      const updatedConfig = response.data;
      setSecurityForm({
        ...mapSecurityToForm(updatedConfig),
        initialTallyVaultEnabled: updatedConfig.tallyVaultEnabled,
      });

      if (user) {
        setUser({
          ...user,
          startup: {
            ...user.startup,
            securityConfig: updatedConfig,
          },
        });
      }

      toast.success("Security configuration updated successfully");
    } catch (error) {
      console.error("Update security configuration error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update security configuration"
      );
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleCurrencyFieldChange = <K extends keyof CurrencyForm>(
    field: K,
    value: CurrencyForm[K]
  ) => {
    setCurrencyForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleCurrencySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!currencyForm) return;

    const {
      baseCurrencyCode,
      baseCurrencySymbol,
      baseCurrencyFormalName,
      decimalPlaces,
      decimalSeparator,
      thousandSeparator,
      symbolOnRight,
      spaceBetweenAmountAndSymbol,
      showAmountInMillions,
    } = currencyForm;

    if (!baseCurrencyCode.trim()) {
      toast.error("Base currency code is required");
      return;
    }

    if (!baseCurrencySymbol.trim()) {
      toast.error("Currency symbol is required");
      return;
    }

    const payload: CompanyCurrencyInput = {
      baseCurrencyCode: baseCurrencyCode.trim().toUpperCase(),
      baseCurrencySymbol: baseCurrencySymbol.trim(),
      baseCurrencyFormalName: baseCurrencyFormalName.trim() || undefined,
      decimalPlaces: Number.isFinite(decimalPlaces) ? Number(decimalPlaces) : 2,
      decimalSeparator: decimalSeparator ? decimalSeparator.slice(0, 1) : ".",
      thousandSeparator: thousandSeparator
        ? thousandSeparator.slice(0, 1)
        : ",",
      symbolOnRight,
      spaceBetweenAmountAndSymbol,
      showAmountInMillions,
    };

    setCurrencySaving(true);
    try {
      const response = await apiClient.company.updateCurrency(payload);
      if (!response.success || !response.data) {
        toast.error(
          response.error || "Failed to update currency configuration"
        );
        return;
      }

      const updatedConfig = response.data;
      setCurrencyForm(mapCurrencyToForm(updatedConfig));
      setProfileForm((prev) =>
        prev ? { ...prev, baseCurrency: updatedConfig.baseCurrencyCode } : prev
      );

      if (user) {
        const updatedCompanyProfile = user.startup?.companyProfile
          ? {
              ...user.startup.companyProfile,
              baseCurrency: updatedConfig.baseCurrencyCode,
            }
          : user.startup?.companyProfile;

        setUser({
          ...user,
          startup: {
            ...user.startup,
            currencyConfig: updatedConfig,
            companyProfile: updatedCompanyProfile,
          },
        });
      }

      toast.success("Currency configuration updated successfully");
    } catch (error) {
      console.error("Update currency configuration error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update currency configuration"
      );
    } finally {
      setCurrencySaving(false);
    }
  };

  const handleFeatureFieldChange = <K extends keyof FeatureToggleForm>(
    field: K,
    value: FeatureToggleForm[K]
  ) => {
    setFeatureForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleFeatureSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!featureForm) return;

    setFeatureSaving(true);
    try {
      const payload: CompanyFeatureToggleInput = {
        ...featureForm,
      };

      const response = await apiClient.company.updateFeatureToggles(payload);
      if (!response.success || !response.data) {
        toast.error(response.error || "Failed to update feature configuration");
        return;
      }

      const updatedConfig = response.data;
      setFeatureForm(mapFeatureToggleToForm(updatedConfig));

      if (user) {
        setUser({
          ...user,
          startup: {
            ...user.startup,
            featureToggle: updatedConfig,
          },
        });
      }

      toast.success("Feature configuration updated successfully");
    } catch (error) {
      console.error("Update feature configuration error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update feature configuration"
      );
    } finally {
      setFeatureSaving(false);
    }
  };

  const resetButtonClass =
    "min-w-[96px] border border-[#607c47] text-[#2C2C2C] bg-white hover:bg-[#607c47]/10 focus-visible:ring-[#607c47]/40 disabled:text-[#607c47]/50 disabled:bg-white";

  const sections = [
    {
      icon: <User className="h-5 w-5 text-[#607c47]" />,
      title: "Account Information",
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <dt className="text-xs font-medium text-[#2C2C2C]/60 uppercase tracking-wide">
                Email
              </dt>
              <dd className="text-base font-semibold text-[#2C2C2C] break-all">
                {user?.email}
              </dd>
            </div>
            <div className="space-y-1.5">
              <dt className="text-xs font-medium text-[#2C2C2C]/60 uppercase tracking-wide">
                Role
              </dt>
              <dd className="text-base font-semibold text-[#2C2C2C] capitalize">
                {user?.roles.join(", ")}
              </dd>
            </div>
            <div className="space-y-1.5">
              <dt className="text-xs font-medium text-[#2C2C2C]/60 uppercase tracking-wide">
                Organization
              </dt>
              <dd className="text-base font-semibold text-[#2C2C2C]">
                {user?.startup?.name}
              </dd>
            </div>
            <div className="space-y-1.5">
              <dt className="text-xs font-medium text-[#2C2C2C]/60 uppercase tracking-wide">
                Member Since
              </dt>
              <dd className="text-base font-semibold text-[#2C2C2C]">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </dd>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <Link className="h-5 w-5 text-[#607c47]" />,
      title: "Connections",
      content: (
        <div className="space-y-4">
          {plaidItems.length > 0 ? (
            plaidItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[#607c47]/30 hover:shadow-md transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2C2C2C] text-base truncate">
                    {item.institutionName || "Bank Account"}
                  </p>
                  <p className="text-sm text-[#2C2C2C]/60 mt-0.5">
                    {item.accounts?.length || 0}{" "}
                    {item.accounts?.length === 1 ? "account" : "accounts"}
                  </p>
                </div>
                <Button
                  onClick={() => handleDisconnectBank(item.id)}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 ml-3 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Disconnect
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#2C2C2C]/50">
              <p className="text-sm">No bank accounts connected</p>
            </div>
          )}
          <div className="pt-2">
            <PlaidLink
              onSuccess={handlePlaidSuccess}
              onError={(e: Error | unknown) => {
                const errorMessage =
                  e &&
                  typeof e === "object" &&
                  "display_message" in e &&
                  typeof e.display_message === "string"
                    ? e.display_message
                    : "An error occurred.";
                toast.error(errorMessage);
              }}
            />
          </div>
        </div>
      ),
    },
  ];

  const activeTabMeta = settingsTabs.find((tab) => tab.id === activeTab);
  const activePlanCode = user?.startup?.subscriptionPlan ?? "starter_earlybird";
  const activePlan =
    subscriptionPlanCatalog[activePlanCode] ?? subscriptionPlanCatalog.starter;
  const subscriptionStatus = user?.startup?.subscriptionStatus ?? "active";

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 pb-32 md:pb-20 space-y-6">
          <div className="flex items-center gap-4">
            <Settings className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                Settings
              </h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                Manage your account and application settings.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap gap-2 border-b border-gray-200">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "text-[#2C2C2C] border-[#607c47]"
                      : "text-muted-foreground border-transparent hover:text-[#2C2C2C]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {activeTabMeta?.description}
            </p>
          </div>

          {activeTab === "general" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sections.map((section) => (
                <Card
                  key={section.title}
                  className="rounded-2xl shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-shadow duration-200"
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-[#2C2C2C]">
                      {section.icon} {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">{section.content}</CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "general" && (
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                  <Building2 className="h-5 w-5 text-[#2C2C2C]" /> Company
                  Profile
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Maintain the legal identity, contact details, and mailing
                  addresses for invoices and statutory filings.
                </p>
              </CardHeader>
              <CardContent>
                {profileLoading || !profileForm ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading
                    company profile...
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleProfileSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name *</Label>
                        <Input
                          id="displayName"
                          required
                          value={profileForm.displayName}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "displayName",
                              event.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="legalName">Legal Name</Label>
                        <Input
                          id="legalName"
                          placeholder="Registered legal entity name"
                          value={profileForm.legalName}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "legalName",
                              event.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mailingName">Mailing Name</Label>
                        <Input
                          id="mailingName"
                          placeholder="Name printed on invoices and reports"
                          value={profileForm.mailingName}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "mailingName",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={profileForm.country || ""}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "country",
                              event.target.value
                            )
                          }
                          placeholder="India"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={profileForm.state || ""}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "state",
                              event.target.value
                            )
                          }
                          placeholder="Karnataka"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profileForm.city || ""}
                          onChange={(event) =>
                            handleProfileFieldChange("city", event.target.value)
                          }
                          placeholder="Bengaluru"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal / ZIP Code</Label>
                        <Input
                          id="postalCode"
                          value={profileForm.postalCode || ""}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "postalCode",
                              event.target.value
                            )
                          }
                          placeholder="560001"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone || ""}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "phone",
                              event.target.value
                            )
                          }
                          placeholder="+91-80-4000-1234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                          id="mobile"
                          value={profileForm.mobile || ""}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "mobile",
                              event.target.value
                            )
                          }
                          placeholder="+91-98765-43210"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email || ""}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "email",
                              event.target.value
                            )
                          }
                          placeholder="finance@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profileForm.website || ""}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "website",
                              event.target.value
                            )
                          }
                          placeholder="https://company.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-[#2C2C2C]">
                            Company Addresses
                          </h3>
                          <p className="text-xs text-[#2C2C2C]/80">
                            Add mailing, billing, and branch addresses. The
                            primary address will be used as default.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddAddress}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Address
                        </Button>
                      </div>

                      {hasAddresses ? (
                        <div className="space-y-4">
                          {profileForm.addresses.map((address, index) => (
                            <div
                              key={address.id ?? index}
                              className="rounded-xl border border-gray-200 p-4 space-y-4 bg-gray-50"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-[#2C2C2C]">
                                  Address {index + 1}
                                </h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-red-500 hover:text-red-600"
                                  onClick={() => handleRemoveAddress(index)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                                </Button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor={`address-label-${index}`}>
                                    Label
                                  </Label>
                                  <Input
                                    id={`address-label-${index}`}
                                    value={address.label || ""}
                                    onChange={(event) =>
                                      handleAddressChange(
                                        index,
                                        "label",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Head Office / Billing / Branch"
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor={`address-line1-${index}`}>
                                    Address Line 1 *
                                  </Label>
                                  <Textarea
                                    id={`address-line1-${index}`}
                                    required
                                    value={address.line1}
                                    onChange={(event) =>
                                      handleAddressChange(
                                        index,
                                        "line1",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Door / Street / Building"
                                    className="text-[#2C2C2C]"
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor={`address-line2-${index}`}>
                                    Address Line 2
                                  </Label>
                                  <Input
                                    id={`address-line2-${index}`}
                                    value={address.line2 || ""}
                                    onChange={(event) =>
                                      handleAddressChange(
                                        index,
                                        "line2",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Area / Landmark"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`address-city-${index}`}>
                                    City
                                  </Label>
                                  <Input
                                    id={`address-city-${index}`}
                                    value={address.city || ""}
                                    onChange={(event) =>
                                      handleAddressChange(
                                        index,
                                        "city",
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`address-state-${index}`}>
                                    State
                                  </Label>
                                  <Input
                                    id={`address-state-${index}`}
                                    value={address.state || ""}
                                    onChange={(event) =>
                                      handleAddressChange(
                                        index,
                                        "state",
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`address-country-${index}`}>
                                    Country
                                  </Label>
                                  <Input
                                    id={`address-country-${index}`}
                                    value={address.country || ""}
                                    onChange={(event) =>
                                      handleAddressChange(
                                        index,
                                        "country",
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`address-postal-${index}`}>
                                    Postal Code
                                  </Label>
                                  <Input
                                    id={`address-postal-${index}`}
                                    value={address.postalCode || ""}
                                    onChange={(event) =>
                                      handleAddressChange(
                                        index,
                                        "postalCode",
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-[#2C2C2C]">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!address.isPrimary}
                                    onChange={() =>
                                      handleAddressToggle(index, "isPrimary")
                                    }
                                  />
                                  Primary Address
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!address.isBilling}
                                    onChange={() =>
                                      handleAddressToggle(index, "isBilling")
                                    }
                                  />
                                  Billing Address
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!address.isShipping}
                                    onChange={() =>
                                      handleAddressToggle(index, "isShipping")
                                    }
                                  />
                                  Shipping Address
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-[#2C2C2C]/70 bg-gray-50">
                          No addresses added yet. Use the button above to
                          capture billing or branch locations.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className={resetButtonClass}
                        onClick={loadCompanyData}
                        disabled={profileLoading || profileSaving}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        disabled={profileSaving}
                        className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                      >
                        {profileSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                            Saving...
                          </>
                        ) : (
                          "Save Company Profile"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "financial" && (
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                  <Shield className="h-5 w-5 text-[#2C2C2C]" /> Financial Year &
                  Edit Log
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Control financial year boundaries, book start dates,
                  back-dated entry permissions, and audit logging.
                </p>
              </CardHeader>
              <CardContent>
                {fiscalLoading || !fiscalForm ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading
                    fiscal configuration...
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleFiscalSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="financialYearStart">
                          Financial Year Beginning *
                        </Label>
                        <Input
                          id="financialYearStart"
                          type="date"
                          required
                          value={fiscalForm.financialYearStart}
                          onChange={(event) =>
                            handleFiscalFieldChange(
                              "financialYearStart",
                              event.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="booksStart">
                          Books Beginning From *
                        </Label>
                        <Input
                          id="booksStart"
                          type="date"
                          required
                          value={fiscalForm.booksStart}
                          onChange={(event) =>
                            handleFiscalFieldChange(
                              "booksStart",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
                      <h3 className="text-sm font-semibold text-[#2C2C2C]">
                        Back-Dated Entries
                      </h3>
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={fiscalForm.allowBackdatedEntries}
                            onChange={(event) =>
                              handleFiscalFieldChange(
                                "allowBackdatedEntries",
                                event.target.checked
                              )
                            }
                          />
                          Allow back-dated entries
                        </label>
                        {fiscalForm.allowBackdatedEntries && (
                          <div className="grid gap-2 md:max-w-sm">
                            <Label htmlFor="backdatedFrom">
                              Back-dated entries permitted from
                            </Label>
                            <Input
                              id="backdatedFrom"
                              type="date"
                              value={fiscalForm.backdatedFrom || ""}
                              onChange={(event) =>
                                handleFiscalFieldChange(
                                  "backdatedFrom",
                                  event.target.value
                                )
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              This controls the earliest date allowed for
                              vouchers within the current books.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-gray-200 p-4 bg-gray-50">
                      <h3 className="text-sm font-semibold text-[#2C2C2C]">
                        Audit Trail
                      </h3>
                      <label className="flex items-center gap-3 text-sm text-[#2C2C2C]">
                        <input
                          type="checkbox"
                          checked={fiscalForm.enableEditLog}
                          onChange={(event) =>
                            handleFiscalFieldChange(
                              "enableEditLog",
                              event.target.checked
                            )
                          }
                        />
                        Enable Edit Log (audit trail for vouchers & masters)
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Provides an audit-compliant edit log for vouchers and
                        masters.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className={resetButtonClass}
                        onClick={loadCompanyData}
                        disabled={fiscalLoading || fiscalSaving}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        disabled={fiscalSaving}
                        className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                      >
                        {fiscalSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                            Saving...
                          </>
                        ) : (
                          "Save Fiscal Settings"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                  <Shield className="h-5 w-5 text-[#2C2C2C]" /> Security
                  Controls
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure vault encryption and granular user access policies
                  for your company.
                </p>
              </CardHeader>
              <CardContent>
                {securityLoading || !securityForm ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading
                    security configuration...
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSecuritySubmit}>
                    <div className="space-y-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
                      <h3 className="text-sm font-semibold text-[#2C2C2C]">
                        Vault Encryption
                      </h3>
                      <label className="flex items-center gap-3 text-sm text-[#2C2C2C]">
                        <input
                          type="checkbox"
                          checked={securityForm.tallyVaultEnabled}
                          onChange={(event) =>
                            handleSecurityFieldChange(
                              "tallyVaultEnabled",
                              event.target.checked
                            )
                          }
                        />
                        Enable vault encryption for company data
                      </label>

                      {securityForm.tallyVaultEnabled ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="tallyVaultHint">
                              Password Hint (optional)
                            </Label>
                            <Input
                              id="tallyVaultHint"
                              value={securityForm.tallyVaultPasswordHint}
                              onChange={(event) =>
                                handleSecurityFieldChange(
                                  "tallyVaultPasswordHint",
                                  event.target.value
                                )
                              }
                              placeholder="Example: Favourite childhood city"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tallyVaultCurrentPassword">
                              Current Vault Password
                            </Label>
                            <Input
                              id="tallyVaultCurrentPassword"
                              type="password"
                              value={securityForm.currentPassword}
                              onChange={(event) =>
                                handleSecurityFieldChange(
                                  "currentPassword",
                                  event.target.value
                                )
                              }
                              placeholder={
                                securityForm.initialTallyVaultEnabled
                                  ? "Enter current password to make changes"
                                  : "Not required when enabling for the first time"
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tallyVaultNewPassword">
                              {securityForm.initialTallyVaultEnabled
                                ? "New Vault Password"
                                : "Set Vault Password *"}
                            </Label>
                            <Input
                              id="tallyVaultNewPassword"
                              type="password"
                              value={securityForm.newPassword}
                              onChange={(event) =>
                                handleSecurityFieldChange(
                                  "newPassword",
                                  event.target.value
                                )
                              }
                              placeholder="Enter strong password"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tallyVaultConfirmPassword">
                              Confirm Password
                            </Label>
                            <Input
                              id="tallyVaultConfirmPassword"
                              type="password"
                              value={securityForm.confirmNewPassword}
                              onChange={(event) =>
                                handleSecurityFieldChange(
                                  "confirmNewPassword",
                                  event.target.value
                                )
                              }
                              placeholder="Re-enter password"
                            />
                          </div>
                          <p className="md:col-span-2 text-xs text-muted-foreground">
                            Store this password securely. It cannot be recovered
                            once lost.
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Keep disabled if you do not want company data
                            encrypted. Enabling hides the company name until the
                            password is provided.
                          </p>
                          {securityForm.initialTallyVaultEnabled && (
                            <div className="space-y-2 md:max-w-sm">
                              <Label htmlFor="tallyVaultDisablePassword">
                                Current Vault Password (required to disable)
                              </Label>
                              <Input
                                id="tallyVaultDisablePassword"
                                type="password"
                                value={securityForm.currentPassword}
                                onChange={(event) =>
                                  handleSecurityFieldChange(
                                    "currentPassword",
                                    event.target.value
                                  )
                                }
                                placeholder="Enter current password to disable"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
                      <h3 className="text-sm font-semibold text-[#2C2C2C]">
                        User Access Controls
                      </h3>
                      <label className="flex items-center gap-3 text-sm text-[#2C2C2C]">
                        <input
                          type="checkbox"
                          checked={securityForm.userAccessControlEnabled}
                          onChange={(event) =>
                            handleSecurityFieldChange(
                              "userAccessControlEnabled",
                              event.target.checked
                            )
                          }
                        />
                        Require company login credentials for every user
                      </label>
                      <label className="flex items-center gap-3 text-sm text-[#2C2C2C]">
                        <input
                          type="checkbox"
                          checked={securityForm.multiFactorRequired}
                          onChange={(event) =>
                            handleSecurityFieldChange(
                              "multiFactorRequired",
                              event.target.checked
                            )
                          }
                        />
                        Enforce multi-factor authentication for privileged roles
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Toggle granular access policies similar to advanced ERP
                        user controls. MFA can be rolled out gradually across
                        roles.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className={resetButtonClass}
                        onClick={loadCompanyData}
                        disabled={securityLoading || securitySaving}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        disabled={securitySaving}
                        className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                      >
                        {securitySaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                            Saving...
                          </>
                        ) : (
                          "Save Security Settings"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "financial" && (
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                  <IndianRupee className="h-5 w-5 text-[#2C2C2C]" /> Base
                  Currency & Formatting
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure how monetary values appear across reports, invoices,
                  and dashboards.
                </p>
              </CardHeader>
              <CardContent>
                {currencyLoading || !currencyForm ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading
                    currency settings...
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleCurrencySubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="currencyCode">
                          Base Currency Code *
                        </Label>
                        <Input
                          id="currencyCode"
                          value={currencyForm.baseCurrencyCode}
                          onChange={(event) =>
                            handleCurrencyFieldChange(
                              "baseCurrencyCode",
                              event.target.value.toUpperCase()
                            )
                          }
                          maxLength={3}
                          placeholder="INR"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currencySymbol">
                          Currency Symbol *
                        </Label>
                        <Input
                          id="currencySymbol"
                          value={currencyForm.baseCurrencySymbol}
                          onChange={(event) =>
                            handleCurrencyFieldChange(
                              "baseCurrencySymbol",
                              event.target.value
                            )
                          }
                          maxLength={3}
                          placeholder="₹"
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="currencyName">Formal Name</Label>
                        <Input
                          id="currencyName"
                          value={currencyForm.baseCurrencyFormalName}
                          onChange={(event) =>
                            handleCurrencyFieldChange(
                              "baseCurrencyFormalName",
                              event.target.value
                            )
                          }
                          placeholder="Indian Rupee"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="decimalPlaces">Decimal Places</Label>
                        <Input
                          id="decimalPlaces"
                          type="number"
                          min={0}
                          max={6}
                          value={currencyForm.decimalPlaces}
                          onChange={(event) =>
                            handleCurrencyFieldChange(
                              "decimalPlaces",
                              Number(event.target.value)
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="decimalSeparator">
                          Decimal Separator
                        </Label>
                        <Input
                          id="decimalSeparator"
                          value={currencyForm.decimalSeparator}
                          onChange={(event) =>
                            handleCurrencyFieldChange(
                              "decimalSeparator",
                              event.target.value.slice(0, 1)
                            )
                          }
                          maxLength={1}
                          placeholder="."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="thousandSeparator">
                          Thousands Separator
                        </Label>
                        <Input
                          id="thousandSeparator"
                          value={currencyForm.thousandSeparator}
                          onChange={(event) =>
                            handleCurrencyFieldChange(
                              "thousandSeparator",
                              event.target.value.slice(0, 1)
                            )
                          }
                          maxLength={1}
                          placeholder=","
                        />
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-gray-200 p-4 bg-gray-50">
                      <h3 className="text-sm font-semibold text-[#2C2C2C]">
                        Display Preferences
                      </h3>
                      <label className="flex items-center gap-3 text-sm text-[#2C2C2C]">
                        <input
                          type="checkbox"
                          checked={currencyForm.symbolOnRight}
                          onChange={(event) =>
                            handleCurrencyFieldChange(
                              "symbolOnRight",
                              event.target.checked
                            )
                          }
                        />
                        Place currency symbol after the amount
                      </label>
                      <label className="flex items-center gap-3 text-sm text-[#2C2C2C]">
                        <input
                          type="checkbox"
                          checked={currencyForm.spaceBetweenAmountAndSymbol}
                          onChange={(event) =>
                            handleCurrencyFieldChange(
                              "spaceBetweenAmountAndSymbol",
                              event.target.checked
                            )
                          }
                        />
                        Insert space between symbol and amount
                      </label>
                      <label className="flex items-center gap-3 text-sm text-[#2C2C2C]">
                        <input
                          type="checkbox"
                          checked={currencyForm.showAmountInMillions}
                          onChange={(event) =>
                            handleCurrencyFieldChange(
                              "showAmountInMillions",
                              event.target.checked
                            )
                          }
                        />
                        Show large figures in millions (for dashboards &
                        reports)
                      </label>
                      <p className="text-xs text-muted-foreground">
                        These settings influence invoice print-outs, dashboards,
                        and upcoming analytics modules.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className={resetButtonClass}
                        onClick={loadCompanyData}
                        disabled={currencyLoading || currencySaving}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        disabled={currencySaving}
                        className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                      >
                        {currencySaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                            Saving...
                          </>
                        ) : (
                          "Save Currency Settings"
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "financial" && (
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                  <Building2 className="h-5 w-5 text-[#2C2C2C]" /> Voucher Types
                  & Numbering
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure standard voucher types, numbering sequences, and
                  prefixes to mirror your existing accounting setup.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form
                  className="grid gap-4 md:grid-cols-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4"
                  onSubmit={handleCreateVoucherType}
                >
                  <div className="space-y-2 md:col-span-3">
                    <h3 className="text-sm font-semibold text-[#2C2C2C]">
                      Create Voucher Type
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucherTypeName">Name *</Label>
                    <Input
                      id="voucherTypeName"
                      value={newVoucherType.name}
                      onChange={(event) =>
                        handleNewVoucherTypeChange("name", event.target.value)
                      }
                      placeholder="e.g., Payment"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucherTypeCategory">Category *</Label>
                    <Select
                      value={newVoucherType.category}
                      onValueChange={(value) =>
                        handleNewVoucherTypeChange(
                          "category",
                          value as VoucherCategory
                        )
                      }
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {voucherCategoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucherTypeAbbreviation">
                      Abbreviation
                    </Label>
                    <Input
                      id="voucherTypeAbbreviation"
                      value={newVoucherType.abbreviation}
                      onChange={(event) =>
                        handleNewVoucherTypeChange(
                          "abbreviation",
                          event.target.value
                        )
                      }
                      placeholder="Optional short code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucherTypeNumberingMethod">
                      Numbering Method
                    </Label>
                    <Select
                      value={newVoucherType.numberingMethod}
                      onValueChange={(value) =>
                        handleNewVoucherTypeChange(
                          "numberingMethod",
                          value as VoucherNumberingMethod
                        )
                      }
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                        <SelectValue placeholder="Select numbering method" />
                      </SelectTrigger>
                      <SelectContent>
                        {numberingMethodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucherTypeNumberingBehavior">
                      Numbering Behaviour
                    </Label>
                    <Select
                      value={newVoucherType.numberingBehavior}
                      onValueChange={(value) =>
                        handleNewVoucherTypeChange(
                          "numberingBehavior",
                          value as VoucherNumberingBehavior
                        )
                      }
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                        <SelectValue placeholder="Select numbering behavior" />
                      </SelectTrigger>
                      <SelectContent>
                        {numberingBehaviorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucherTypePrefix">Prefix</Label>
                    <Input
                      id="voucherTypePrefix"
                      value={newVoucherType.prefix}
                      onChange={(event) =>
                        handleNewVoucherTypeChange("prefix", event.target.value)
                      }
                      placeholder="e.g., PMT/"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voucherTypeSuffix">Suffix</Label>
                    <Input
                      id="voucherTypeSuffix"
                      value={newVoucherType.suffix}
                      onChange={(event) =>
                        handleNewVoucherTypeChange("suffix", event.target.value)
                      }
                      placeholder="Optional suffix"
                    />
                  </div>
                  <div className="flex items-center gap-2 md:col-span-3 text-sm">
                    <label className="flex items-center gap-2 text-[#2C2C2C]">
                      <input
                        type="checkbox"
                        checked={newVoucherType.allowManualOverride}
                        onChange={(event) =>
                          handleNewVoucherTypeChange(
                            "allowManualOverride",
                            event.target.checked
                          )
                        }
                      />
                      Allow manual override
                    </label>
                    <label className="flex items-center gap-2 text-[#2C2C2C]">
                      <input
                        type="checkbox"
                        checked={newVoucherType.allowDuplicateNumbers}
                        onChange={(event) =>
                          handleNewVoucherTypeChange(
                            "allowDuplicateNumbers",
                            event.target.checked
                          )
                        }
                      />
                      Allow duplicate numbers
                    </label>
                  </div>
                  <div className="flex items-center gap-3 md:col-span-3 justify-end">
                    <Button
                      type="submit"
                      disabled={voucherLoading}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                    >
                      Add Voucher Type
                    </Button>
                  </div>
                </form>

                {voucherLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading
                    voucher types...
                  </div>
                ) : voucherTypes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-muted-foreground bg-gray-50">
                    No voucher types configured yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {voucherTypes.map((voucherType) => {
                      const seriesDraft = seriesDrafts[voucherType.id] ?? {
                        name: "",
                        prefix: "",
                        suffix: "",
                      };
                      const saving = voucherSaving[voucherType.id] ?? false;
                      return (
                        <div
                          key={voucherType.id}
                          className="space-y-4 rounded-xl border border-gray-200 p-4 bg-gray-50"
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-[#2C2C2C]">
                                {voucherType.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {voucherCategoryOptions.find(
                                  (option) =>
                                    option.value === voucherType.category
                                )?.label ?? voucherType.category}{" "}
                                • Next Number: {voucherType.nextNumber}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="px-2 py-1 rounded bg-white border border-gray-200">
                                Method:{" "}
                                {numberingMethodOptions.find(
                                  (option) =>
                                    option.value === voucherType.numberingMethod
                                )?.label ?? voucherType.numberingMethod}
                              </span>
                              <span className="px-2 py-1 rounded bg-white border border-gray-200">
                                Behaviour:{" "}
                                {numberingBehaviorOptions.find(
                                  (option) =>
                                    option.value ===
                                    voucherType.numberingBehavior
                                )?.label ?? voucherType.numberingBehavior}
                              </span>
                              {voucherType.allowManualOverride && (
                                <span className="px-2 py-1 rounded bg-white border border-gray-200">
                                  Manual override
                                </span>
                              )}
                              {voucherType.allowDuplicateNumbers && (
                                <span className="px-2 py-1 rounded bg-white border border-gray-200">
                                  Duplicates allowed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label
                                htmlFor={`voucher-prefix-${voucherType.id}`}
                              >
                                Prefix
                              </Label>
                              <Input
                                id={`voucher-prefix-${voucherType.id}`}
                                value={voucherType.prefix ?? ""}
                                onChange={(event) =>
                                  handleVoucherTypeFieldChange(
                                    voucherType.id,
                                    "prefix",
                                    event.target.value || null
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`voucher-suffix-${voucherType.id}`}
                              >
                                Suffix
                              </Label>
                              <Input
                                id={`voucher-suffix-${voucherType.id}`}
                                value={voucherType.suffix ?? ""}
                                onChange={(event) =>
                                  handleVoucherTypeFieldChange(
                                    voucherType.id,
                                    "suffix",
                                    event.target.value || null
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`voucher-next-${voucherType.id}`}>
                                Next Number
                              </Label>
                              <Input
                                id={`voucher-next-${voucherType.id}`}
                                type="number"
                                min={1}
                                value={voucherType.nextNumber}
                                onChange={(event) =>
                                  handleVoucherTypeFieldChange(
                                    voucherType.id,
                                    "nextNumber",
                                    Number(event.target.value || 1)
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <label className="flex items-center gap-2 text-[#2C2C2C]">
                              <input
                                type="checkbox"
                                checked={voucherType.allowManualOverride}
                                onChange={(event) =>
                                  handleVoucherTypeFieldChange(
                                    voucherType.id,
                                    "allowManualOverride",
                                    event.target.checked
                                  )
                                }
                              />
                              Allow manual override
                            </label>
                            <label className="flex items-center gap-2 text-[#2C2C2C]">
                              <input
                                type="checkbox"
                                checked={voucherType.allowDuplicateNumbers}
                                onChange={(event) =>
                                  handleVoucherTypeFieldChange(
                                    voucherType.id,
                                    "allowDuplicateNumbers",
                                    event.target.checked
                                  )
                                }
                              />
                              Allow duplicate numbers
                            </label>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={saving}
                              onClick={() =>
                                handleVoucherTypeSave(voucherType.id)
                              }
                            >
                              {saving ? "Saving..." : "Save Settings"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={saving}
                              onClick={() =>
                                handleGenerateNextNumber(voucherType.id)
                              }
                            >
                              Preview Next Number
                            </Button>
                          </div>

                          <div className="space-y-3 bg-white border border-gray-200 rounded-lg p-3">
                            <h5 className="text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                              Numbering Series
                            </h5>
                            {voucherType.numberingSeries.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No additional series configured.
                              </p>
                            ) : (
                              <ul className="space-y-2 text-xs text-[#2C2C2C]">
                                {voucherType.numberingSeries.map((series) => (
                                  <li
                                    key={series.id}
                                    className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {series.name}{" "}
                                        {series.isDefault ? "(Default)" : ""}
                                      </p>
                                      <p className="text-muted-foreground">
                                        Prefix: {series.prefix ?? "-"} • Suffix:{" "}
                                        {series.suffix ?? "-"} • Next:{" "}
                                        {series.nextNumber}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      disabled={saving}
                                      onClick={() =>
                                        handleGenerateNextNumber(
                                          voucherType.id,
                                          series.id
                                        )
                                      }
                                    >
                                      Preview Next
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="grid gap-3 md:grid-cols-4">
                              <div className="md:col-span-2 space-y-1">
                                <Label
                                  htmlFor={`series-name-${voucherType.id}`}
                                >
                                  Series Name
                                </Label>
                                <Input
                                  id={`series-name-${voucherType.id}`}
                                  value={seriesDraft.name}
                                  onChange={(event) =>
                                    handleSeriesDraftChange(
                                      voucherType.id,
                                      "name",
                                      event.target.value
                                    )
                                  }
                                  placeholder="e.g., HO-2025"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label
                                  htmlFor={`series-prefix-${voucherType.id}`}
                                >
                                  Prefix
                                </Label>
                                <Input
                                  id={`series-prefix-${voucherType.id}`}
                                  value={seriesDraft.prefix}
                                  onChange={(event) =>
                                    handleSeriesDraftChange(
                                      voucherType.id,
                                      "prefix",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Optional"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label
                                  htmlFor={`series-suffix-${voucherType.id}`}
                                >
                                  Suffix
                                </Label>
                                <Input
                                  id={`series-suffix-${voucherType.id}`}
                                  value={seriesDraft.suffix}
                                  onChange={(event) =>
                                    handleSeriesDraftChange(
                                      voucherType.id,
                                      "suffix",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Optional"
                                />
                              </div>
                              <div className="md:col-span-4 flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={saving}
                                  onClick={() =>
                                    handleCreateSeries(voucherType.id)
                                  }
                                >
                                  Add Series
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <Card className="rounded-2xl shadow-lg border-0 bg-white">
                <CardHeader className="flex flex-col gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                    <Building2 className="h-5 w-5 text-[#2C2C2C]" />{" "}
                    Subscription
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track the plan assigned to this workspace. Early adopters
                    keep their pricing when billing goes live.
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Current Plan
                      </p>
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-2xl font-bold text-[#2C2C2C]">
                          {activePlan.label}
                        </h3>
                        {activePlan.isEarlybird && (
                          <Badge className="bg-amber-100 text-amber-900 border border-amber-300">
                            Earlybird
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[#2C2C2C]/80">
                        {activePlan.subLabel}
                      </p>
                    </div>
                    <div className="text-left md:text-right space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Status
                      </p>
                      <p className="text-base font-semibold text-[#2C2C2C] capitalize">
                        {subscriptionStatus}
                      </p>
                      <p className="text-sm text-[#2C2C2C]/70">
                        {activePlan.priceSummary}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-[#2C2C2C]">
                    {activePlan.description}
                  </p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#2C2C2C] font-medium">
                    {activePlan.seatSummary}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {activePlan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-sm text-[#2C2C2C]"
                      >
                        <Check className="h-4 w-4 text-[#607c47]" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  {activePlan.isEarlybird && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Earlybird access remains free until public launch.
                      We&apos;ll notify you before switching to the paid Startup
                      plan so you can confirm the upgrade.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="opacity-80 cursor-not-allowed"
                    >
                      Manage Plan (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-lg border-0 bg-white">
                <CardHeader className="flex flex-col gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                    <Shield className="h-5 w-5 text-[#2C2C2C]" /> Feature Access
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable major modules for this company. Disabled
                    modules will be hidden across the product.
                  </p>
                </CardHeader>
                <CardContent>
                  {featureLoading || !featureForm ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading
                      feature configuration...
                    </div>
                  ) : (
                    <form className="space-y-6" onSubmit={handleFeatureSubmit}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={featureForm.enableAccounting}
                            onChange={(event) =>
                              handleFeatureFieldChange(
                                "enableAccounting",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            <span className="font-semibold text-[#2C2C2C]">
                              Accounting & Ledgers
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Core ledger management, vouchers, and financial
                              statements.
                            </p>
                          </span>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={featureForm.enableInventory}
                            onChange={(event) =>
                              handleFeatureFieldChange(
                                "enableInventory",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            <span className="font-semibold text-[#2C2C2C]">
                              Inventory & Stock
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Stock items, batches, pricing, and warehouse
                              reporting.
                            </p>
                          </span>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={featureForm.enableTaxation}
                            onChange={(event) =>
                              handleFeatureFieldChange(
                                "enableTaxation",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            <span className="font-semibold text-[#2C2C2C]">
                              Tax & Compliance
                            </span>
                            <p className="text-xs text-muted-foreground">
                              GST, TDS/TCS modules, filings, and statutory
                              reports.
                            </p>
                          </span>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={featureForm.enablePayroll}
                            onChange={(event) =>
                              handleFeatureFieldChange(
                                "enablePayroll",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            <span className="font-semibold text-[#2C2C2C]">
                              Payroll & HR
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Employee payroll processing and statutory
                              deductions.
                            </p>
                          </span>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={featureForm.enableAIInsights}
                            onChange={(event) =>
                              handleFeatureFieldChange(
                                "enableAIInsights",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            <span className="font-semibold text-[#2C2C2C]">
                              AI Insights
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Automated anomaly detection, alerts, and AI
                              recommendations.
                            </p>
                          </span>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={featureForm.enableScenarioPlanning}
                            onChange={(event) =>
                              handleFeatureFieldChange(
                                "enableScenarioPlanning",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            <span className="font-semibold text-[#2C2C2C]">
                              Scenario Planning
                            </span>
                            <p className="text-xs text-muted-foreground">
                              What-if analysis, runway simulations, and
                              forecasting sandbox.
                            </p>
                          </span>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={featureForm.enableAutomations}
                            onChange={(event) =>
                              handleFeatureFieldChange(
                                "enableAutomations",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            <span className="font-semibold text-[#2C2C2C]">
                              Automations
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Background reconciliations, smart reminders, and
                              workflows.
                            </p>
                          </span>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={featureForm.enableVendorManagement}
                            onChange={(event) =>
                              handleFeatureFieldChange(
                                "enableVendorManagement",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            <span className="font-semibold text-[#2C2C2C]">
                              Vendor Management
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Procurement workflows, vendor portals, and
                              purchase approvals.
                            </p>
                          </span>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 text-sm text-[#2C2C2C]">
                          <input
                            type="checkbox"
                            checked={featureForm.enableBillingAndInvoicing}
                            onChange={(event) =>
                              handleFeatureFieldChange(
                                "enableBillingAndInvoicing",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            <span className="font-semibold text-[#2C2C2C]">
                              Billing & Invoicing
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Sales invoices, collections, reminders, and
                              payment reconciliation.
                            </p>
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className={resetButtonClass}
                          onClick={loadCompanyData}
                          disabled={featureLoading || featureSaving}
                        >
                          Reset
                        </Button>
                        <Button
                          type="submit"
                          disabled={featureSaving}
                          className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                        >
                          {featureSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                              Saving...
                            </>
                          ) : (
                            "Save Feature Settings"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
