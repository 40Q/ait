"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Key,
  ExternalLink,
} from "lucide-react";
import type { Company } from "../../_types";

// Mock data - would be fetched based on ID
const companyData: Company = {
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
};

interface CompanyFormData {
  name: string;
  contactEmail: string;
  loginEmail: string;
  quickbooksCustomerId: string;
  status: "active" | "inactive";
  notes: string;
}

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [formData, setFormData] = useState<CompanyFormData>({
    name: companyData.name,
    contactEmail: companyData.contactEmail,
    loginEmail: companyData.loginEmail,
    quickbooksCustomerId: companyData.quickbooksCustomerId || "",
    status: companyData.status,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingQB, setIsTestingQB] = useState(false);
  const [qbTestResult, setQbTestResult] = useState<"success" | "error" | null>(
    null
  );

  const handleChange = (data: Partial<CompanyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (data.quickbooksCustomerId !== undefined) {
      setQbTestResult(null);
    }
  };

  const testQuickBooksConnection = async () => {
    if (!formData.quickbooksCustomerId) return;

    setIsTestingQB(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setQbTestResult(Math.random() > 0.2 ? "success" : "error");
    setIsTestingQB(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    router.push("/admin/companies");
  };

  const handleDelete = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push("/admin/companies");
  };

  const canSubmit =
    formData.name && formData.contactEmail && formData.loginEmail;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/companies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <PageHeader
            title={companyData.name}
            description={`Company ID: ${id}`}
          />
        </div>
        <Badge variant={companyData.status === "active" ? "default" : "secondary"}>
          {companyData.status}
        </Badge>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold">{companyData.jobCount}</p>
              <p className="text-sm text-muted-foreground">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold">{companyData.invoiceCount}</p>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {new Date(companyData.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">Member Since</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic information about the company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange({ name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  Contact Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    handleChange({ contactEmail: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange({ notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive companies cannot log in
                  </p>
                </div>
                <Switch
                  checked={formData.status === "active"}
                  onCheckedChange={(checked) =>
                    handleChange({ status: checked ? "active" : "inactive" })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Portal Login Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>Portal Login Credentials</CardTitle>
              <CardDescription>
                Manage portal access for this company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginEmail">
                  Login Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="loginEmail"
                  type="email"
                  value={formData.loginEmail}
                  onChange={(e) => handleChange({ loginEmail: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Send a password reset link to the login email
                  </p>
                </div>
                <Button variant="outline">
                  <Key className="mr-2 h-4 w-4" />
                  Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QuickBooks Integration */}
          <Card>
            <CardHeader>
              <CardTitle>QuickBooks Integration</CardTitle>
              <CardDescription>
                Link this company to QuickBooks for invoice syncing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quickbooksCustomerId">
                  QuickBooks Customer ID
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="quickbooksCustomerId"
                    value={formData.quickbooksCustomerId}
                    onChange={(e) =>
                      handleChange({ quickbooksCustomerId: e.target.value })
                    }
                    placeholder="QB-12345"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testQuickBooksConnection}
                    disabled={!formData.quickbooksCustomerId || isTestingQB}
                  >
                    {isTestingQB ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Test
                  </Button>
                </div>
                {qbTestResult === "success" && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connection successful
                  </p>
                )}
                {qbTestResult === "error" && (
                  <p className="text-xs text-red-600">
                    Connection failed - Customer ID not found
                  </p>
                )}
              </div>

              {companyData.quickbooksStatus === "connected" && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">
                        Connected to QuickBooks
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View in QuickBooks
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last synced: Today at 2:30 PM
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/jobs?company=${id}`}>
                  View Jobs ({companyData.jobCount})
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/invoices?company=${id}`}>
                  View Invoices ({companyData.invoiceCount})
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/requests?company=${id}`}>
                  View Requests
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base text-destructive">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Company
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Company</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {companyData.name}? This
                      will permanently remove all associated jobs, documents, and
                      data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/companies">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
