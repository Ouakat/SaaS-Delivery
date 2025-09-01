"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Dashboard Overview
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick stats cards */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
              Welcome {user?.name}
            </h3>
            <p className="text-blue-700 dark:text-blue-300">
              Role: {user?.role}
            </p>
          </div>

          {/* Conditionally show content based on permissions */}
          {hasPermission("analytics.view") && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                Analytics Access
              </h3>
              <p className="text-green-700 dark:text-green-300">
                You can view analytics
              </p>
            </div>
          )}

          {hasPermission("admin.access") && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
                Admin Access
              </h3>
              <p className="text-red-700 dark:text-red-300">
                You have admin privileges
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
