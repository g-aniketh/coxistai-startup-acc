"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  Calendar,
  User as UserIcon,
  DollarSign,
  Send,
  Mail,
  CheckCircle,
  Clock,
  Download,
  Plus,
  Filter,
  Search,
  HeartPulse,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

interface BillingItem {
  id: string;
  procedureCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface PatientBill {
  id: string;
  number: string;
  patientName: string;
  patientId: string;
  patientEmail: string;
  serviceDate: string;
  dueDate: string;
  status: "Draft" | "Sent" | "Overdue" | "Paid" | "Partially Paid" | "Insurance Pending";
  items: BillingItem[];
  diagnosisCode: string;
  department: string;
  insuranceProvider: string;
  notes?: string;
  total: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  balanceDue: number;
  reminders: number;
}

const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n
  );

export default function PatientBillingPage() {
  const [bills, setBills] = useState<PatientBill[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);

  // Initialize with healthcare-specific mock data
  useEffect(() => {
    setBills([
      {
        id: "1",
        number: "BILL-0001",
        patientName: "Rajesh Kumar",
        patientId: "PT-2024-0542",
        patientEmail: "rajesh.kumar@email.com",
        serviceDate: "2025-01-08",
        dueDate: "2025-01-22",
        status: "Insurance Pending",
        department: "Cardiology",
        diagnosisCode: "I25.10",
        insuranceProvider: "Star Health Insurance",
        items: [
          {
            id: "i1",
            procedureCode: "93000",
            description: "ECG - 12 Lead",
            quantity: 1,
            unitPrice: 1500,
          },
          {
            id: "i2",
            procedureCode: "93306",
            description: "Echocardiography",
            quantity: 1,
            unitPrice: 4500,
          },
          {
            id: "i3",
            procedureCode: "99213",
            description: "Cardiology Consultation",
            quantity: 1,
            unitPrice: 2000,
          },
        ],
        notes: "Follow-up appointment scheduled in 2 weeks",
        total: 8000,
        insuranceCoverage: 6400,
        patientResponsibility: 1600,
        balanceDue: 1600,
        reminders: 0,
      },
      {
        id: "2",
        number: "BILL-0002",
        patientName: "Priya Sharma",
        patientId: "PT-2024-0389",
        patientEmail: "priya.sharma@email.com",
        serviceDate: "2025-01-05",
        dueDate: "2025-01-12",
        status: "Overdue",
        department: "Orthopedics",
        diagnosisCode: "M54.5",
        insuranceProvider: "ICICI Lombard",
        items: [
          {
            id: "i1",
            procedureCode: "72148",
            description: "MRI Lumbar Spine",
            quantity: 1,
            unitPrice: 8500,
          },
          {
            id: "i2",
            procedureCode: "99214",
            description: "Orthopedic Consultation",
            quantity: 1,
            unitPrice: 1500,
          },
        ],
        notes: "Physical therapy recommended",
        total: 10000,
        insuranceCoverage: 7000,
        patientResponsibility: 3000,
        balanceDue: 3000,
        reminders: 2,
      },
      {
        id: "3",
        number: "BILL-0003",
        patientName: "Amit Patel",
        patientId: "PT-2024-0621",
        patientEmail: "amit.patel@email.com",
        serviceDate: "2025-01-02",
        dueDate: "2025-01-16",
        status: "Paid",
        department: "General Medicine",
        diagnosisCode: "J06.9",
        insuranceProvider: "Max Bupa",
        items: [
          {
            id: "i1",
            procedureCode: "99213",
            description: "General Consultation",
            quantity: 1,
            unitPrice: 800,
          },
          {
            id: "i2",
            procedureCode: "36415",
            description: "Blood Collection",
            quantity: 1,
            unitPrice: 200,
          },
          {
            id: "i3",
            procedureCode: "85025",
            description: "CBC with Differential",
            quantity: 1,
            unitPrice: 500,
          },
        ],
        notes: "Paid via UPI",
        total: 1500,
        insuranceCoverage: 1200,
        patientResponsibility: 300,
        balanceDue: 0,
        reminders: 0,
      },
      {
        id: "4",
        number: "BILL-0004",
        patientName: "Sunita Verma",
        patientId: "PT-2024-0718",
        patientEmail: "sunita.verma@email.com",
        serviceDate: "2025-01-10",
        dueDate: "2025-01-24",
        status: "Sent",
        department: "Gynecology",
        diagnosisCode: "N92.0",
        insuranceProvider: "HDFC Ergo",
        items: [
          {
            id: "i1",
            procedureCode: "76856",
            description: "Pelvic Ultrasound",
            quantity: 1,
            unitPrice: 2500,
          },
          {
            id: "i2",
            procedureCode: "99214",
            description: "OB-GYN Consultation",
            quantity: 1,
            unitPrice: 1200,
          },
        ],
        notes: "Lab results pending",
        total: 3700,
        insuranceCoverage: 2960,
        patientResponsibility: 740,
        balanceDue: 740,
        reminders: 1,
      },
    ]);
  }, []);

  const filtered = useMemo(() => {
    return bills.filter((bill) => {
      const matchesText = [bill.number, bill.patientName, bill.patientId, bill.department]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : bill.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [bills, search, statusFilter]);

  const computeTotal = (items: BillingItem[]) =>
    items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const createBill = () => {
    setIsCreating(true);
    const today = new Date();
    const due = new Date();
    due.setDate(today.getDate() + 14);

    const draft: PatientBill = {
      id: Date.now().toString(),
      number: `BILL-${String(bills.length + 1).padStart(4, "0")}`,
      patientName: "",
      patientId: `PT-2025-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      patientEmail: "",
      serviceDate: today.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      status: "Draft",
      department: "General Medicine",
      diagnosisCode: "",
      insuranceProvider: "",
      items: [
        { id: "i1", procedureCode: "99213", description: "General Consultation", quantity: 1, unitPrice: 800 },
      ],
      notes: "",
      total: 800,
      insuranceCoverage: 0,
      patientResponsibility: 800,
      balanceDue: 800,
      reminders: 0,
    };
    setBills((prev) => [draft, ...prev]);
    toast.success("Draft patient bill created");
    setIsCreating(false);
  };

  const updateBill = (id: string, updates: Partial<PatientBill>) => {
    setBills((prev) =>
      prev.map((bill) =>
        bill.id === id
          ? {
              ...bill,
              ...updates,
              total: computeTotal(bill.items),
              patientResponsibility: computeTotal(bill.items) - bill.insuranceCoverage,
              balanceDue: computeTotal(bill.items) - bill.insuranceCoverage,
            }
          : bill
      )
    );
  };

  const addItem = (id: string) => {
    setBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== id) return bill;
        const newItems = [
          ...bill.items,
          {
            id: Date.now().toString(),
            procedureCode: "",
            description: "New Service",
            quantity: 1,
            unitPrice: 500,
          },
        ];
        const total = computeTotal(newItems);
        return {
          ...bill,
          items: newItems,
          total,
          patientResponsibility: total - bill.insuranceCoverage,
          balanceDue: total - bill.insuranceCoverage,
        };
      })
    );
  };

  const recordPayment = (id: string, amount: number) => {
    setBills((prev) =>
      prev.map((bill) => {
        if (bill.id !== id) return bill;
        const newBalance = Math.max(0, bill.balanceDue - amount);
        const newStatus = newBalance === 0 ? "Paid" : "Partially Paid";
        return { ...bill, balanceDue: newBalance, status: newStatus };
      })
    );
    toast.success("Payment recorded successfully");
  };

  const sendBill = (id: string) => {
    setBills((prev) =>
      prev.map((bill) => (bill.id === id ? { ...bill, status: "Sent" } : bill))
    );
    toast.success("Patient bill sent successfully");
  };

  const sendReminder = (id: string) => {
    setBills((prev) =>
      prev.map((bill) =>
        bill.id === id
          ? {
              ...bill,
              reminders: bill.reminders + 1,
              status: bill.status === "Overdue" ? "Overdue" : "Sent",
            }
          : bill
      )
    );
    toast.success("Payment reminder sent to patient");
  };

  const submitToInsurance = (id: string) => {
    setBills((prev) =>
      prev.map((bill) =>
        bill.id === id ? { ...bill, status: "Insurance Pending" } : bill
      )
    );
    toast.success("Claim submitted to insurance provider");
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] flex items-center gap-2">
                    <HeartPulse className="h-8 w-8 text-teal-600" />
                    Patient Billing
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Create patient bills, submit insurance claims, and track payments
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by bill #, patient, or department"
                      className="pl-10 bg-white rounded-lg w-72"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Insurance Pending">Insurance Pending</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={createBill}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" /> New Patient Bill
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <FileText className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-sm text-teal-700">Open Bills</div>
                      <div className="text-lg font-bold text-teal-900">
                        {
                          bills.filter(
                            (b) =>
                              b.status === "Sent" ||
                              b.status === "Overdue" ||
                              b.status === "Partially Paid"
                          ).length
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ClipboardList className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-orange-700">Insurance Pending</div>
                      <div className="text-lg font-bold text-orange-900">
                        {bills.filter((b) => b.status === "Insurance Pending").length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Clock className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-red-700">Overdue Amount</div>
                      <div className="text-lg font-bold text-red-900">
                        {currency(
                          bills
                            .filter((b) => b.status === "Overdue")
                            .reduce((s, b) => s + b.balanceDue, 0)
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-green-700">Collected (30d)</div>
                      <div className="text-lg font-bold text-green-900">
                        {currency(
                          bills
                            .filter((b) => b.status === "Paid")
                            .reduce((s, b) => s + b.total, 0)
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bills Table */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                    Patient Bills ({filtered.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bill #</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Service Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Insurance</TableHead>
                          <TableHead>Balance Due</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((bill) => (
                          <TableRow key={bill.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-[#2C2C2C]">
                              {bill.number}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[#2C2C2C] font-medium">
                                  {bill.patientName || "—"}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {bill.patientId}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-300">
                                {bill.department}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(bill.serviceDate).toLocaleDateString("en-IN")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  bill.status === "Paid"
                                    ? "bg-green-100 text-green-700"
                                    : bill.status === "Overdue"
                                      ? "bg-red-100 text-red-700"
                                      : bill.status === "Insurance Pending"
                                        ? "bg-orange-100 text-orange-700"
                                        : bill.status === "Partially Paid"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-teal-100 text-teal-700"
                                }
                              >
                                {bill.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-[#2C2C2C]">
                              {currency(bill.total)}
                            </TableCell>
                            <TableCell className="text-green-600">
                              {currency(bill.insuranceCoverage)}
                            </TableCell>
                            <TableCell className="font-semibold text-[#2C2C2C]">
                              {currency(bill.balanceDue)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {bill.status === "Draft" && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-teal-600 hover:bg-teal-700 text-white"
                                      onClick={() => sendBill(bill.id)}
                                    >
                                      <Send className="h-4 w-4 mr-1" /> Send
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-orange-300 text-orange-700"
                                      onClick={() => submitToInsurance(bill.id)}
                                    >
                                      <ClipboardList className="h-4 w-4 mr-1" /> Insurance
                                    </Button>
                                  </>
                                )}
                                {(bill.status === "Sent" ||
                                  bill.status === "Overdue" ||
                                  bill.status === "Partially Paid") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-300 text-[#2C2C2C]"
                                    onClick={() => sendReminder(bill.id)}
                                  >
                                    <Mail className="h-4 w-4 mr-1" /> Remind
                                  </Button>
                                )}
                                {bill.status !== "Paid" && bill.status !== "Insurance Pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-300 text-green-700"
                                    onClick={() =>
                                      recordPayment(
                                        bill.id,
                                        Math.min(bill.balanceDue, bill.balanceDue)
                                      )
                                    }
                                  >
                                    <DollarSign className="h-4 w-4 mr-1" /> Pay
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Editor for the latest draft */}
              {bills.find((b) => b.status === "Draft") && (
                <Card className="bg-white rounded-xl border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-teal-600" />
                      Edit Patient Bill Draft
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {(() => {
                      const draft = bills.find((b) => b.status === "Draft")!;
                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-gray-600">Patient Name</label>
                                <Input
                                  className="mt-1 bg-white"
                                  value={draft.patientName}
                                  onChange={(e) =>
                                    updateBill(draft.id, { patientName: e.target.value })
                                  }
                                  placeholder="Enter patient name"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-600">Patient ID</label>
                                <Input
                                  className="mt-1 bg-white"
                                  value={draft.patientId}
                                  disabled
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-gray-600">Patient Email</label>
                                <Input
                                  className="mt-1 bg-white"
                                  value={draft.patientEmail}
                                  onChange={(e) =>
                                    updateBill(draft.id, { patientEmail: e.target.value })
                                  }
                                  placeholder="patient@email.com"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-600">Department</label>
                                <Select
                                  value={draft.department}
                                  onValueChange={(value) =>
                                    updateBill(draft.id, { department: value })
                                  }
                                >
                                  <SelectTrigger className="mt-1 bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="General Medicine">General Medicine</SelectItem>
                                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                                    <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                                    <SelectItem value="Gynecology">Gynecology</SelectItem>
                                    <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                                    <SelectItem value="Neurology">Neurology</SelectItem>
                                    <SelectItem value="Emergency">Emergency</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-gray-600">Diagnosis Code (ICD-10)</label>
                                <Input
                                  className="mt-1 bg-white"
                                  value={draft.diagnosisCode}
                                  onChange={(e) =>
                                    updateBill(draft.id, { diagnosisCode: e.target.value })
                                  }
                                  placeholder="e.g., J06.9"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-600">Insurance Provider</label>
                                <Input
                                  className="mt-1 bg-white"
                                  value={draft.insuranceProvider}
                                  onChange={(e) =>
                                    updateBill(draft.id, { insuranceProvider: e.target.value })
                                  }
                                  placeholder="e.g., Star Health"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-gray-600">Service Date</label>
                                <Input
                                  type="date"
                                  className="mt-1 bg-white"
                                  value={draft.serviceDate}
                                  onChange={(e) =>
                                    updateBill(draft.id, { serviceDate: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-600">Due Date</label>
                                <Input
                                  type="date"
                                  className="mt-1 bg-white"
                                  value={draft.dueDate}
                                  onChange={(e) =>
                                    updateBill(draft.id, { dueDate: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Notes</label>
                              <Textarea
                                className="mt-1"
                                value={draft.notes}
                                onChange={(e) =>
                                  updateBill(draft.id, { notes: e.target.value })
                                }
                                placeholder="Additional notes..."
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-[#2C2C2C]">Services & Procedures</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-300"
                                onClick={() => addItem(draft.id)}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Service
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {draft.items.map((it, idx) => (
                                <div
                                  key={it.id}
                                  className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg"
                                >
                                  <Input
                                    className="col-span-2 bg-white text-xs"
                                    value={it.procedureCode}
                                    placeholder="CPT Code"
                                    onChange={(e) => {
                                      setBills((prev) =>
                                        prev.map((bill) => {
                                          if (bill.id !== draft.id) return bill;
                                          const items = bill.items.map((x) =>
                                            x.id === it.id
                                              ? { ...x, procedureCode: e.target.value }
                                              : x
                                          );
                                          return { ...bill, items };
                                        })
                                      );
                                    }}
                                  />
                                  <Input
                                    className="col-span-5 bg-white text-xs"
                                    value={it.description}
                                    placeholder="Description"
                                    onChange={(e) => {
                                      setBills((prev) =>
                                        prev.map((bill) => {
                                          if (bill.id !== draft.id) return bill;
                                          const items = bill.items.map((x) =>
                                            x.id === it.id
                                              ? { ...x, description: e.target.value }
                                              : x
                                          );
                                          return { ...bill, items };
                                        })
                                      );
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    className="col-span-2 bg-white text-xs"
                                    value={it.quantity}
                                    onChange={(e) => {
                                      const qty = Number(e.target.value || 0);
                                      setBills((prev) =>
                                        prev.map((bill) => {
                                          if (bill.id !== draft.id) return bill;
                                          const items = bill.items.map((x) =>
                                            x.id === it.id ? { ...x, quantity: qty } : x
                                          );
                                          const total = computeTotal(items);
                                          return {
                                            ...bill,
                                            items,
                                            total,
                                            patientResponsibility: total - bill.insuranceCoverage,
                                            balanceDue: total - bill.insuranceCoverage,
                                          };
                                        })
                                      );
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    className="col-span-3 bg-white text-xs"
                                    value={it.unitPrice}
                                    onChange={(e) => {
                                      const price = Number(e.target.value || 0);
                                      setBills((prev) =>
                                        prev.map((bill) => {
                                          if (bill.id !== draft.id) return bill;
                                          const items = bill.items.map((x) =>
                                            x.id === it.id ? { ...x, unitPrice: price } : x
                                          );
                                          const total = computeTotal(items);
                                          return {
                                            ...bill,
                                            items,
                                            total,
                                            patientResponsibility: total - bill.insuranceCoverage,
                                            balanceDue: total - bill.insuranceCoverage,
                                          };
                                        })
                                      );
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="border-t pt-4 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Total Amount</span>
                                <span className="font-bold text-[#2C2C2C]">{currency(draft.total)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Insurance Coverage (Est.)</span>
                                <span className="text-green-600">{currency(draft.insuranceCoverage)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm border-t pt-2">
                                <span className="text-gray-600 font-medium">Patient Responsibility</span>
                                <span className="text-lg font-bold text-[#2C2C2C]">
                                  {currency(draft.patientResponsibility)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                              <Button
                                variant="outline"
                                className="border-orange-300 text-orange-700"
                                onClick={() => submitToInsurance(draft.id)}
                              >
                                <ClipboardList className="h-4 w-4 mr-1" /> Submit to Insurance
                              </Button>
                              <Button
                                onClick={() => sendBill(draft.id)}
                                className="bg-teal-600 hover:bg-teal-700 text-white"
                              >
                                <Send className="h-4 w-4 mr-1" /> Send to Patient
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
