"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  status: "Draft" | "Sent" | "Overdue" | "Paid" | "Partially Paid";
  items: InvoiceItem[];
  notes?: string;
  total: number;
  balanceDue: number;
  reminders: number; // number of AI reminders sent
}

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);

  // Simple mock initializer
  useEffect(() => {
    setInvoices([
      {
        id: "1",
        number: "INV-0001",
        clientName: "Acme Corp",
        clientEmail: "billing@acme.com",
        issueDate: "2025-10-01",
        dueDate: "2025-10-15",
        status: "Sent",
        items: [
          { id: "i1", description: "Monthly SaaS Subscription", quantity: 1, unitPrice: 499 },
          { id: "i2", description: "Onboarding Services", quantity: 1, unitPrice: 1200 },
        ],
        notes: "Thank you for your business!",
        total: 1699,
        balanceDue: 1699,
        reminders: 1,
      },
      {
        id: "2",
        number: "INV-0002",
        clientName: "Northwind LLC",
        clientEmail: "ap@northwind.com",
        issueDate: "2025-09-20",
        dueDate: "2025-10-05",
        status: "Overdue",
        items: [{ id: "i1", description: "Consulting Retainer", quantity: 1, unitPrice: 2500 }],
        notes: "Net 15 days.",
        total: 2500,
        balanceDue: 2500,
        reminders: 3,
      },
      {
        id: "3",
        number: "INV-0003",
        clientName: "Globex Inc",
        clientEmail: "accounts@globex.com",
        issueDate: "2025-09-01",
        dueDate: "2025-09-15",
        status: "Paid",
        items: [{ id: "i1", description: "Advisory", quantity: 5, unitPrice: 300 }],
        notes: "Paid via ACH.",
        total: 1500,
        balanceDue: 0,
        reminders: 0,
      },
    ]);
  }, []);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesText = [inv.number, inv.clientName, inv.clientEmail]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : inv.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const computeTotal = (items: InvoiceItem[]) =>
    items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const createInvoice = () => {
    setIsCreating(true);
    const today = new Date();
    const due = new Date();
    due.setDate(today.getDate() + 14);

    const draft: Invoice = {
      id: Date.now().toString(),
      number: `INV-${String(invoices.length + 1).padStart(4, "0")}`,
      clientName: "",
      clientEmail: "",
      issueDate: today.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      status: "Draft",
      items: [{ id: "i1", description: "Service", quantity: 1, unitPrice: 100 }],
      notes: "",
      total: 100,
      balanceDue: 100,
      reminders: 0,
    };
    setInvoices((prev) => [draft, ...prev]);
    toast.success("Draft invoice created");
    setIsCreating(false);
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates, total: computeTotal(inv.items), balanceDue: (computeTotal(inv.items) - (inv.total - inv.balanceDue)) } : inv))
    );
  };

  const addItem = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              items: [
                ...inv.items,
                { id: Date.now().toString(), description: "New Item", quantity: 1, unitPrice: 100 },
              ],
              total: computeTotal([...inv.items, { id: "tmp", description: "New Item", quantity: 1, unitPrice: 100 }]),
              balanceDue: computeTotal([...inv.items, { id: "tmp", description: "New Item", quantity: 1, unitPrice: 100 }]),
            }
          : inv
      )
    );
  };

  const recordPayment = (id: string, amount: number) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const newBalance = Math.max(0, inv.balanceDue - amount);
        const newStatus = newBalance === 0 ? "Paid" : "Partially Paid";
        return { ...inv, balanceDue: newBalance, status: newStatus };
      })
    );
    toast.success("Payment recorded");
  };

  const sendInvoice = (id: string) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: "Sent" } : inv)));
    toast.success("Invoice sent to client (mock)");
  };

  const sendReminder = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, reminders: inv.reminders + 1, status: inv.status === "Overdue" ? "Overdue" : "Sent" } : inv))
    );
    toast.success("AI reminder sent (mock)");
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
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Invoicing</h1>
                  <p className="text-sm text-[#2C2C2C]/70">Create invoices, track payments, and send AI reminders</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by number, client, or email"
                      className="pl-10 bg-white rounded-lg"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] bg-white">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={createInvoice} className="bg-[#607c47] hover:bg-[#4a6129] text-white">
                    <Plus className="h-4 w-4 mr-2" /> New Invoice
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <div className="text-sm text-blue-700">Open Invoices</div>
                      <div className="text-lg font-bold text-blue-900">{invoices.filter(i => i.status === "Sent" || i.status === "Overdue" || i.status === "Partially Paid").length}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
                    <div>
                      <div className="text-sm text-yellow-700">Overdue Amount</div>
                      <div className="text-lg font-bold text-yellow-900">{currency(invoices.filter(i => i.status === "Overdue").reduce((s,i)=>s+i.balanceDue,0))}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                    <div>
                      <div className="text-sm text-green-700">Collected (30d)</div>
                      <div className="text-lg font-bold text-green-900">{currency(invoices.filter(i => i.status === "Paid").reduce((s,i)=>s+i.total,0))}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invoices Table */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-[#2C2C2C]">Invoices ({filtered.length})</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Issue</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((inv) => (
                          <TableRow key={inv.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-[#2C2C2C]">{inv.number}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[#2C2C2C] font-medium">{inv.clientName || "—"}</span>
                                <span className="text-xs text-gray-600">{inv.clientEmail || ""}</span>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge className={
                                inv.status === "Paid"
                                  ? "bg-green-100 text-green-700"
                                  : inv.status === "Overdue"
                                  ? "bg-red-100 text-red-700"
                                  : inv.status === "Partially Paid"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
                              }>
                                {inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-[#2C2C2C]">{currency(inv.total)}</TableCell>
                            <TableCell className="font-semibold text-[#2C2C2C]">{currency(inv.balanceDue)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {inv.status === "Draft" && (
                                  <Button size="sm" className="bg-[#607c47] hover:bg-[#4a6129] text-white" onClick={() => sendInvoice(inv.id)}>
                                    <Send className="h-4 w-4 mr-1" /> Send
                                  </Button>
                                )}
                                {(inv.status === "Sent" || inv.status === "Overdue" || inv.status === "Partially Paid") && (
                                  <Button size="sm" variant="outline" className="border-gray-300 text-[#2C2C2C]" onClick={() => sendReminder(inv.id)}>
                                    <Mail className="h-4 w-4 mr-1" /> Remind
                                  </Button>
                                )}
                                {(inv.status !== "Paid") && (
                                  <Button size="sm" variant="outline" className="border-green-300 text-green-700" onClick={() => recordPayment(inv.id, Math.min(inv.balanceDue, 500))}>
                                    <DollarSign className="h-4 w-4 mr-1" /> Pay $500
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" className="border-gray-300" onClick={() => toast.success("Invoice downloaded (mock)") }>
                                  <Download className="h-4 w-4" />
                                </Button>
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
              {invoices.find((i) => i.status === "Draft") && (
                <Card className="bg-white rounded-xl border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C]">Edit Latest Draft</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {(() => {
                      const draft = invoices.find((i) => i.status === "Draft")!;
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-600">Client Name</label>
                              <Input className="mt-1 bg-white" value={draft.clientName} onChange={(e) => updateInvoice(draft.id, { clientName: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Client Email</label>
                              <Input className="mt-1 bg-white" value={draft.clientEmail} onChange={(e) => updateInvoice(draft.id, { clientEmail: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm text-gray-600">Issue Date</label>
                                <Input type="date" className="mt-1 bg-white" value={draft.issueDate} onChange={(e) => updateInvoice(draft.id, { issueDate: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-sm text-gray-600">Due Date</label>
                                <Input type="date" className="mt-1 bg-white" value={draft.dueDate} onChange={(e) => updateInvoice(draft.id, { dueDate: e.target.value })} />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">Notes</label>
                              <Textarea className="mt-1" value={draft.notes} onChange={(e) => updateInvoice(draft.id, { notes: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-[#2C2C2C]">Items</h4>
                              <Button size="sm" variant="outline" className="border-gray-300" onClick={() => addItem(draft.id)}>
                                <Plus className="h-4 w-4 mr-1" /> Add Item
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {draft.items.map((it, idx) => (
                                <div key={it.id} className="grid grid-cols-6 gap-2 items-center">
                                  <Input className="col-span-3 bg-white" value={it.description} onChange={(e) => {
                                    setInvoices((prev) => prev.map((inv) => {
                                      if (inv.id !== draft.id) return inv;
                                      const items = inv.items.map((x) => (x.id === it.id ? { ...x, description: e.target.value } : x));
                                      return { ...inv, items, total: computeTotal(items), balanceDue: computeTotal(items) };
                                    }));
                                  }} />
                                  <Input type="number" className="col-span-1 bg-white" value={it.quantity} onChange={(e) => {
                                    const qty = Number(e.target.value || 0);
                                    setInvoices((prev) => prev.map((inv) => {
                                      if (inv.id !== draft.id) return inv;
                                      const items = inv.items.map((x) => (x.id === it.id ? { ...x, quantity: qty } : x));
                                      return { ...inv, items, total: computeTotal(items), balanceDue: computeTotal(items) };
                                    }));
                                  }} />
                                  <Input type="number" className="col-span-2 bg-white" value={it.unitPrice} onChange={(e) => {
                                    const price = Number(e.target.value || 0);
                                    setInvoices((prev) => prev.map((inv) => {
                                      if (inv.id !== draft.id) return inv;
                                      const items = inv.items.map((x) => (x.id === it.id ? { ...x, unitPrice: price } : x));
                                      return { ...inv, items, total: computeTotal(items), balanceDue: computeTotal(items) };
                                    }));
                                  }} />
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between border-t pt-3">
                              <div className="text-sm text-gray-600">Total</div>
                              <div className="text-lg font-bold text-[#2C2C2C]">{currency(draft.total)}</div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button onClick={() => sendInvoice(draft.id)} className="bg-[#607c47] hover:bg-[#4a6129] text-white">
                                <Send className="h-4 w-4 mr-1" /> Send Invoice
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
