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
  BedDouble,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle,
  Wrench,
  XCircle,
  Phone,
  Activity,
  Layers,
  Package,
} from "lucide-react";
import {
  mockFacilities,
  Facility,
  getOccupancyStats,
} from "@/lib/mock-hospital-data";
import toast from "react-hot-toast";

const typeConfig: Record<
  Facility["type"],
  { color: string; icon: React.ReactNode }
> = {
  Ward: {
    color: "bg-blue-100 text-blue-700",
    icon: <BedDouble className="h-4 w-4" />,
  },
  ICU: {
    color: "bg-red-100 text-red-700",
    icon: <Activity className="h-4 w-4" />,
  },
  OT: {
    color: "bg-purple-100 text-purple-700",
    icon: <Activity className="h-4 w-4" />,
  },
  Lab: {
    color: "bg-green-100 text-green-700",
    icon: <Package className="h-4 w-4" />,
  },
  Pharmacy: {
    color: "bg-teal-100 text-teal-700",
    icon: <Package className="h-4 w-4" />,
  },
  Radiology: {
    color: "bg-indigo-100 text-indigo-700",
    icon: <Activity className="h-4 w-4" />,
  },
  Emergency: {
    color: "bg-orange-100 text-orange-700",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  OPD: {
    color: "bg-cyan-100 text-cyan-700",
    icon: <Building2 className="h-4 w-4" />,
  },
};

const statusConfig: Record<
  Facility["status"],
  { color: string; icon: React.ReactNode }
> = {
  Operational: {
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  "Under Maintenance": {
    color: "bg-amber-100 text-amber-700",
    icon: <Wrench className="h-3 w-3" />,
  },
  Closed: {
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export default function FacilitiesPage() {
  const [facilities] = useState<Facility[]>(mockFacilities);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return facilities.filter((facility) => {
      const matchesSearch = [facility.name, facility.floor]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || facility.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [facilities, search, typeFilter]);

  // Stats
  const occupancy = getOccupancyStats();
  const operationalCount = facilities.filter(
    (f) => f.status === "Operational"
  ).length;
  const maintenanceCount = facilities.filter(
    (f) => f.status === "Under Maintenance"
  ).length;

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
                    <BedDouble className="h-8 w-8 text-teal-600" />
                    Facility Management
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Monitor wards, departments, equipment, and bed occupancy
                  </p>
                </div>
              </div>

              {/* Demo Banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">Demo Module</p>
                    <p className="text-sm text-amber-700">
                      This is a demonstration module with sample facility data.
                      Real-time monitoring features are for display purposes
                      only.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <BedDouble className="h-5 w-5 text-teal-600" />
                      </div>
                      <div className="text-sm text-teal-700">Total Beds</div>
                    </div>
                    <div className="text-2xl font-bold text-teal-900">
                      {occupancy.totalBeds}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-sm text-blue-700">Occupied</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {occupancy.occupiedBeds}
                    </div>
                    <div className="text-xs text-blue-600">
                      {occupancy.occupancyRate}% occupancy
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-sm text-green-700">Available</div>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {occupancy.availableBeds}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Wrench className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="text-sm text-amber-700">Maintenance</div>
                    </div>
                    <div className="text-2xl font-bold text-amber-900">
                      {maintenanceCount}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="rounded-xl border-0 shadow-lg bg-white">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search facilities..."
                        className="pl-10 bg-white rounded-lg w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[160px] bg-white">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Ward">Wards</SelectItem>
                        <SelectItem value="ICU">ICU</SelectItem>
                        <SelectItem value="OT">Operation Theatre</SelectItem>
                        <SelectItem value="Lab">Laboratory</SelectItem>
                        <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="Radiology">Radiology</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="OPD">OPD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Facility List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((facility) => (
                  <Card
                    key={facility.id}
                    className="rounded-xl border-0 shadow-lg bg-white hover:shadow-xl transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-xl ${typeConfig[facility.type].color}`}
                          >
                            {typeConfig[facility.type].icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-[#2C2C2C]">
                              {facility.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={typeConfig[facility.type].color}
                              >
                                {facility.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Badge
                          className={`${statusConfig[facility.status].color} flex items-center gap-1`}
                        >
                          {statusConfig[facility.status].icon}
                          {facility.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Layers className="h-4 w-4 text-gray-400" />
                          {facility.floor}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          Ext: {facility.contactExtension}
                        </div>

                        {/* Bed Occupancy for wards */}
                        {facility.totalBeds && (
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">
                                Bed Occupancy
                              </span>
                              <span className="font-semibold">
                                {facility.occupiedBeds}/{facility.totalBeds}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  (facility.occupiedBeds || 0) /
                                    facility.totalBeds >
                                  0.9
                                    ? "bg-red-500"
                                    : (facility.occupiedBeds || 0) /
                                          facility.totalBeds >
                                        0.7
                                      ? "bg-amber-500"
                                      : "bg-green-500"
                                }`}
                                style={{
                                  width: `${((facility.occupiedBeds || 0) / facility.totalBeds) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>
                                {facility.totalBeds -
                                  (facility.occupiedBeds || 0)}{" "}
                                available
                              </span>
                              <span>
                                {(
                                  ((facility.occupiedBeds || 0) /
                                    facility.totalBeds) *
                                  100
                                ).toFixed(0)}
                                %
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Equipment list */}
                        {facility.equipment &&
                          facility.equipment.length > 0 && (
                            <div className="pt-3 border-t">
                              <p className="text-xs text-gray-500 mb-2">
                                Equipment
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {facility.equipment
                                  .slice(0, 3)
                                  .map((eq, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs border-gray-300"
                                    >
                                      {eq}
                                    </Badge>
                                  ))}
                                {facility.equipment.length > 3 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-gray-300"
                                  >
                                    +{facility.equipment.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
