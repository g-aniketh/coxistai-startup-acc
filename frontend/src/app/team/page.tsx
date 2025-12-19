"use client";

import { useEffect, useState } from "react";
import { apiClient, TeamMember } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/Badge";
import { Users, UserPlus, Mail, Shield, Ban, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function TeamPage() {
  const { can, isAdmin } = usePermissions();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    roleName: "Accountant",
    firstName: "",
    lastName: "",
  });
  const [inviting, setInviting] = useState(false);

  const canManageTeam = can("manage", "team");

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.team.list();
      if (response.success && response.data) {
        setMembers(response.data);
      }
    } catch (error) {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const response = await apiClient.team.invite(inviteForm);
      if (response.success) {
        toast.success("Account created successfully");
        if (response.data?.tempPassword) {
          setCreatedCredentials({
            email: response.data.email,
            tempPassword: response.data.tempPassword,
          });
          setShowCredentialsModal(true);
        }
        setInviteForm({
          email: "",
          roleName: "Accountant",
          firstName: "",
          lastName: "",
        });
        setIsInviteModalOpen(false);
        loadTeamMembers();
      } else {
        toast.error(response.message || "Failed to create account");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to create account";
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const handleDeactivate = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to deactivate ${email}?`)) {
      return;
    }

    try {
      const response = await apiClient.team.deactivate(userId);
      if (response.success) {
        toast.success("User deactivated successfully");
        loadTeamMembers();
      } else {
        toast.error(response.message || "Failed to deactivate user");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to deactivate user";
      toast.error(message);
    }
  };

  // Access denied if user can't read team
  if (!can("read", "team") && !isAdmin()) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="p-12 text-center max-w-md">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to view team management.
            </p>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-6 md:p-8 space-y-6 bg-[#f6f7fb] min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2 text-[#1f1f1f]">
                <Users className="h-8 w-8 text-[#607c47]" />
                Team Management
              </h1>
              <p className="text-sm text-[#1f1f1f]/70 mt-1">
                Manage your startup team members and their roles
              </p>
            </div>
            {canManageTeam && (
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-[#607c47] hover:bg-[#4a6129] text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            )}
          </div>

          {/* Team Members List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#607c47] mx-auto"></div>
                <p className="mt-4 text-[#1f1f1f]/60">
                  Loading team members...
                </p>
              </div>
            ) : members.length === 0 ? (
              <div className="col-span-full">
                <Card className="p-12 text-center rounded-3xl border border-dashed border-gray-300 bg-white">
                  <Users className="h-16 w-16 mx-auto mb-4 text-[#1f1f1f]/20" />
                  <h3 className="text-lg font-semibold mb-2 text-[#1f1f1f]">
                    No team members yet
                  </h3>
                  <p className="text-[#1f1f1f]/70 mb-4">
                    Create accounts for your team to collaborate on Coxist AI.
                  </p>
                  {canManageTeam && (
                    <Button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create first account
                    </Button>
                  )}
                </Card>
              </div>
            ) : (
              members.map((member) => (
                <Card
                  key={member.id}
                  className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1f1f1f]">
                        {member.firstName && member.lastName
                          ? `${member.firstName} ${member.lastName}`
                          : member.email}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-[#1f1f1f]/70 mt-1">
                        <Mail className="h-3 w-3 text-[#1f1f1f]/60" />
                        {member.email}
                      </div>
                    </div>
                    {!member.isActive && (
                      <Badge
                        variant="secondary"
                        className="bg-red-500/10 text-red-500"
                      >
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#1f1f1f]/60 mb-1">Roles</p>
                      <div className="flex flex-wrap gap-1.5">
                        {member.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className="border-gray-200 text-[#1f1f1f]"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-[#1f1f1f]/60">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {canManageTeam &&
                      member.isActive &&
                      !member.roles.includes("Admin") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeactivate(member.id, member.email)
                          }
                          className="w-full mt-2 border-red-200 text-red-600"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Deactivate
                        </Button>
                      )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Create Modal */}
          <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  Create Team Account
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  Add a teammate and hand them the credentials you generate
                  here.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={inviteForm.firstName}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={inviteForm.lastName}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@startup.com"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.roleName}
                    onValueChange={(value) =>
                      setInviteForm({ ...inviteForm, roleName: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Accountant">Accountant</SelectItem>
                      <SelectItem value="CTO">CTO</SelectItem>
                      <SelectItem value="Sales Lead">Sales Lead</SelectItem>
                      <SelectItem value="Operations Manager">
                        Operations Manager
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#1f1f1f]/60 mt-1">
                    Roles determine what they can access and manage.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteModalOpen(false)}
                    disabled={inviting}
                    className="border-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={inviting}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {inviting ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog
            open={showCredentialsModal}
            onOpenChange={setShowCredentialsModal}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  Share these credentials
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  Provide the details below to your teammate so they can log in
                  and change their password.
                </DialogDescription>
              </DialogHeader>
              {createdCredentials && (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                    <p className="text-xs uppercase tracking-wide text-[#1f1f1f]/60">
                      Email
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-1">
                      <p className="font-semibold text-[#1f1f1f]">
                        {createdCredentials.email}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            createdCredentials.email
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                    <p className="text-xs uppercase tracking-wide text-[#1f1f1f]/60">
                      Temporary Password
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-1">
                      <p className="font-semibold text-[#1f1f1f] break-all">
                        {createdCredentials.tempPassword}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            createdCredentials.tempPassword
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-[#607c47] hover:bg-[#4a6129] text-white"
                    onClick={() => setShowCredentialsModal(false)}
                  >
                    Done
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
