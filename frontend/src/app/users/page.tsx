"use client";

import { useState, useEffect } from "react";
import { apiClient, TeamMember } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Mail, UserCircle, Building, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";

export default function UsersPage() {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.team.list();
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          setError(response.error || "Failed to fetch users");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6 p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                Users
              </h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                Manage all users in your organization.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-10 bg-white rounded-lg"
                />
              </div>
              <Button className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white">
                <Plus className="h-4 w-4" />
                Invite User
              </Button>
            </div>
          </div>

          <Card className="rounded-xl border-0 shadow-lg">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#607c47]"></div>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : users.length > 0 ? (
                <div className="overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <li key={user.id} className="p-6 hover:bg-gray-50/50">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <UserCircle className="h-8 w-8 text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {user.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge
                                variant="outline"
                                className="capitalize border-blue-200 text-blue-700 bg-blue-50"
                              >
                                {user.roles.join(", ")}
                              </Badge>
                            </div>
                          </div>
                          {user.createdAt && (
                            <div className="text-xs text-gray-500">
                              Joined{" "}
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No users
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No users found in the system.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
