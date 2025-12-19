"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  apiClient,
  Role,
  RoleInput,
  Permission,
  PermissionInput,
  UserWithRoles,
} from "@/lib/api";
import { toast } from "react-hot-toast";
import { Users, Shield, Key, Plus, Edit, Trash2, Save, X } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showUserRoleDialog, setShowUserRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

  // Role form state
  const [roleForm, setRoleForm] = useState<RoleInput>({
    name: "",
    description: "",
    permissionIds: [],
  });

  // Permission form state
  const [permissionForm, setPermissionForm] = useState<PermissionInput>({
    action: "",
    subject: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes, usersRes] = await Promise.all([
        apiClient.roles.list(),
        apiClient.permissions.list(),
        apiClient.userRoles.list(),
      ]);

      if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
      if (permissionsRes.success && permissionsRes.data)
        setPermissions(permissionsRes.data);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load role management data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await apiClient.roles.create(roleForm);
      if (response.success) {
        toast.success("Role created successfully");
        setShowRoleDialog(false);
        setRoleForm({ name: "", description: "", permissionIds: [] });
        loadData();
      }
    } catch (error) {
      console.error("Failed to create role:", error);
      toast.error("Failed to create role");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await apiClient.roles.update(selectedRole.id, roleForm);
      if (response.success) {
        toast.success("Role updated successfully");
        setShowRoleDialog(false);
        setSelectedRole(null);
        setRoleForm({ name: "", description: "", permissionIds: [] });
        loadData();
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      const response = await apiClient.roles.delete(roleId);
      if (response.success) {
        toast.success("Role deleted successfully");
        loadData();
      }
    } catch (error) {
      console.error("Failed to delete role:", error);
      const message =
        error instanceof Error ? error.message : "Failed to delete role";
      toast.error(message);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      permissionIds: role.permissions.map((p) => p.id),
    });
    setShowRoleDialog(true);
  };

  const handleCreatePermission = async () => {
    try {
      const response = await apiClient.permissions.create(permissionForm);
      if (response.success) {
        toast.success("Permission created successfully");
        setShowPermissionDialog(false);
        setPermissionForm({ action: "", subject: "", description: "" });
        loadData();
      }
    } catch (error) {
      console.error("Failed to create permission:", error);
      toast.error("Failed to create permission");
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm("Are you sure you want to delete this permission?")) return;

    try {
      const response = await apiClient.permissions.delete(permissionId);
      if (response.success) {
        toast.success("Permission deleted successfully");
        loadData();
      }
    } catch (error) {
      console.error("Failed to delete permission:", error);
      const message =
        error instanceof Error ? error.message : "Failed to delete permission";
      toast.error(message);
    }
  };

  const handleSetUserRoles = async (userId: string, roleIds: string[]) => {
    try {
      const response = await apiClient.userRoles.set(userId, roleIds);
      if (response.success) {
        toast.success("User roles updated successfully");
        setShowUserRoleDialog(false);
        setSelectedUser(null);
        loadData();
      }
    } catch (error) {
      console.error("Failed to update user roles:", error);
      toast.error("Failed to update user roles");
    }
  };

  const handleAssignUserRoles = (user: UserWithRoles) => {
    setSelectedUser(user);
    setShowUserRoleDialog(true);
  };

  const togglePermission = (permissionId: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds?.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...(prev.permissionIds || []), permissionId],
    }));
  };

  const toggleUserRole = (roleId: string) => {
    if (!selectedUser) return;

    const currentRoleIds = selectedUser.roles.map((ur) => ur.role.id);
    const newRoleIds = currentRoleIds.includes(roleId)
      ? currentRoleIds.filter((id) => id !== roleId)
      : [...currentRoleIds, roleId];

    const newRoles = newRoleIds
      .map((id) => {
        const existing = selectedUser.roles.find((ur) => ur.role.id === id);
        if (existing) return existing;
        const role = roles.find((r) => r.id === id);
        if (!role) return null;
        return {
          role,
          assignedAt: new Date().toISOString(),
        };
      })
      .filter((r): r is { role: Role; assignedAt: string } => r !== null);

    setSelectedUser({
      ...selectedUser,
      roles: newRoles,
    });
  };

  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.subject]) {
        acc[perm.subject] = [];
      }
      acc[perm.subject].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const stats = [
    {
      label: "Active Roles",
      value: roles.length,
      description: "Predefined access blueprints",
    },
    {
      label: "Permissions",
      value: permissions.length,
      description: "Fine-grained access rules",
    },
    {
      label: "Team Members",
      value: users.length,
      description: "Users in this workspace",
    },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <Shield className="h-9 w-9 text-[#607c47]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1f1f1f]">
                Role Management
              </h1>
              <p className="text-sm text-[#1f1f1f]/70">
                Govern workspace access with intuitive roles and permissions
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="rounded-2xl border border-gray-100 shadow-sm bg-white"
              >
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-wide text-[#1f1f1f]/60">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold text-[#1f1f1f]">
                    {stat.value}
                  </p>
                  <p className="text-sm text-[#1f1f1f]/60">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="roles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-gray-100 p-1">
              <TabsTrigger
                value="roles"
                className="rounded-xl text-sm font-semibold text-[#1f1f1f]/70 data-[state=active]:bg-white data-[state=active]:text-[#1f1f1f] data-[state=active]:shadow-sm"
              >
                Roles
              </TabsTrigger>
              <TabsTrigger
                value="permissions"
                className="rounded-xl text-sm font-semibold text-[#1f1f1f]/70 data-[state=active]:bg-white data-[state=active]:text-[#1f1f1f] data-[state=active]:shadow-sm"
              >
                Permissions
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-xl text-sm font-semibold text-[#1f1f1f]/70 data-[state=active]:bg-white data-[state=active]:text-[#1f1f1f] data-[state=active]:shadow-sm"
              >
                User Assignments
              </TabsTrigger>
            </TabsList>

            {/* Roles Tab */}
            <TabsContent value="roles">
              <Card className="rounded-3xl border border-gray-100 shadow-lg bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl text-[#1f1f1f]">
                    Roles
                  </CardTitle>
                  <Dialog
                    open={showRoleDialog}
                    onOpenChange={setShowRoleDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setSelectedRole(null);
                          setRoleForm({
                            name: "",
                            description: "",
                            permissionIds: [],
                          });
                        }}
                        className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-[#2C2C2C]">
                          {selectedRole ? "Edit Role" : "Create New Role"}
                        </DialogTitle>
                        <DialogDescription className="text-[#2C2C2C]/70">
                          {selectedRole
                            ? "Update role details and permissions"
                            : "Create a new role and assign permissions"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="roleName">Role Name</Label>
                          <Input
                            id="roleName"
                            value={roleForm.name}
                            onChange={(e) =>
                              setRoleForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="e.g., Accountant, Manager"
                          />
                        </div>
                        <div>
                          <Label htmlFor="roleDescription">Description</Label>
                          <Textarea
                            id="roleDescription"
                            value={roleForm.description}
                            onChange={(e) =>
                              setRoleForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Describe what this role can do"
                          />
                        </div>
                        <div>
                          <Label>Permissions</Label>
                          <div className="mt-2 space-y-4 max-h-96 overflow-y-auto border rounded p-4">
                            {Object.entries(groupedPermissions).map(
                              ([subject, perms]) => (
                                <div key={subject} className="space-y-2">
                                  <h4 className="font-semibold text-sm">
                                    {subject}
                                  </h4>
                                  <div className="space-y-2 pl-4">
                                    {perms.map((perm) => (
                                      <div
                                        key={perm.id}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`perm-${perm.id}`}
                                          checked={roleForm.permissionIds?.includes(
                                            perm.id
                                          )}
                                          onCheckedChange={() =>
                                            togglePermission(perm.id)
                                          }
                                        />
                                        <Label
                                          htmlFor={`perm-${perm.id}`}
                                          className="text-sm font-normal cursor-pointer"
                                        >
                                          {perm.action} -{" "}
                                          {perm.description || perm.subject}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowRoleDialog(false);
                              setSelectedRole(null);
                              setRoleForm({
                                name: "",
                                description: "",
                                permissionIds: [],
                              });
                            }}
                            className="border-gray-200"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={
                              selectedRole ? handleUpdateRole : handleCreateRole
                            }
                            disabled={!roleForm.name}
                            className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                          >
                            {selectedRole ? "Update" : "Create"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12 text-[#1f1f1f]/60">
                      Loading...
                    </div>
                  ) : (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="text-[#1f1f1f]">
                              Name
                            </TableHead>
                            <TableHead className="text-[#1f1f1f]">
                              Description
                            </TableHead>
                            <TableHead className="text-[#1f1f1f]">
                              Permissions
                            </TableHead>
                            <TableHead className="text-[#1f1f1f]">
                              Users
                            </TableHead>
                            <TableHead className="text-right text-[#1f1f1f]">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roles.map((role) => (
                            <TableRow
                              key={role.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium">
                                {role.name}
                              </TableCell>
                              <TableCell className="text-sm text-[#1f1f1f]/70">
                                {role.description || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-gray-200 text-[#1f1f1f]"
                                >
                                  {role.permissions.length} permissions
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-gray-200 text-[#1f1f1f]"
                                >
                                  {role._count?.users || 0} users
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditRole(role)}
                                    className="border-gray-200 text-[#1f1f1f]"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="border-red-200 text-red-600"
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions">
              <Card className="rounded-3xl border border-gray-100 shadow-lg bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl text-[#1f1f1f]">
                    Permissions
                  </CardTitle>
                  <Dialog
                    open={showPermissionDialog}
                    onOpenChange={setShowPermissionDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setPermissionForm({
                            action: "",
                            subject: "",
                            description: "",
                          });
                        }}
                        className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Permission
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-[#2C2C2C]">
                          Create New Permission
                        </DialogTitle>
                        <DialogDescription className="text-[#2C2C2C]/70">
                          Create a new permission that can be assigned to roles
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="permAction">Action</Label>
                          <Input
                            id="permAction"
                            value={permissionForm.action}
                            onChange={(e) =>
                              setPermissionForm((prev) => ({
                                ...prev,
                                action: e.target.value,
                              }))
                            }
                            placeholder="e.g., manage, read, create"
                          />
                        </div>
                        <div>
                          <Label htmlFor="permSubject">Subject</Label>
                          <Input
                            id="permSubject"
                            value={permissionForm.subject}
                            onChange={(e) =>
                              setPermissionForm((prev) => ({
                                ...prev,
                                subject: e.target.value,
                              }))
                            }
                            placeholder="e.g., team, transactions, inventory"
                          />
                        </div>
                        <div>
                          <Label htmlFor="permDescription">Description</Label>
                          <Textarea
                            id="permDescription"
                            value={permissionForm.description}
                            onChange={(e) =>
                              setPermissionForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Describe what this permission allows"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowPermissionDialog(false)}
                            className="border-gray-200"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreatePermission}
                            disabled={
                              !permissionForm.action || !permissionForm.subject
                            }
                            className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12 text-[#1f1f1f]/60">
                      Loading...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedPermissions).map(
                        ([subject, perms]) => (
                          <div
                            key={subject}
                            className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-[#1f1f1f]">
                                {subject}
                              </h3>
                              <Badge
                                variant="outline"
                                className="border-gray-200 text-[#1f1f1f]"
                              >
                                {perms.length} permissions
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {perms.map((perm) => (
                                <div
                                  key={perm.id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100"
                                >
                                  <div className="space-y-1">
                                    <span className="font-medium text-[#1f1f1f]">
                                      {perm.action}
                                    </span>
                                    <div className="text-sm text-[#1f1f1f]/70">
                                      {perm.description || perm.subject}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge
                                      variant="outline"
                                      className="border-gray-200 text-[#1f1f1f]"
                                    >
                                      {perm._count?.roles || 0} roles
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleDeletePermission(perm.id)
                                      }
                                      className="border-red-200 text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Assignments Tab */}
            <TabsContent value="users">
              <Card className="rounded-3xl border border-gray-100 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-[#1f1f1f]">
                    User Role Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12 text-[#1f1f1f]/60">
                      Loading...
                    </div>
                  ) : (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="text-[#1f1f1f]">
                              User
                            </TableHead>
                            <TableHead className="text-[#1f1f1f]">
                              Email
                            </TableHead>
                            <TableHead className="text-[#1f1f1f]">
                              Roles
                            </TableHead>
                            <TableHead className="text-[#1f1f1f]">
                              Status
                            </TableHead>
                            <TableHead className="text-right text-[#1f1f1f]">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow
                              key={user.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium">
                                {user.firstName || user.lastName
                                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-sm text-[#1f1f1f]/70">
                                {user.email}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1.5">
                                  {user.roles.map((ur) => (
                                    <Badge
                                      key={ur.role.id}
                                      variant="outline"
                                      className="border-gray-200 text-[#1f1f1f]"
                                    >
                                      {ur.role.name}
                                    </Badge>
                                  ))}
                                  {user.roles.length === 0 && (
                                    <span className="text-gray-400 text-sm">
                                      No roles
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    user.isActive ? "default" : "outline"
                                  }
                                  className={
                                    user.isActive
                                      ? ""
                                      : "border-gray-200 text-[#1f1f1f]"
                                  }
                                >
                                  {user.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssignUserRoles(user)}
                                    className="border-gray-200 text-[#1f1f1f]"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Assign Roles
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* User Role Assignment Dialog */}
          <Dialog
            open={showUserRoleDialog}
            onOpenChange={setShowUserRoleDialog}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#2C2C2C]">
                  Assign Roles to User
                </DialogTitle>
                <DialogDescription className="text-[#2C2C2C]/70">
                  Select roles to assign to {selectedUser?.email}
                </DialogDescription>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={selectedUser.roles.some(
                            (ur) => ur.role.id === role.id
                          )}
                          onCheckedChange={() => toggleUserRole(role.id)}
                        />
                        <Label
                          htmlFor={`role-${role.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {role.name}
                          {role.description && (
                            <span className="text-gray-500 ml-2">
                              - {role.description}
                            </span>
                          )}
                        </Label>
                        <Badge variant="outline">
                          {role.permissions.length} permissions
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUserRoleDialog(false);
                        setSelectedUser(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedUser) {
                          handleSetUserRoles(
                            selectedUser.id,
                            selectedUser.roles.map((ur) => ur.role.id)
                          );
                        }
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
