"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BellRing, Loader2 } from "lucide-react";
import { useSubCompanyUsers, useToggleInvoiceAccess } from "@/lib/hooks";
import { PortalUsersCard, InviteUserCard } from "@/components/company-users-section";

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ManagerCompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = use(params);

  const { data: users = [], refetch: refetchUsers } = useSubCompanyUsers(id);
  const toggleInvoiceAccess = useToggleInvoiceAccess();

  const requestingUsers = users.filter((u) => u.invoice_access_requested);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/companies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Company Details"
          description="Manage users for this company"
        />
      </div>

      {requestingUsers.length > 0 && (
        <div className="max-w-3xl rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <BellRing className="h-5 w-5 shrink-0" />
            <p className="font-semibold text-sm">
              {requestingUsers.length === 1
                ? "1 user is requesting invoice access"
                : `${requestingUsers.length} users are requesting invoice access`}
            </p>
          </div>
          <ul className="space-y-2">
            {requestingUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-2 rounded-md bg-amber-100 dark:bg-amber-900/30 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{user.full_name || user.email}</p>
                  {user.full_name && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={toggleInvoiceAccess.isPending}
                    onClick={() =>
                      toggleInvoiceAccess.mutate(
                        { userId: user.id, grant: false },
                        { onSuccess: () => refetchUsers() }
                      )
                    }
                  >
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={toggleInvoiceAccess.isPending}
                    onClick={() =>
                      toggleInvoiceAccess.mutate(
                        { userId: user.id, grant: true },
                        { onSuccess: () => refetchUsers() }
                      )
                    }
                  >
                    {toggleInvoiceAccess.isPending && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    Grant Access
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 max-w-3xl">
        <PortalUsersCard
          companyId={id}
          users={users}
          apiBaseUrl="/api/manager"
          showSetPassword
          showInvoiceAccess
          onRefetch={refetchUsers}
        />

        <InviteUserCard
          companyId={id}
          apiBaseUrl="/api/manager"
          showPasswordOption
          onRefetch={refetchUsers}
        />
      </div>
    </div>
  );
}
