'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  apiClient,
  Role,
  RoleInput,
  Permission,
  PermissionInput,
  UserWithRoles,
} from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Users, Shield, Key, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

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
    name: '',
    description: '',
    permissionIds: [],
  });

  // Permission form state
  const [permissionForm, setPermissionForm] = useState<PermissionInput>({
    action: '',
    subject: '',
    description: '',
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

      if (rolesRes.success) setRoles(rolesRes.data);
      if (permissionsRes.success) setPermissions(permissionsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load role management data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await apiClient.roles.create(roleForm);
      if (response.success) {
        toast.success('Role created successfully');
        setShowRoleDialog(false);
        setRoleForm({ name: '', description: '', permissionIds: [] });
        loadData();
      }
    } catch (error) {
      console.error('Failed to create role:', error);
      toast.error('Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await apiClient.roles.update(selectedRole.id, roleForm);
      if (response.success) {
        toast.success('Role updated successfully');
        setShowRoleDialog(false);
        setSelectedRole(null);
        setRoleForm({ name: '', description: '', permissionIds: [] });
        loadData();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await apiClient.roles.delete(roleId);
      if (response.success) {
        toast.success('Role deleted successfully');
        loadData();
      }
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map((p) => p.id),
    });
    setShowRoleDialog(true);
  };

  const handleCreatePermission = async () => {
    try {
      const response = await apiClient.permissions.create(permissionForm);
      if (response.success) {
        toast.success('Permission created successfully');
        setShowPermissionDialog(false);
        setPermissionForm({ action: '', subject: '', description: '' });
        loadData();
      }
    } catch (error) {
      console.error('Failed to create permission:', error);
      toast.error('Failed to create permission');
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;

    try {
      const response = await apiClient.permissions.delete(permissionId);
      if (response.success) {
        toast.success('Permission deleted successfully');
        loadData();
      }
    } catch (error: any) {
      console.error('Failed to delete permission:', error);
      toast.error(error.response?.data?.message || 'Failed to delete permission');
    }
  };

  const handleSetUserRoles = async (userId: string, roleIds: string[]) => {
    try {
      const response = await apiClient.userRoles.set(userId, roleIds);
      if (response.success) {
        toast.success('User roles updated successfully');
        setShowUserRoleDialog(false);
        setSelectedUser(null);
        loadData();
      }
    } catch (error) {
      console.error('Failed to update user roles:', error);
      toast.error('Failed to update user roles');
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

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.subject]) {
      acc[perm.subject] = [];
    }
    acc[perm.subject].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Role Management</h1>
              <p className="text-sm text-[#2C2C2C]/70">
                Manage roles, permissions, and user access control
              </p>
            </div>
          </div>

          <Tabs defaultValue="roles" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="users">User Assignments</TabsTrigger>
            </TabsList>

            {/* Roles Tab */}
            <TabsContent value="roles">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Roles</CardTitle>
                  <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setSelectedRole(null);
                          setRoleForm({ name: '', description: '', permissionIds: [] });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {selectedRole ? 'Edit Role' : 'Create New Role'}
                        </DialogTitle>
                        <DialogDescription>
                          {selectedRole
                            ? 'Update role details and permissions'
                            : 'Create a new role and assign permissions'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="roleName">Role Name</Label>
                          <Input
                            id="roleName"
                            value={roleForm.name}
                            onChange={(e) =>
                              setRoleForm((prev) => ({ ...prev, name: e.target.value }))
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
                              setRoleForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Describe what this role can do"
                          />
                        </div>
                        <div>
                          <Label>Permissions</Label>
                          <div className="mt-2 space-y-4 max-h-96 overflow-y-auto border rounded p-4">
                            {Object.entries(groupedPermissions).map(([subject, perms]) => (
                              <div key={subject} className="space-y-2">
                                <h4 className="font-semibold text-sm">{subject}</h4>
                                <div className="space-y-2 pl-4">
                                  {perms.map((perm) => (
                                    <div key={perm.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`perm-${perm.id}`}
                                        checked={roleForm.permissionIds?.includes(perm.id)}
                                        onCheckedChange={() => togglePermission(perm.id)}
                                      />
                                      <Label
                                        htmlFor={`perm-${perm.id}`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {perm.action} - {perm.description || perm.subject}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowRoleDialog(false);
                              setSelectedRole(null);
                              setRoleForm({ name: '', description: '', permissionIds: [] });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={selectedRole ? handleUpdateRole : handleCreateRole}
                            disabled={!roleForm.name}
                          >
                            {selectedRole ? 'Update' : 'Create'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Permissions</TableHead>
                          <TableHead>Users</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell className="font-medium">{role.name}</TableCell>
                            <TableCell>{role.description || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{role.permissions.length} permissions</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{role._count?.users || 0} users</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRole(role)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRole(role.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Permissions</CardTitle>
                  <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setPermissionForm({ action: '', subject: '', description: '' });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Permission
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Permission</DialogTitle>
                        <DialogDescription>
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
                              setPermissionForm((prev) => ({ ...prev, action: e.target.value }))
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
                              setPermissionForm((prev) => ({ ...prev, subject: e.target.value }))
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
                              setPermissionForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Describe what this permission allows"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowPermissionDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreatePermission}
                            disabled={!permissionForm.action || !permissionForm.subject}
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
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedPermissions).map(([subject, perms]) => (
                        <div key={subject} className="border rounded p-4">
                          <h3 className="font-semibold mb-2">{subject}</h3>
                          <div className="space-y-2">
                            {perms.map((perm) => (
                              <div
                                key={perm.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div>
                                  <span className="font-medium">{perm.action}</span>
                                  {perm.description && (
                                    <span className="text-sm text-gray-600 ml-2">
                                      - {perm.description}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="ml-2">
                                    {perm._count?.roles || 0} roles
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePermission(perm.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Assignments Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Role Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              {user.firstName || user.lastName
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : '-'}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.roles.map((ur) => (
                                  <Badge key={ur.role.id} variant="outline">
                                    {ur.role.name}
                                  </Badge>
                                ))}
                                {user.roles.length === 0 && (
                                  <span className="text-gray-400 text-sm">No roles</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={user.isActive ? 'default' : 'secondary'}
                              >
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAssignUserRoles(user)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Assign Roles
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* User Role Assignment Dialog */}
          <Dialog open={showUserRoleDialog} onOpenChange={setShowUserRoleDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Roles to User</DialogTitle>
                <DialogDescription>
                  Select roles to assign to {selectedUser?.email}
                </DialogDescription>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={selectedUser.roles.some((ur) => ur.role.id === role.id)}
                          onCheckedChange={() => toggleUserRole(role.id)}
                        />
                        <Label
                          htmlFor={`role-${role.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {role.name}
                          {role.description && (
                            <span className="text-gray-500 ml-2">- {role.description}</span>
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

