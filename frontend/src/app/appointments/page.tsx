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
  Calendar,
  Clock,
  Plus,
  Search,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { mockAppointments, Appointment } from "@/lib/mock-hospital-data";
import toast from "react-hot-toast";

const statusConfig: Record<
  Appointment["status"],
  { color: string; icon: React.ReactNode }
> = {
  Scheduled: {
    color: "bg-blue-100 text-blue-700",
    icon: <Clock className="h-3 w-3" />,
  },
  "In Progress": {
    color: "bg-amber-100 text-amber-700",
    icon: <Clock className="h-3 w-3" />,
  },
  Completed: {
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  Cancelled: {
    color: "bg-gray-100 text-gray-700",
    icon: <XCircle className="h-3 w-3" />,
  },
  "No Show": {
    color: "bg-red-100 text-red-700",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

const typeColors: Record<Appointment["type"], string> = {
  Consultation: "bg-teal-100 text-teal-700",
  "Follow-up": "bg-blue-100 text-blue-700",
  Procedure: "bg-purple-100 text-purple-700",
  Emergency: "bg-red-100 text-red-700",
  "Lab Test": "bg-orange-100 text-orange-700",
};

export default function AppointmentsPage() {
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const filtered = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch = [apt.patientName, apt.doctorName, apt.department]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || apt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    filtered.forEach((apt) => {
      if (!grouped[apt.date]) {
        grouped[apt.date] = [];
      }
      grouped[apt.date].push(apt);
    });
    // Sort appointments by time within each date
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.time.localeCompare(b.time));
    });
    return grouped;
  }, [filtered]);

  // Get unique dates sorted
  const dates = Object.keys(appointmentsByDate).sort();

  // Stats
  const todayCount = appointments.filter(
    (a) => a.date === new Date().toISOString().split("T")[0]
  ).length;
  const scheduledCount = appointments.filter(
    (a) => a.status === "Scheduled"
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === "Completed"
  ).length;

  const scheduleAppointment = () => {
    toast.success("Appointment scheduling form would open here (Demo Mode)");
  };

  const navigateDate = (direction: "prev" | "next") => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(current.toISOString().split("T")[0]);
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
                    <Calendar className="h-8 w-8 text-teal-600" />
                    Appointment Management
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Schedule, track, and manage patient appointments
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={scheduleAppointment}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Appointment
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
                      This is a demonstration module with sample appointments.
                      Scheduling features are for display purposes only.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-sm text-teal-700">
                        Today's Appointments
                      </div>
                      <div className="text-lg font-bold text-teal-900">
                        {todayCount}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-blue-700">Scheduled</div>
                      <div className="text-lg font-bold text-blue-900">
                        {scheduledCount}
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
                      <div className="text-sm text-green-700">Completed</div>
                      <div className="text-lg font-bold text-green-900">
                        {completedCount}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="rounded-xl border-0 shadow-lg bg-white">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    {/* Date Navigation */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDate("prev")}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-40"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDate("next")}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedDate(
                            new Date().toISOString().split("T")[0]
                          )
                        }
                      >
                        Today
                      </Button>
                    </div>

                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search patient or doctor..."
                          className="pl-10 bg-white rounded-lg w-64"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="w-[150px] bg-white">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="In Progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                          <SelectItem value="No Show">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appointments by Date */}
              {dates.length === 0 ? (
                <Card className="rounded-xl border-0 shadow-lg bg-white">
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No appointments found matching your criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                dates.map((date) => (
                  <Card
                    key={date}
                    className="rounded-xl border-0 shadow-lg bg-white"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-teal-600" />
                        {new Date(date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        <Badge className="ml-2 bg-gray-100 text-gray-700">
                          {appointmentsByDate[date].length} appointments
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {appointmentsByDate[date].map((apt) => (
                          <div
                            key={apt.id}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            {/* Time */}
                            <div className="w-20 text-center">
                              <div className="text-lg font-bold text-teal-600">
                                {apt.time}
                              </div>
                              <div className="text-xs text-gray-500">
                                {apt.duration} min
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="w-0.5 h-12 bg-teal-200 rounded-full" />

                            {/* Details */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {apt.patientName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {apt.patientId}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {apt.doctorName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {apt.department}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {apt.room}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge className={typeColors[apt.type]}>
                                  {apt.type}
                                </Badge>
                                <Badge
                                  className={`${statusConfig[apt.status].color} flex items-center gap-1`}
                                >
                                  {statusConfig[apt.status].icon}
                                  {apt.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
