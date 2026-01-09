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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HeartPulse,
  Search,
  Plus,
  Eye,
  Users,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  DollarSign,
  Building2,
} from "lucide-react";
import { mockPatients, Patient } from "@/lib/mock-hospital-data";
import toast from "react-hot-toast";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
});

export default function PatientsPage() {
  const [patients] = useState<Patient[]>(mockPatients);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filtered = useMemo(() => {
    return patients.filter((patient) => {
      return [patient.id, patient.name, patient.phone, patient.email]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [patients, search]);

  // Stats
  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => p.status === "Active").length;
  const patientsWithBalance = patients.filter((p) => p.balance > 0).length;
  const totalOutstanding = patients.reduce((sum, p) => sum + p.balance, 0);

  const addNewPatient = () => {
    toast.success("Patient registration form would open here (Demo Mode)");
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
                    <HeartPulse className="h-8 w-8 text-teal-600" />
                    Patient Management
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    View and manage patient records, medical history, and balances
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={addNewPatient}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Register Patient
                  </Button>
                </div>
              </div>

              {/* Demo Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">Demo Module</p>
                    <p className="text-sm text-amber-700">
                      This is a demonstration module with sample data. Patient management features are for display purposes only.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Users className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-sm text-teal-700">Total Patients</div>
                      <div className="text-lg font-bold text-teal-900">{totalPatients}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-green-700">Active</div>
                      <div className="text-lg font-bold text-green-900">{activePatients}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-orange-700">With Balance</div>
                      <div className="text-lg font-bold text-orange-900">{patientsWithBalance}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-rose-50 to-red-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <div className="text-sm text-rose-700">Outstanding</div>
                      <div className="text-lg font-bold text-rose-900">
                        {currencyFormatter.format(totalOutstanding)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Patient List */}
              <Card className="rounded-xl border-0 shadow-lg bg-white">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                      Patient Directory ({filtered.length})
                    </CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, ID, or contact..."
                        className="pl-10 bg-white rounded-lg w-72"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Insurance</TableHead>
                          <TableHead>Last Visit</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((patient) => (
                          <TableRow key={patient.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-teal-600">
                              {patient.id}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-[#2C2C2C]">
                                  {patient.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {patient.gender} • {patient.bloodType}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-sm">
                                <span className="text-gray-600">{patient.phone}</span>
                                <span className="text-xs text-gray-400">{patient.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{patient.insuranceProvider}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                {new Date(patient.lastVisit).toLocaleDateString("en-IN")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  patient.status === "Active"
                                    ? "bg-green-100 text-green-700"
                                    : patient.status === "Discharged"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }
                              >
                                {patient.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {patient.balance > 0 ? (
                                <span className="font-semibold text-rose-600">
                                  {currencyFormatter.format(patient.balance)}
                                </span>
                              ) : (
                                <span className="text-green-600">Cleared</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-300"
                                onClick={() => setSelectedPatient(patient)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Detail Dialog */}
              <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#2C2C2C] flex items-center gap-2">
                      <HeartPulse className="h-5 w-5 text-teal-600" />
                      Patient Details
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Complete patient information and medical history
                    </DialogDescription>
                  </DialogHeader>

                  {selectedPatient && (
                    <div className="space-y-6 pt-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs text-gray-500 uppercase tracking-wide">Patient ID</h4>
                            <p className="font-semibold text-teal-600">{selectedPatient.id}</p>
                          </div>
                          <div>
                            <h4 className="text-xs text-gray-500 uppercase tracking-wide">Full Name</h4>
                            <p className="font-medium">{selectedPatient.name}</p>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <h4 className="text-xs text-gray-500 uppercase tracking-wide">DOB</h4>
                              <p>{new Date(selectedPatient.dateOfBirth).toLocaleDateString("en-IN")}</p>
                            </div>
                            <div>
                              <h4 className="text-xs text-gray-500 uppercase tracking-wide">Gender</h4>
                              <p>{selectedPatient.gender}</p>
                            </div>
                            <div>
                              <h4 className="text-xs text-gray-500 uppercase tracking-wide">Blood</h4>
                              <p className="font-bold text-red-600">{selectedPatient.bloodType}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{selectedPatient.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{selectedPatient.email}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <span className="text-sm">{selectedPatient.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Insurance */}
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Insurance Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Provider:</span>
                            <span className="ml-2 font-medium">{selectedPatient.insuranceProvider}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">Policy #:</span>
                            <span className="ml-2 font-medium">{selectedPatient.policyNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Medical Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Medical History</h4>
                          {selectedPatient.medicalHistory.length > 0 ? (
                            <ul className="text-sm space-y-1">
                              {selectedPatient.medicalHistory.map((item, idx) => (
                                <li key={idx} className="text-gray-600">• {item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No significant history</p>
                          )}
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <h4 className="font-semibold text-red-900 mb-2">Allergies</h4>
                          {selectedPatient.allergies.length > 0 ? (
                            <ul className="text-sm space-y-1">
                              {selectedPatient.allergies.map((allergy, idx) => (
                                <li key={idx} className="text-red-600 font-medium">⚠ {allergy}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No known allergies</p>
                          )}
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <h4 className="font-semibold text-amber-900 mb-2">Emergency Contact</h4>
                        <div className="text-sm">
                          <span className="font-medium">{selectedPatient.emergencyContact}</span>
                          <span className="text-amber-600 ml-4">{selectedPatient.emergencyPhone}</span>
                        </div>
                      </div>

                      {/* Balance */}
                      {selectedPatient.balance > 0 && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-rose-900">Outstanding Balance</h4>
                            <p className="text-sm text-rose-600">Payment pending</p>
                          </div>
                          <span className="text-2xl font-bold text-rose-600">
                            {currencyFormatter.format(selectedPatient.balance)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                          Close
                        </Button>
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

