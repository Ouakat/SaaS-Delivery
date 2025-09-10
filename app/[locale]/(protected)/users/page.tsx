"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/routing";
import UsersTable from "@/components/users/users-table";
import { useAuthStore } from "@/lib/stores/auth.store";

const UsersPage = () => {
  const { hasPermission } = useAuthStore();
  const canCreateUsers = hasPermission("users:create");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            Users Management
          </h1>
          <p className="text-default-600">
            Manage your users, roles, and permissions
          </p>
        </div>

        {canCreateUsers && (
          <Link href="/users/create">
            <Button>
              <Icon icon="heroicons:plus" className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
