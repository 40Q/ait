"use client";

import Link from "next/link";
import { Building2, Users, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useManagerCompanies } from "@/lib/hooks";

export default function ManagerDashboardPage() {
  const { data: companies = [], isLoading } = useManagerCompanies();

  const activeCount = companies.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard"
          description="Manage your sub-companies and their users"
        />
        <Button asChild>
          <Link href="/manager/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-primary/10 p-3">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{companies.length}</p>
              <p className="text-sm text-muted-foreground">Total Companies</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-green-500/10 p-3">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Active Companies</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Companies</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/manager/companies">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No companies yet</p>
              <Button asChild size="sm">
                <Link href="/manager/companies/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Company
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {companies.slice(0, 5).map((company) => (
                <li key={company.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      href={`/manager/companies/${company.id}`}
                      className="font-medium hover:underline"
                    >
                      {company.name}
                    </Link>
                    {(company.city || company.state) && (
                      <p className="text-xs text-muted-foreground">
                        {[company.city, company.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <Badge variant={company.status === "active" ? "default" : "secondary"}>
                    {company.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
