"use client";

import Link from "next/link";
import { Plus, Building2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useManagerCompanies } from "@/lib/hooks";

export default function ManagerCompaniesPage() {
  const { data: companies = [], isLoading } = useManagerCompanies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Companies"
          description="Sub-companies you manage"
        />
        <Button asChild>
          <Link href="/manager/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">No companies yet</p>
              <p className="text-sm text-muted-foreground">
                Create a company to get started
              </p>
            </div>
            <Button asChild>
              <Link href="/manager/companies/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Company
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    <Link
                      href={`/manager/companies/${company.id}`}
                      className="hover:underline"
                    >
                      {company.name}
                    </Link>
                  </CardTitle>
                  <Badge
                    variant={company.status === "active" ? "default" : "secondary"}
                  >
                    {company.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {company.contact_email && (
                  <p className="text-sm text-muted-foreground truncate">
                    {company.contact_email}
                  </p>
                )}
                {(company.city || company.state) && (
                  <p className="text-sm text-muted-foreground">
                    {[company.city, company.state].filter(Boolean).join(", ")}
                  </p>
                )}
                <div className="mt-3">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/manager/companies/${company.id}`}>
                      Manage
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
