"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Key,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import type { Company } from "../_types";

// Mock data
const companies: Company[] = [
  {
    id: "1",
    name: "Acme Corporation",
    contactEmail: "contact@acme.com",
    loginEmail: "portal@acme.com",
    quickbooksCustomerId: "QB-12345",
    quickbooksStatus: "connected",
    status: "active",
    createdAt: "2024-01-15",
    jobCount: 12,
    invoiceCount: 8,
  },
  {
    id: "2",
    name: "TechStart Inc",
    contactEmail: "admin@techstart.io",
    loginEmail: "recycling@techstart.io",
    quickbooksCustomerId: "QB-12346",
    quickbooksStatus: "connected",
    status: "active",
    createdAt: "2024-02-20",
    jobCount: 8,
    invoiceCount: 5,
  },
  {
    id: "3",
    name: "Global Systems",
    contactEmail: "ops@globalsystems.com",
    loginEmail: "it@globalsystems.com",
    quickbooksCustomerId: "QB-12347",
    quickbooksStatus: "error",
    status: "active",
    createdAt: "2024-03-10",
    jobCount: 15,
    invoiceCount: 12,
  },
  {
    id: "4",
    name: "SmallBiz Co",
    contactEmail: "owner@smallbiz.co",
    loginEmail: "owner@smallbiz.co",
    quickbooksStatus: "not_connected",
    status: "active",
    createdAt: "2024-06-01",
    jobCount: 3,
    invoiceCount: 2,
  },
  {
    id: "5",
    name: "Legacy Corp",
    contactEmail: "info@legacy.com",
    loginEmail: "admin@legacy.com",
    quickbooksCustomerId: "QB-10001",
    quickbooksStatus: "connected",
    status: "inactive",
    createdAt: "2023-05-15",
    jobCount: 25,
    invoiceCount: 25,
  },
];

function QuickBooksStatusBadge({ status }: { status: Company["quickbooksStatus"] }) {
  switch (status) {
    case "connected":
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs">Connected</span>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">Error</span>
        </div>
      );
    case "not_connected":
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <XCircle className="h-4 w-4" />
          <span className="text-xs">Not Connected</span>
        </div>
      );
  }
}

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage client companies and their portal access"
      >
        <Button asChild>
          <Link href="/admin/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact Email</TableHead>
              <TableHead>QuickBooks</TableHead>
              <TableHead className="text-center">Jobs</TableHead>
              <TableHead className="text-center">Invoices</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="font-medium hover:underline"
                    >
                      {company.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Login: {company.loginEmail}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.contactEmail}
                </TableCell>
                <TableCell>
                  <div>
                    <QuickBooksStatusBadge status={company.quickbooksStatus} />
                    {company.quickbooksCustomerId && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {company.quickbooksCustomerId}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">{company.jobCount}</TableCell>
                <TableCell className="text-center">{company.invoiceCount}</TableCell>
                <TableCell>
                  <Badge
                    variant={company.status === "active" ? "default" : "secondary"}
                  >
                    {company.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/companies/${company.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Key className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No companies found</p>
        </div>
      )}
    </div>
  );
}
