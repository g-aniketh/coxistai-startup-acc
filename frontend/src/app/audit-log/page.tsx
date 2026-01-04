"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiClient,
  AuditLog,
  AuditLogFilters,
  AuditLogSummary,
  AuditAction,
  AuditEntityType,
  ExceptionReport,
  ExceptionReportItem,
} from "@/lib/api";
import { toast } from "react-hot-toast";
import { FileText, Filter, User, AlertTriangle } from "lucide-react";
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

type AuditTabType = "logs" | "exceptions";

export default function AuditLogPage() {
  const [activeTab, setActiveTab] = useState<AuditTabType>("logs");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [exceptionReports, setExceptionReports] =
    useState<ExceptionReport | null>(null);
  const [exceptionLoading, setExceptionLoading] = useState(false);
  const [exceptionAsOnDate, setExceptionAsOnDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.audit.list(filters);
      if (response.success) {
        const list = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setLogs(list);
        setTotal(response.data?.total ?? list.length);
      } else {
        setLogs([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await apiClient.audit.getSummary(
        filters.fromDate,
        filters.toDate
      );
      if (response.success) {
        setSummary(response.data ?? null);
      }
    } catch (error) {
      console.error("Failed to load audit summary:", error);
    }
  }, [filters.fromDate, filters.toDate]);

  const loadExceptionReports = useCallback(async () => {
    try {
      setExceptionLoading(true);
      const response = await apiClient.bookkeeping.getExceptionReports({
        asOnDate: exceptionAsOnDate || undefined,
      });
      if (response.success) {
        setExceptionReports(response.data ?? null);
      }
    } catch (error) {
      console.error("Failed to load exception reports:", error);
      toast.error("Failed to load exception reports");
    } finally {
      setExceptionLoading(false);
    }
  }, [exceptionAsOnDate]);

  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
      loadSummary();
    } else if (activeTab === "exceptions") {
      loadExceptionReports();
    }
  }, [loadLogs, loadSummary, loadExceptionReports, activeTab]);

  const handleFilterChange = <K extends keyof AuditLogFilters>(
    key: K,
    value: AuditLogFilters[K] | undefined
  ) => {
    setFilters((prev) => {
      const next: AuditLogFilters = { ...prev, [key]: value };
      if (key !== "offset") {
        next.offset = 0;
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return "bg-green-100 text-green-800";
      case AuditAction.UPDATE:
        return "bg-blue-100 text-blue-800";
      case AuditAction.DELETE:
        return "bg-red-100 text-red-800";
      case AuditAction.APPROVE:
        return "bg-purple-100 text-purple-800";
      case AuditAction.REJECT:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEntityTypeLabel = (entityType: AuditEntityType) => {
    return entityType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-6 md:p-8 lg:p-10 space-y-6 bg-[#f6f7fb] min-h-full pb-32">
          <div className="flex items-center gap-4 pb-2">
            <FileText className="h-9 w-9 text-[#607c47]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1f1f1f]">
                Audit Log
              </h1>
              <p className="text-sm text-[#1f1f1f]/70 mt-1">
                Track all changes and activities in your system
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === "logs"
                  ? "border-[#607c47] text-[#607c47] font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab("exceptions")}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === "exceptions"
                  ? "border-[#607c47] text-[#607c47] font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Exception Reports
            </button>
          </div>

          {activeTab === "logs" && (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-3 px-5 pt-5">
                      <CardTitle className="text-sm font-medium text-[#1f1f1f]/60">
                        Total Logs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="text-3xl font-semibold text-[#1f1f1f]">
                        {summary.totalLogs}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-3 px-5 pt-5">
                      <CardTitle className="text-sm font-medium text-[#1f1f1f]/60">
                        Creates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="text-3xl font-semibold text-emerald-600">
                        {summary.byAction.find(
                          (a) => a.action === AuditAction.CREATE
                        )?.count || 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-3 px-5 pt-5">
                      <CardTitle className="text-sm font-medium text-[#1f1f1f]/60">
                        Updates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="text-3xl font-semibold text-blue-600">
                        {summary.byAction.find(
                          (a) => a.action === AuditAction.UPDATE
                        )?.count || 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader className="pb-3 px-5 pt-5">
                      <CardTitle className="text-sm font-medium text-[#1f1f1f]/60">
                        Deletes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="text-3xl font-semibold text-red-500">
                        {summary.byAction.find(
                          (a) => a.action === AuditAction.DELETE
                        )?.count || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filters */}
              <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="flex items-center gap-2 text-[#1f1f1f]">
                    <Filter className="h-5 w-5 text-[#607c47]" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="entityType"
                        className="text-sm font-medium text-[#1f1f1f]/70"
                      >
                        Entity Type
                      </Label>
                      <Select
                        value={filters.entityType || "all"}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "entityType",
                            value === "all"
                              ? undefined
                              : (value as AuditEntityType)
                          )
                        }
                      >
                        <SelectTrigger id="entityType">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {Object.values(AuditEntityType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {getEntityTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="action"
                        className="text-sm font-medium text-[#1f1f1f]/70"
                      >
                        Action
                      </Label>
                      <Select
                        value={filters.action || "all"}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "action",
                            value === "all" ? undefined : (value as AuditAction)
                          )
                        }
                      >
                        <SelectTrigger id="action">
                          <SelectValue placeholder="All Actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          {Object.values(AuditAction).map((action) => (
                            <SelectItem key={action} value={action}>
                              {action}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="fromDate"
                        className="text-sm font-medium text-[#1f1f1f]/70"
                      >
                        From Date
                      </Label>
                      <Input
                        id="fromDate"
                        type="date"
                        value={filters.fromDate || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "fromDate",
                            e.target.value || undefined
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="toDate"
                        className="text-sm font-medium text-[#1f1f1f]/70"
                      >
                        To Date
                      </Label>
                      <Input
                        id="toDate"
                        type="date"
                        value={filters.toDate || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "toDate",
                            e.target.value || undefined
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Logs Table */}
              <Card className="rounded-3xl border border-gray-100 shadow-lg bg-white">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-lg font-semibold text-[#1f1f1f]">
                    Audit Logs ({total})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {loading ? (
                    <div className="text-center py-12 text-[#1f1f1f]/60">
                      Loading...
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No audit logs found
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/50">
                            <TableHead className="px-4 py-3 text-sm font-semibold text-[#1f1f1f]">
                              Date & Time
                            </TableHead>
                            <TableHead className="px-4 py-3 text-sm font-semibold text-[#1f1f1f]">
                              User
                            </TableHead>
                            <TableHead className="px-4 py-3 text-sm font-semibold text-[#1f1f1f]">
                              Action
                            </TableHead>
                            <TableHead className="px-4 py-3 text-sm font-semibold text-[#1f1f1f]">
                              Entity Type
                            </TableHead>
                            <TableHead className="px-4 py-3 text-sm font-semibold text-[#1f1f1f]">
                              Entity ID
                            </TableHead>
                            <TableHead className="px-4 py-3 text-sm font-semibold text-[#1f1f1f]">
                              Description
                            </TableHead>
                            <TableHead className="px-4 py-3 text-sm font-semibold text-[#1f1f1f]">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.map((log) => (
                            <TableRow
                              key={log.id}
                              className="hover:bg-gray-50/50"
                            >
                              <TableCell className="px-4 py-3 text-sm text-[#1f1f1f]">
                                {formatDate(log.createdAt)}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                {log.user ? (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-[#1f1f1f]/50" />
                                    <span className="text-sm text-[#1f1f1f]">
                                      {log.user.firstName || ""}{" "}
                                      {log.user.lastName || ""}
                                      {!log.user.firstName &&
                                        !log.user.lastName &&
                                        log.user.email}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    System
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <Badge className={getActionColor(log.action)}>
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm text-[#1f1f1f]/80">
                                {getEntityTypeLabel(log.entityType)}
                              </TableCell>
                              <TableCell className="px-4 py-3 font-mono text-xs text-[#607c47]">
                                {log.entityId}
                              </TableCell>
                              <TableCell className="px-4 py-3 max-w-xs truncate text-sm text-[#1f1f1f]/70">
                                {log.description || "-"}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => viewDetails(log)}
                                  className="text-[#607c47] hover:bg-[#607c47]/10"
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Pagination */}
                  {total > (filters.limit || 50) && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-[#1f1f1f]/70">
                        Showing {filters.offset || 0} to{" "}
                        {Math.min(
                          (filters.offset || 0) + (filters.limit || 50),
                          total
                        )}{" "}
                        of {total}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(filters.offset || 0) === 0}
                          className="border-gray-200"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              offset: Math.max(
                                0,
                                (prev.offset || 0) - (prev.limit || 50)
                              ),
                            }))
                          }
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            (filters.offset || 0) + (filters.limit || 50) >=
                            total
                          }
                          className="border-gray-200"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              offset: (prev.offset || 0) + (prev.limit || 50),
                            }))
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Details Dialog */}
              <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-[#2C2C2C]">
                      Audit Log Details
                    </DialogTitle>
                    <DialogDescription className="text-[#2C2C2C]/70">
                      Detailed information about this audit log entry
                    </DialogDescription>
                  </DialogHeader>
                  {selectedLog && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">
                            Date & Time
                          </Label>
                          <p className="text-sm font-medium">
                            {formatDate(selectedLog.createdAt)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">User</Label>
                          <p className="text-sm font-medium">
                            {selectedLog.user
                              ? `${selectedLog.user.firstName || ""} ${
                                  selectedLog.user.lastName || ""
                                }`.trim() || selectedLog.user.email
                              : "System"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Action
                          </Label>
                          <Badge className={getActionColor(selectedLog.action)}>
                            {selectedLog.action}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Entity Type
                          </Label>
                          <p className="text-sm font-medium">
                            {getEntityTypeLabel(selectedLog.entityType)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Entity ID
                          </Label>
                          <p className="text-xs font-mono">
                            {selectedLog.entityId}
                          </p>
                        </div>
                        {selectedLog.description && (
                          <div>
                            <Label className="text-xs text-gray-500">
                              Description
                            </Label>
                            <p className="text-sm">{selectedLog.description}</p>
                          </div>
                        )}
                      </div>

                      {selectedLog.oldValues && (
                        <div>
                          <Label className="text-xs text-gray-500">
                            Old Values
                          </Label>
                          <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(selectedLog.oldValues, null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedLog.newValues && (
                        <div>
                          <Label className="text-xs text-gray-500">
                            New Values
                          </Label>
                          <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(selectedLog.newValues, null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedLog.metadata && (
                        <div>
                          <Label className="text-xs text-gray-500">
                            Metadata
                          </Label>
                          <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(selectedLog.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      {(selectedLog.ipAddress || selectedLog.userAgent) && (
                        <div className="grid grid-cols-2 gap-4">
                          {selectedLog.ipAddress && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                IP Address
                              </Label>
                              <p className="text-xs font-mono">
                                {selectedLog.ipAddress}
                              </p>
                            </div>
                          )}
                          {selectedLog.userAgent && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                User Agent
                              </Label>
                              <p className="text-xs">{selectedLog.userAgent}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {(activeTab as AuditTabType) === "exceptions" && (
                <div className="space-y-6">
                  <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#1f1f1f]">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Exception Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                          <Label>As On Date</Label>
                          <Input
                            type="date"
                            value={exceptionAsOnDate}
                            onChange={(e) =>
                              setExceptionAsOnDate(e.target.value)
                            }
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={loadExceptionReports}
                            disabled={exceptionLoading}
                          >
                            Generate Report
                          </Button>
                        </div>
                      </div>

                      {exceptionLoading ? (
                        <div className="text-center py-12">Loading...</div>
                      ) : exceptionReports ? (
                        <div className="space-y-6">
                          {exceptionReports.summary && (
                            <div className="grid grid-cols-3 gap-4">
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="text-sm text-muted-foreground">
                                    Total Exceptions
                                  </div>
                                  <div className="text-2xl font-semibold text-[#2C2C2C]">
                                    {exceptionReports.summary.totalExceptions}
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="text-sm text-muted-foreground">
                                    Errors
                                  </div>
                                  <div className="text-2xl font-semibold text-red-600">
                                    {exceptionReports.summary.errors}
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="text-sm text-muted-foreground">
                                    Warnings
                                  </div>
                                  <div className="text-2xl font-semibold text-amber-600">
                                    {exceptionReports.summary.warnings}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}

                          {exceptionReports.exceptions &&
                            exceptionReports.exceptions.length > 0 && (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Ledger/Voucher</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead className="text-right">
                                      Amount
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {exceptionReports.exceptions.map(
                                    (exception: ExceptionReportItem, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>
                                          <Badge
                                            className={
                                              exception.severity === "ERROR"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-yellow-100 text-yellow-700"
                                            }
                                          >
                                            {exception.type}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {exception.ledgerName}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                          {exception.description}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            className={
                                              exception.severity === "ERROR"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-yellow-100 text-yellow-700"
                                            }
                                          >
                                            {exception.severity}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {exception.amount
                                            ? formatCurrency(exception.amount)
                                            : "—"}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            )}

                          {(!exceptionReports.exceptions ||
                            exceptionReports.exceptions.length === 0) && (
                            <div className="text-center py-12 text-muted-foreground">
                              No exceptions found. All balances and vouchers are
                              balanced.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          Select a date and click "Generate Report" to view
                          exception reports
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
