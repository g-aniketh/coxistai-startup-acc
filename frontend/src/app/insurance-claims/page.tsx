"use client";

import { useState, useMemo } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Search,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patientName: string;
  patientId: string;
  insuranceProvider: string;
  policyNumber: string;
  serviceDate: string;
  submissionDate: string;
  claimAmount: number;
  approvedAmount: number;
  status: "Submitted" | "In Review" | "Approved" | "Denied" | "Paid" | "Pending Info";
  department: string;
  diagnosisCode: string;
  procedureCodes: string[];
  notes: string;
  denialReason?: string;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
});

// Mock insurance claims data
const mockClaims: InsuranceClaim[] = [
  {
    id: "1",
    claimNumber: "CLM-2025-0001",
    patientName: "Rajesh Kumar",
    patientId: "PT-2024-0542",
    insuranceProvider: "Star Health Insurance",
    policyNumber: "SH-2024-789456",
    serviceDate: "2025-01-08",
    submissionDate: "2025-01-09",
    claimAmount: 85000,
    approvedAmount: 0,
    status: "In Review",
    department: "Cardiology",
    diagnosisCode: "I25.10",
    procedureCodes: ["93000", "93306", "99213"],
    notes: "Routine cardiac evaluation",
  },
  {
    id: "2",
    claimNumber: "CLM-2025-0002",
    patientName: "Priya Sharma",
    patientId: "PT-2024-0389",
    insuranceProvider: "ICICI Lombard",
    policyNumber: "IL-2023-456123",
    serviceDate: "2025-01-05",
    submissionDate: "2025-01-06",
    claimAmount: 125000,
    approvedAmount: 95000,
    status: "Approved",
    department: "Orthopedics",
    diagnosisCode: "M54.5",
    procedureCodes: ["72148", "99214"],
    notes: "MRI and consultation for lower back pain",
  },
  {
    id: "3",
    claimNumber: "CLM-2025-0003",
    patientName: "Amit Patel",
    patientId: "PT-2024-0621",
    insuranceProvider: "Max Bupa",
    policyNumber: "MB-2024-321654",
    serviceDate: "2025-01-02",
    submissionDate: "2025-01-03",
    claimAmount: 18500,
    approvedAmount: 18500,
    status: "Paid",
    department: "General Medicine",
    diagnosisCode: "J06.9",
    procedureCodes: ["99213", "36415", "85025"],
    notes: "General checkup and blood work",
  },
  {
    id: "4",
    claimNumber: "CLM-2025-0004",
    patientName: "Sunita Verma",
    patientId: "PT-2024-0718",
    insuranceProvider: "HDFC Ergo",
    policyNumber: "HE-2024-159753",
    serviceDate: "2025-01-10",
    submissionDate: "2025-01-11",
    claimAmount: 42000,
    approvedAmount: 0,
    status: "Submitted",
    department: "Gynecology",
    diagnosisCode: "N92.0",
    procedureCodes: ["76856", "99214"],
    notes: "Pelvic ultrasound and consultation",
  },
  {
    id: "5",
    claimNumber: "CLM-2025-0005",
    patientName: "Vikram Singh",
    patientId: "PT-2024-0456",
    insuranceProvider: "Star Health Insurance",
    policyNumber: "SH-2023-654987",
    serviceDate: "2025-01-03",
    submissionDate: "2025-01-04",
    claimAmount: 225000,
    approvedAmount: 0,
    status: "Denied",
    department: "Surgery",
    diagnosisCode: "K35.80",
    procedureCodes: ["44950", "99223"],
    denialReason: "Pre-authorization not obtained",
    notes: "Appendectomy procedure",
  },
  {
    id: "6",
    claimNumber: "CLM-2025-0006",
    patientName: "Meera Reddy",
    patientId: "PT-2024-0892",
    insuranceProvider: "Bajaj Allianz",
    policyNumber: "BA-2024-852963",
    serviceDate: "2025-01-07",
    submissionDate: "2025-01-08",
    claimAmount: 68000,
    approvedAmount: 0,
    status: "Pending Info",
    department: "Neurology",
    diagnosisCode: "G43.909",
    procedureCodes: ["70551", "99215"],
    notes: "MRI brain and specialist consultation for chronic migraines",
  },
  {
    id: "7",
    claimNumber: "CLM-2024-0892",
    patientName: "Rohit Kapoor",
    patientId: "PT-2024-0234",
    insuranceProvider: "ICICI Lombard",
    policyNumber: "IL-2024-741258",
    serviceDate: "2024-12-28",
    submissionDate: "2024-12-29",
    claimAmount: 156000,
    approvedAmount: 145000,
    status: "Paid",
    department: "Cardiology",
    diagnosisCode: "I21.0",
    procedureCodes: ["93458", "99223", "93000"],
    notes: "Cardiac catheterization and monitoring",
  },
  {
    id: "8",
    claimNumber: "CLM-2024-0891",
    patientName: "Anita Desai",
    patientId: "PT-2024-0567",
    insuranceProvider: "Max Bupa",
    policyNumber: "MB-2023-963852",
    serviceDate: "2024-12-25",
    submissionDate: "2024-12-26",
    claimAmount: 92000,
    approvedAmount: 85000,
    status: "Approved",
    department: "Oncology",
    diagnosisCode: "C50.911",
    procedureCodes: ["19301", "38525", "99223"],
    notes: "Breast biopsy and pathology",
  },
];

const statusConfig: Record<InsuranceClaim["status"], { color: string; icon: React.ReactNode }> = {
  Submitted: { color: "bg-teal-100 text-teal-700", icon: <Send className="h-3 w-3" /> },
  "In Review": { color: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" /> },
  Approved: { color: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3" /> },
  Denied: { color: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" /> },
  Paid: { color: "bg-blue-100 text-blue-700", icon: <DollarSign className="h-3 w-3" /> },
  "Pending Info": { color: "bg-orange-100 text-orange-700", icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function InsuranceClaimsPage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>(mockClaims);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return claims.filter((claim) => {
      const matchesSearch = [
        claim.claimNumber,
        claim.patientName,
        claim.patientId,
        claim.insuranceProvider,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [claims, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedClaims = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate stats
  const totalSubmitted = claims.filter((c) => c.status === "Submitted").length;
  const totalInReview = claims.filter((c) => c.status === "In Review").length;
  const totalApproved = claims.filter((c) => c.status === "Approved" || c.status === "Paid").length;
  const totalDenied = claims.filter((c) => c.status === "Denied").length;
  const totalClaimAmount = claims.reduce((sum, c) => sum + c.claimAmount, 0);
  const totalApprovedAmount = claims.reduce((sum, c) => sum + c.approvedAmount, 0);

  const submitNewClaim = () => {
    toast.success("New claim submission form would open here");
  };

  const resubmitClaim = (claim: InsuranceClaim) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claim.id ? { ...c, status: "Submitted" as const, denialReason: undefined } : c
      )
    );
    toast.success(`Claim ${claim.claimNumber} resubmitted`);
    setSelectedClaim(null);
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 min-h-screen">
          <div className="overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-6 pb-32">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] flex items-center gap-3">
                    <ClipboardList className="h-8 w-8 text-teal-600" />
                    Insurance Claims Management
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Submit, track, and manage insurance claims across all payers
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={submitNewClaim}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Submit New Claim
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Send className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-sm text-teal-700">Pending Submission</div>
                      <div className="text-lg font-bold text-teal-900">{totalSubmitted}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-amber-50 to-yellow-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm text-amber-700">In Review</div>
                      <div className="text-lg font-bold text-amber-900">{totalInReview}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-green-700">Approved/Paid</div>
                      <div className="text-lg font-bold text-green-900">{totalApproved}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-red-700">Denied</div>
                      <div className="text-lg font-bold text-red-900">{totalDenied}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-white">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Claims Submitted</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currencyFormatter.format(totalClaimAmount)}
                      </p>
                    </div>
                    <div className="p-4 bg-teal-100 rounded-xl">
                      <FileText className="h-8 w-8 text-teal-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-white">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Approved/Collected</p>
                      <p className="text-2xl font-bold text-green-600">
                        {currencyFormatter.format(totalApprovedAmount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((totalApprovedAmount / totalClaimAmount) * 100).toFixed(1)}% approval rate
                      </p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-xl">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Table */}
              <Card className="rounded-xl border-0 shadow-lg bg-white">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                      Claims List ({filtered.length})
                    </CardTitle>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search claims..."
                          className="pl-10 bg-white rounded-lg w-64"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px] bg-white">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Submitted">Submitted</SelectItem>
                          <SelectItem value="In Review">In Review</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Denied">Denied</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Pending Info">Pending Info</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Claim #</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Insurance</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Service Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Claim Amount</TableHead>
                          <TableHead className="text-right">Approved</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedClaims.map((claim) => (
                          <TableRow key={claim.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-[#2C2C2C]">
                              {claim.claimNumber}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[#2C2C2C] font-medium">
                                  {claim.patientName}
                                </span>
                                <span className="text-xs text-gray-500">{claim.patientId}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{claim.insuranceProvider}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-300">
                                {claim.department}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                {new Date(claim.serviceDate).toLocaleDateString("en-IN")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${statusConfig[claim.status].color} flex items-center gap-1 w-fit`}
                              >
                                {statusConfig[claim.status].icon}
                                {claim.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-[#2C2C2C]">
                              {currencyFormatter.format(claim.claimAmount)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              {claim.approvedAmount > 0
                                ? currencyFormatter.format(claim.approvedAmount)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-300"
                                onClick={() => setSelectedClaim(claim)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}{" "}
                        claims
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Claim Detail Dialog */}
              <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#2C2C2C] flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-teal-600" />
                      Claim Details - {selectedClaim?.claimNumber}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      View complete claim information and status
                    </DialogDescription>
                  </DialogHeader>

                  {selectedClaim && (
                    <div className="space-y-6 pt-4">
                      {/* Status Banner */}
                      <div
                        className={`p-4 rounded-lg ${
                          selectedClaim.status === "Denied"
                            ? "bg-red-50 border border-red-200"
                            : selectedClaim.status === "Paid"
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Badge className={statusConfig[selectedClaim.status].color}>
                            {statusConfig[selectedClaim.status].icon}
                            <span className="ml-1">{selectedClaim.status}</span>
                          </Badge>
                          {selectedClaim.denialReason && (
                            <span className="text-sm text-red-600">
                              Reason: {selectedClaim.denialReason}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Patient & Insurance Info */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Patient Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium">{selectedClaim.patientName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Patient ID:</span>
                              <span className="font-medium">{selectedClaim.patientId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Department:</span>
                              <span className="font-medium">{selectedClaim.department}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Insurance Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Provider:</span>
                              <span className="font-medium">{selectedClaim.insuranceProvider}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Policy #:</span>
                              <span className="font-medium">{selectedClaim.policyNumber}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Service Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service Date:</span>
                            <span className="font-medium">
                              {new Date(selectedClaim.serviceDate).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Submission Date:</span>
                            <span className="font-medium">
                              {new Date(selectedClaim.submissionDate).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Diagnosis Code:</span>
                            <span className="font-medium">{selectedClaim.diagnosisCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Procedure Codes:</span>
                            <span className="font-medium">
                              {selectedClaim.procedureCodes.join(", ")}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <span className="text-gray-600 text-sm">Notes:</span>
                          <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{selectedClaim.notes}</p>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Claim Amount:</span>
                          <span className="font-semibold">
                            {currencyFormatter.format(selectedClaim.claimAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Approved Amount:</span>
                          <span className="font-semibold text-green-600">
                            {selectedClaim.approvedAmount > 0
                              ? currencyFormatter.format(selectedClaim.approvedAmount)
                              : "Pending"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setSelectedClaim(null)}>
                          Close
                        </Button>
                        {selectedClaim.status === "Denied" && (
                          <Button
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => resubmitClaim(selectedClaim)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Resubmit Claim
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

