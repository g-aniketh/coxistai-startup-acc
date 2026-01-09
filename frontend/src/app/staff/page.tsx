"use client";

import { useState, useMemo } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
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
  Stethoscope,
  Search,
  Plus,
  Eye,
  Users,
  UserCog,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Building2,
  Clock,
  Award,
} from "lucide-react";
import { mockStaff, StaffMember } from "@/lib/mock-hospital-data";
import toast from "react-hot-toast";

const roleColors: Record<StaffMember["role"], string> = {
  Physician: "bg-teal-100 text-teal-700",
  Nurse: "bg-blue-100 text-blue-700",
  Technician: "bg-purple-100 text-purple-700",
  Admin: "bg-orange-100 text-orange-700",
  Support: "bg-gray-100 text-gray-700",
};

const shiftColors: Record<StaffMember["shift"], string> = {
  Day: "bg-amber-100 text-amber-700",
  Night: "bg-indigo-100 text-indigo-700",
  Rotating: "bg-green-100 text-green-700",
};

export default function StaffPage() {
  const [staff] = useState<StaffMember[]>(mockStaff);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const departments = useMemo(() => {
    const depts = new Set(staff.map((s) => s.department));
    return Array.from(depts).sort();
  }, [staff]);

  const filtered = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch = [member.id, member.name, member.email, member.department]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesDept = departmentFilter === "all" || member.department === departmentFilter;
      return matchesSearch && matchesRole && matchesDept;
    });
  }, [staff, search, roleFilter, departmentFilter]);

  // Stats
  const totalStaff = staff.length;
  const physicians = staff.filter((s) => s.role === "Physician").length;
  const nurses = staff.filter((s) => s.role === "Nurse").length;
  const activeStaff = staff.filter((s) => s.status === "Active").length;

  const addStaff = () => {
    toast.success("Staff registration form would open here (Demo Mode)");
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
                    <Stethoscope className="h-8 w-8 text-teal-600" />
                    Staff Management
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Manage physicians, nurses, and support staff directory
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={addStaff}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
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
                      This is a demonstration module with sample staff data. Management features are for display purposes only.
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
                      <div className="text-sm text-teal-700">Total Staff</div>
                      <div className="text-lg font-bold text-teal-900">{totalStaff}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-blue-700">Physicians</div>
                      <div className="text-lg font-bold text-blue-900">{physicians}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <UserCog className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-purple-700">Nurses</div>
                      <div className="text-lg font-bold text-purple-900">{nurses}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-green-700">Active</div>
                      <div className="text-lg font-bold text-green-900">{activeStaff}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and List */}
              <Card className="rounded-xl border-0 shadow-lg bg-white">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                      Staff Directory ({filtered.length})
                    </CardTitle>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search staff..."
                          className="pl-10 bg-white rounded-lg w-64"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[130px] bg-white">
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="Physician">Physicians</SelectItem>
                          <SelectItem value="Nurse">Nurses</SelectItem>
                          <SelectItem value="Technician">Technicians</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[160px] bg-white">
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((member) => (
                      <Card
                        key={member.id}
                        className="border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedStaff(member)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                                {member.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                <p className="text-xs text-gray-500">{member.id}</p>
                              </div>
                            </div>
                            <Badge
                              className={
                                member.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : member.status === "On Leave"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            >
                              {member.status}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={roleColors[member.role]}>{member.role}</Badge>
                              <Badge className={shiftColors[member.shift]}>{member.shift}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              {member.department}
                            </div>
                            {member.specialization && (
                              <div className="text-xs text-gray-500">
                                {member.specialization}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Staff Detail Dialog */}
              <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-[#2C2C2C] flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-teal-600" />
                      Staff Details
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      Complete staff member information
                    </DialogDescription>
                  </DialogHeader>

                  {selectedStaff && (
                    <div className="space-y-6 pt-4">
                      {/* Header */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                          {selectedStaff.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedStaff.name}</h3>
                          <p className="text-sm text-gray-500">{selectedStaff.id}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge className={roleColors[selectedStaff.role]}>{selectedStaff.role}</Badge>
                            <Badge
                              className={
                                selectedStaff.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            >
                              {selectedStaff.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Department:</span>
                            <span className="font-medium">{selectedStaff.department}</span>
                          </div>
                          {selectedStaff.specialization && (
                            <div className="flex items-center gap-2 text-sm">
                              <Award className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Specialization:</span>
                              <span className="font-medium">{selectedStaff.specialization}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Shift:</span>
                            <Badge className={shiftColors[selectedStaff.shift]}>{selectedStaff.shift}</Badge>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{selectedStaff.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-xs">{selectedStaff.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Joined:</span>
                            <span>{new Date(selectedStaff.joinDate).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Credentials */}
                      {selectedStaff.credentials && selectedStaff.credentials.length > 0 && (
                        <div className="p-4 bg-teal-50 rounded-lg">
                          <h4 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Credentials & Certifications
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedStaff.credentials.map((cred, idx) => (
                              <Badge key={idx} variant="outline" className="border-teal-300 text-teal-700">
                                {cred}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setSelectedStaff(null)}>
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

