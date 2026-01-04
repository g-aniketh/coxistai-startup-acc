"use client";

import { useEffect, useState } from "react";
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
import {
  apiClient,
  GstLedgerMapping,
  GstLedgerMappingInput,
  GstLedgerMappingType,
  GstRegistration,
  GstRegistrationInput,
  GstRegistrationType,
  GstTaxRate,
  GstTaxRateInput,
  GstTaxSupplyType,
} from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  BadgePercent,
  Building2,
  ListChecks,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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
} from "@/components/ui/dialog";

type GstTab = "registrations" | "taxRates" | "mappings";

const REGISTRATION_TYPES: Array<{ value: GstRegistrationType; label: string }> =
  [
    { value: "REGULAR", label: "Regular" },
    { value: "COMPOSITION", label: "Composition" },
    { value: "SEZ", label: "SEZ" },
    { value: "ISD", label: "ISD" },
    { value: "TDS", label: "TDS" },
    { value: "TCS", label: "TCS" },
  ];

const LEDGER_MAPPING_LABELS: Record<GstLedgerMappingType, string> = {
  OUTPUT_CGST: "Output CGST",
  OUTPUT_SGST: "Output SGST/UTGST",
  OUTPUT_IGST: "Output IGST",
  OUTPUT_CESS: "Output Cess",
  INPUT_CGST: "Input CGST",
  INPUT_SGST: "Input SGST/UTGST",
  INPUT_IGST: "Input IGST",
  INPUT_CESS: "Input Cess",
  RCM_PAYABLE: "RCM Payable",
  RCM_INPUT: "RCM Input Credit",
};

const SUPPLY_TYPES: Array<{ value: GstTaxSupplyType; label: string }> = [
  { value: "GOODS", label: "Goods" },
  { value: "SERVICES", label: "Services" },
];

const TAX_PERCENT_FIELDS: Array<{
  key: keyof Pick<
    GstTaxRateInput,
    "cgstRate" | "sgstRate" | "igstRate" | "cessRate"
  >;
  label: string;
}> = [
  { key: "cgstRate", label: "CGST (%)" },
  { key: "sgstRate", label: "SGST (%)" },
  { key: "igstRate", label: "IGST (%)" },
  { key: "cessRate", label: "Cess (%)" },
];

const LEDGER_MAPPING_OPTIONS = Object.entries(LEDGER_MAPPING_LABELS).map(
  ([value, label]) => ({
    value: value as GstLedgerMappingType,
    label,
  })
);

const DEFAULT_STATE_CODES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman & Diu" },
  { code: "26", name: "Dadra & Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Before Division)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh (New)" },
];

export default function GstManagementPage() {
  const [activeTab, setActiveTab] = useState<GstTab>("registrations");
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<GstRegistration[]>([]);
  const [taxRates, setTaxRates] = useState<GstTaxRate[]>([]);
  const [ledgerMappings, setLedgerMappings] = useState<GstLedgerMapping[]>([]);

  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] =
    useState<GstRegistration | null>(null);
  const [registrationForm, setRegistrationForm] =
    useState<GstRegistrationInput>({
      gstin: "",
      legalName: "",
      tradeName: "",
      registrationType: "REGULAR",
      stateCode: "27",
      stateName: "Maharashtra",
      startDate: new Date().toISOString().substring(0, 10),
      endDate: null,
      isDefault: registrations.length === 0,
      isActive: true,
    });
  const [registrationSaving, setRegistrationSaving] = useState(false);

  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<GstTaxRate | null>(null);
  const [taxForm, setTaxForm] = useState<GstTaxRateInput>({
    registrationId: "",
    supplyType: "GOODS",
    hsnOrSac: "",
    description: "",
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    cessRate: 0,
    effectiveFrom: null,
    effectiveTo: null,
    isActive: true,
  });
  const [taxSaving, setTaxSaving] = useState(false);

  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<GstLedgerMapping | null>(
    null
  );
  const [mappingForm, setMappingForm] = useState<GstLedgerMappingInput>({
    registrationId: "",
    mappingType: "OUTPUT_CGST",
    ledgerName: "",
    ledgerCode: "",
    description: "",
  });
  const [mappingSaving, setMappingSaving] = useState(false);

  const loadGstData = async () => {
    try {
      setLoading(true);
      const [regRes, rateRes, mapRes] = await Promise.all([
        apiClient.gst.listRegistrations(),
        apiClient.gst.listTaxRates(),
        apiClient.gst.listLedgerMappings(),
      ]);

      if (regRes.success && regRes.data) {
        setRegistrations(regRes.data);
      }
      if (rateRes.success && rateRes.data) {
        setTaxRates(rateRes.data);
      }
      if (mapRes.success && mapRes.data) {
        setLedgerMappings(mapRes.data);
      }
    } catch (error) {
      console.error("Load GST data error:", error);
      toast.error("Unable to load GST configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGstData();
  }, []);

  // ---------------------------------------------------------------------------
  // GST Registration handlers
  // ---------------------------------------------------------------------------
  const resetRegistrationForm = () => {
    setRegistrationForm({
      gstin: "",
      legalName: "",
      tradeName: "",
      registrationType: "REGULAR",
      stateCode: "27",
      stateName: "Maharashtra",
      startDate: new Date().toISOString().substring(0, 10),
      endDate: null,
      isDefault: registrations.length === 0,
      isActive: true,
    });
    setEditingRegistration(null);
  };

  const openRegistrationDialog = (registration?: GstRegistration) => {
    if (registration) {
      setEditingRegistration(registration);
      setRegistrationForm({
        gstin: registration.gstin,
        legalName: registration.legalName || "",
        tradeName: registration.tradeName || "",
        registrationType: registration.registrationType,
        stateCode: registration.stateCode,
        stateName: registration.stateName || "",
        startDate: registration.startDate.substring(0, 10),
        endDate: registration.endDate
          ? registration.endDate.substring(0, 10)
          : null,
        isDefault: registration.isDefault,
        isActive: registration.isActive,
      });
    } else {
      resetRegistrationForm();
    }
    setRegistrationDialogOpen(true);
  };

  const handleSaveRegistration = async () => {
    const payload: GstRegistrationInput = {
      ...registrationForm,
      gstin: registrationForm.gstin.trim().toUpperCase(),
      legalName: registrationForm.legalName?.trim(),
      tradeName: registrationForm.tradeName?.trim(),
      stateName: registrationForm.stateName?.trim(),
    };

    try {
      setRegistrationSaving(true);
      if (editingRegistration) {
        const response = await apiClient.gst.updateRegistration(
          editingRegistration.id,
          payload
        );
        if (response.success) {
          toast.success("Registration updated successfully");
        } else {
          toast.error(response.error || "Failed to update GST registration");
          return;
        }
      } else {
        const response = await apiClient.gst.createRegistration(payload);
        if (response.success) {
          toast.success("Registration created successfully");
        } else {
          toast.error(response.error || "Failed to create GST registration");
          return;
        }
      }
      setRegistrationDialogOpen(false);
      resetRegistrationForm();
      await loadGstData();
    } catch (error) {
      console.error("Save GST registration error:", error);
      toast.error("Unable to save GST registration");
    } finally {
      setRegistrationSaving(false);
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!confirm("Are you sure you want to delete this GST registration?"))
      return;
    try {
      const response = await apiClient.gst.deleteRegistration(registrationId);
      if (response.success) {
        toast.success("Registration deleted successfully");
        await loadGstData();
      } else {
        toast.error(response.error || "Failed to delete GST registration");
      }
    } catch (error) {
      console.error("Delete GST registration error:", error);
      toast.error("Unable to delete GST registration");
    }
  };

  // ---------------------------------------------------------------------------
  // GST Tax Rates handlers
  // ---------------------------------------------------------------------------

  const resetTaxForm = () => {
    setTaxForm({
      registrationId: registrations.find((reg) => reg.isDefault)?.id || "",
      supplyType: "GOODS",
      hsnOrSac: "",
      description: "",
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cessRate: 0,
      effectiveFrom: null,
      effectiveTo: null,
      isActive: true,
    });
    setEditingTaxRate(null);
  };

  const openTaxDialog = (taxRate?: GstTaxRate) => {
    if (taxRate) {
      setEditingTaxRate(taxRate);
      setTaxForm({
        registrationId: taxRate.registrationId || "",
        supplyType: taxRate.supplyType,
        hsnOrSac: taxRate.hsnOrSac || "",
        description: taxRate.description || "",
        cgstRate: taxRate.cgstRate,
        sgstRate: taxRate.sgstRate,
        igstRate: taxRate.igstRate,
        cessRate: taxRate.cessRate,
        effectiveFrom: taxRate.effectiveFrom
          ? taxRate.effectiveFrom.substring(0, 10)
          : null,
        effectiveTo: taxRate.effectiveTo
          ? taxRate.effectiveTo.substring(0, 10)
          : null,
        isActive: taxRate.isActive,
      });
    } else {
      resetTaxForm();
    }
    setTaxDialogOpen(true);
  };

  const handleSaveTaxRate = async () => {
    const payload: GstTaxRateInput = {
      ...taxForm,
      registrationId: taxForm.registrationId || null,
      hsnOrSac: taxForm.hsnOrSac?.trim(),
      description: taxForm.description?.trim(),
      cgstRate: Number(taxForm.cgstRate ?? 0),
      sgstRate: Number(taxForm.sgstRate ?? 0),
      igstRate: Number(taxForm.igstRate ?? 0),
      cessRate: Number(taxForm.cessRate ?? 0),
    };

    try {
      setTaxSaving(true);
      if (editingTaxRate) {
        const response = await apiClient.gst.updateTaxRate(
          editingTaxRate.id,
          payload
        );
        if (response.success) {
          toast.success("GST tax rate updated successfully");
        } else {
          toast.error(response.error || "Failed to update GST tax rate");
          return;
        }
      } else {
        const response = await apiClient.gst.createTaxRate(payload);
        if (response.success) {
          toast.success("GST tax rate created successfully");
        } else {
          toast.error(response.error || "Failed to create GST tax rate");
          return;
        }
      }

      setTaxDialogOpen(false);
      resetTaxForm();
      await loadGstData();
    } catch (error) {
      console.error("Save GST tax rate error:", error);
      toast.error("Unable to save GST tax rate");
    } finally {
      setTaxSaving(false);
    }
  };

  const handleDeleteTaxRate = async (taxRateId: string) => {
    if (!confirm("Are you sure you want to delete this GST tax rate?")) return;
    try {
      const response = await apiClient.gst.deleteTaxRate(taxRateId);
      if (response.success) {
        toast.success("GST tax rate deleted successfully");
        await loadGstData();
      } else {
        toast.error(response.error || "Failed to delete GST tax rate");
      }
    } catch (error) {
      console.error("Delete GST tax rate error:", error);
      toast.error("Unable to delete GST tax rate");
    }
  };

  // ---------------------------------------------------------------------------
  // GST Ledger Mapping handlers
  // ---------------------------------------------------------------------------

  const resetMappingForm = () => {
    setMappingForm({
      registrationId: registrations.find((reg) => reg.isDefault)?.id || "",
      mappingType: "OUTPUT_CGST",
      ledgerName: "",
      ledgerCode: "",
      description: "",
    });
    setEditingMapping(null);
  };

  const openMappingDialog = (mapping?: GstLedgerMapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      setMappingForm({
        registrationId: mapping.registrationId || "",
        mappingType: mapping.mappingType,
        ledgerName: mapping.ledgerName,
        ledgerCode: mapping.ledgerCode || "",
        description: mapping.description || "",
      });
    } else {
      resetMappingForm();
    }
    setMappingDialogOpen(true);
  };

  const handleSaveMapping = async () => {
    const payload: GstLedgerMappingInput = {
      ...mappingForm,
      registrationId: mappingForm.registrationId || null,
      ledgerName: mappingForm.ledgerName.trim(),
      ledgerCode: mappingForm.ledgerCode?.trim(),
      description: mappingForm.description?.trim(),
    };

    try {
      setMappingSaving(true);
      if (editingMapping) {
        const response = await apiClient.gst.updateLedgerMapping(
          editingMapping.id,
          payload
        );
        if (response.success) {
          toast.success("GST ledger mapping updated successfully");
        } else {
          toast.error(response.error || "Failed to update GST ledger mapping");
          return;
        }
      } else {
        const response = await apiClient.gst.createLedgerMapping(payload);
        if (response.success) {
          toast.success("GST ledger mapping created successfully");
        } else {
          toast.error(response.error || "Failed to create GST ledger mapping");
          return;
        }
      }

      setMappingDialogOpen(false);
      resetMappingForm();
      await loadGstData();
    } catch (error) {
      console.error("Save GST ledger mapping error:", error);
      toast.error("Unable to save GST ledger mapping");
    } finally {
      setMappingSaving(false);
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm("Are you sure you want to delete this ledger mapping?"))
      return;
    try {
      const response = await apiClient.gst.deleteLedgerMapping(mappingId);
      if (response.success) {
        toast.success("GST ledger mapping deleted successfully");
        await loadGstData();
      } else {
        toast.error(response.error || "Failed to delete GST ledger mapping");
      }
    } catch (error) {
      console.error("Delete GST ledger mapping error:", error);
      toast.error("Unable to delete GST ledger mapping");
    }
  };

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------

  const renderRegistrationsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-[#2C2C2C]">
          GST Registrations
        </h3>
        <Button
          onClick={() => openRegistrationDialog()}
          className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white"
        >
          <Plus className="h-4 w-4" />
          Add Registration
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
          No GST registrations configured yet. Add your primary GSTIN to get
          started.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {registrations.map((reg) => (
            <Card
              key={reg.id}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold text-[#2C2C2C]">
                      {reg.gstin}
                    </CardTitle>
                    <p className="text-sm text-[#2C2C2C]/70">
                      {reg.legalName || reg.tradeName || "GST Registration"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {reg.isDefault && (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        Default
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRegistrationDialog(reg)}
                      className="border-gray-300 text-[#2C2C2C] hover:bg-gray-100 text-xs px-3"
                    >
                      Edit
                    </Button>
                    {!reg.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 text-xs px-3"
                        onClick={() => handleDeleteRegistration(reg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-[#2C2C2C]/60">
                  <span>
                    Type:{" "}
                    <span className="text-[#2C2C2C] font-semibold normal-case">
                      {REGISTRATION_TYPES.find(
                        (item) => item.value === reg.registrationType
                      )?.label || reg.registrationType}
                    </span>
                  </span>
                  <span>
                    State:{" "}
                    <span className="text-[#2C2C2C] font-semibold normal-case">
                      {reg.stateCode}{" "}
                      {reg.stateName ? `- ${reg.stateName}` : ""}
                    </span>
                  </span>
                  <span>
                    Active:{" "}
                    <span
                      className={`font-semibold ${
                        reg.isActive ? "text-emerald-600" : "text-gray-500"
                      }`}
                    >
                      {reg.isActive ? "Yes" : "No"}
                    </span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#2C2C2C]">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#2C2C2C]/60">
                    Start Date
                  </p>
                  <p className="font-semibold">
                    {new Date(reg.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-[#2C2C2C]/60">
                    End Date
                  </p>
                  <p className="font-semibold">
                    {reg.endDate
                      ? new Date(reg.endDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderTaxRatesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-[#2C2C2C]">GST Tax Rates</h3>
        <Button
          onClick={() => openTaxDialog()}
          className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white disabled:opacity-60"
          disabled={registrations.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add Tax Rate
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
        </div>
      ) : taxRates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
          No GST tax rates defined yet. Add HSN/SAC based tax rate splits to
          automate compliance.
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-[#2C2C2C]">HSN / SAC</TableHead>
                <TableHead className="text-[#2C2C2C]">Supply Type</TableHead>
                <TableHead className="text-[#2C2C2C]">CGST</TableHead>
                <TableHead className="text-[#2C2C2C]">SGST</TableHead>
                <TableHead className="text-[#2C2C2C]">IGST</TableHead>
                <TableHead className="text-[#2C2C2C]">Cess</TableHead>
                <TableHead className="text-[#2C2C2C]">Status</TableHead>
                <TableHead className="text-right text-[#2C2C2C]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">
                    {rate.hsnOrSac || "General"}
                  </TableCell>
                  <TableCell>{rate.supplyType}</TableCell>
                  <TableCell>{rate.cgstRate}%</TableCell>
                  <TableCell>{rate.sgstRate}%</TableCell>
                  <TableCell>{rate.igstRate}%</TableCell>
                  <TableCell>{rate.cessRate}%</TableCell>
                  <TableCell>
                    {rate.isActive ? (
                      <span className="text-emerald-600 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTaxDialog(rate)}
                        className="border-gray-300 text-[#2C2C2C] hover:bg-gray-100 text-xs px-3"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTaxRate(rate.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 text-xs px-3"
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

  const renderLedgerMappingsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-[#2C2C2C]">
          GST Ledger Mappings
        </h3>
        <Button
          onClick={() => openMappingDialog()}
          className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white disabled:opacity-60"
          disabled={registrations.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add Mapping
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#607c47]" />
        </div>
      ) : ledgerMappings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-muted-foreground bg-gray-50">
          No GST ledger mappings defined yet. Map GST liability/input ledgers
          for automated postings.
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-[#2C2C2C]">Mapping Type</TableHead>
                <TableHead className="text-[#2C2C2C]">Ledger Name</TableHead>
                <TableHead className="text-[#2C2C2C]">Ledger Code</TableHead>
                <TableHead className="text-right text-[#2C2C2C]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">
                    {LEDGER_MAPPING_LABELS[mapping.mappingType]}
                  </TableCell>
                  <TableCell>{mapping.ledgerName}</TableCell>
                  <TableCell>{mapping.ledgerCode || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMappingDialog(mapping)}
                        className="border-gray-300 text-[#2C2C2C] hover:bg-gray-100 text-xs px-3"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 text-xs px-3"
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

  return (
    <AuthGuard requireAuth>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6 pb-32">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                GST & Statutory Configuration
              </h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Manage GST registrations, tax rates, and ledger mappings to
                mirror TallyPrime’s compliance controls.
              </p>
            </div>
          </div>

          <div className="flex gap-2 border-b border-gray-200">
            {[
              {
                id: "registrations" as GstTab,
                label: "Registrations",
                icon: Building2,
              },
              {
                id: "taxRates" as GstTab,
                label: "Tax Rates",
                icon: BadgePercent,
              },
              {
                id: "mappings" as GstTab,
                label: "Ledger Mappings",
                icon: ListChecks,
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

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardContent className="p-6 space-y-6">
              {activeTab === "registrations" && renderRegistrationsTab()}
              {activeTab === "taxRates" && renderTaxRatesTab()}
              {activeTab === "mappings" && renderLedgerMappingsTab()}
            </CardContent>
          </Card>

          {/* Registration Dialog */}
          <Dialog
            open={registrationDialogOpen}
            onOpenChange={setRegistrationDialogOpen}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  {editingRegistration
                    ? "Edit GST Registration"
                    : "Create GST Registration"}
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  {editingRegistration
                    ? "Update GSTIN details and defaults."
                    : "Add a GST registration (GSTIN) for this entity."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GSTIN *</Label>
                    <Input
                      value={registrationForm.gstin}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          gstin: e.target.value,
                        })
                      }
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Registration Type</Label>
                    <Select
                      value={registrationForm.registrationType}
                      onValueChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,
                          registrationType: value as GstRegistrationType,
                        })
                      }
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                        <SelectValue placeholder="Select registration type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGISTRATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Legal Name</Label>
                    <Input
                      value={registrationForm.legalName || ""}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          legalName: e.target.value,
                        })
                      }
                      placeholder="Legal entity name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trade Name</Label>
                    <Input
                      value={registrationForm.tradeName || ""}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          tradeName: e.target.value,
                        })
                      }
                      placeholder="Trade / brand name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State Code *</Label>
                    <select
                      value={registrationForm.stateCode}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          stateCode: e.target.value,
                          stateName:
                            DEFAULT_STATE_CODES.find(
                              (item) => item.code === e.target.value
                            )?.name || "",
                        })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                    >
                      {DEFAULT_STATE_CODES.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>State Name</Label>
                    <Input
                      value={registrationForm.stateName || ""}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          stateName: e.target.value,
                        })
                      }
                      placeholder="State name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={registrationForm.startDate}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={registrationForm.endDate || ""}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          endDate: e.target.value ? e.target.value : null,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={registrationForm.isDefault ?? false}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          isDefault: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isDefault" className="cursor-pointer">
                      Mark as default registration
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={registrationForm.isActive ?? true}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          isActive: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setRegistrationDialogOpen(false)}
                    className="text-[#2C2C2C] border-gray-300 hover:bg-gray-100"
                    disabled={registrationSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveRegistration}
                    disabled={
                      registrationSaving ||
                      !registrationForm.gstin.trim() ||
                      !registrationForm.stateCode
                    }
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {registrationSaving
                      ? "Saving..."
                      : editingRegistration
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Tax Rate Dialog */}
          <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  {editingTaxRate ? "Edit Tax Rate" : "Create Tax Rate"}
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  Configure GST rate splits for HSN/SAC to automate voucher
                  postings.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Registration</Label>
                  <Select
                    value={taxForm.registrationId || ""}
                    onValueChange={(value) =>
                      setTaxForm({
                        ...taxForm,
                        registrationId: value || "",
                      })
                    }
                  >
                    <SelectTrigger className="w-full bg-white border-gray-200 text-[#2C2C2C]">
                      <SelectValue placeholder="Use default registration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Use default registration</SelectItem>
                      {registrations.map((reg) => (
                        <SelectItem key={reg.id} value={reg.id}>
                          {reg.gstin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supply Type</Label>
                    <select
                      value={taxForm.supplyType}
                      onChange={(e) =>
                        setTaxForm({
                          ...taxForm,
                          supplyType: e.target.value as GstTaxSupplyType,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                    >
                      {SUPPLY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>HSN / SAC</Label>
                    <Input
                      value={taxForm.hsnOrSac || ""}
                      onChange={(e) =>
                        setTaxForm({ ...taxForm, hsnOrSac: e.target.value })
                      }
                      placeholder="HSN or SAC code"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={taxForm.description || ""}
                    onChange={(e) =>
                      setTaxForm({ ...taxForm, description: e.target.value })
                    }
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {TAX_PERCENT_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={taxForm[field.key] ?? 0}
                        onChange={(e) =>
                          setTaxForm({
                            ...taxForm,
                            [field.key]: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Effective From</Label>
                    <Input
                      type="date"
                      value={taxForm.effectiveFrom || ""}
                      onChange={(e) =>
                        setTaxForm({
                          ...taxForm,
                          effectiveFrom: e.target.value || null,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effective To</Label>
                    <Input
                      type="date"
                      value={taxForm.effectiveTo || ""}
                      onChange={(e) =>
                        setTaxForm({
                          ...taxForm,
                          effectiveTo: e.target.value || null,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="taxActive"
                    checked={taxForm.isActive ?? true}
                    onChange={(e) =>
                      setTaxForm({ ...taxForm, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="taxActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setTaxDialogOpen(false)}
                    className="text-[#2C2C2C] border-gray-300 hover:bg-gray-100"
                    disabled={taxSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTaxRate}
                    disabled={taxSaving}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {taxSaving
                      ? "Saving..."
                      : editingTaxRate
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Ledger Mapping Dialog */}
          <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  {editingMapping
                    ? "Edit Ledger Mapping"
                    : "Create Ledger Mapping"}
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  Map GST ledgers to automate tax liability and input credit
                  postings.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Registration</Label>
                  <select
                    value={mappingForm.registrationId || ""}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        registrationId: e.target.value || "",
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                  >
                    <option value="">Use default registration</option>
                    {registrations.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.gstin}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Mapping Type *</Label>
                  <select
                    value={mappingForm.mappingType}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        mappingType: e.target.value as GstLedgerMappingType,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#2C2C2C]"
                  >
                    {LEDGER_MAPPING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Ledger Name *</Label>
                  <Input
                    value={mappingForm.ledgerName}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        ledgerName: e.target.value,
                      })
                    }
                    placeholder="Ledger name in accounting system"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ledger Code</Label>
                  <Input
                    value={mappingForm.ledgerCode || ""}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        ledgerCode: e.target.value,
                      })
                    }
                    placeholder="Optional ledger code"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={mappingForm.description || ""}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMappingDialogOpen(false)}
                    className="text-[#2C2C2C] border-gray-300 hover:bg-gray-100"
                    disabled={mappingSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveMapping}
                    disabled={mappingSaving || !mappingForm.ledgerName.trim()}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {mappingSaving
                      ? "Saving..."
                      : editingMapping
                        ? "Update"
                        : "Create"}
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
