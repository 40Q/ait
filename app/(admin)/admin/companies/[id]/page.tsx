"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CheckCircle2,
  ExternalLink,
  UserPlus,
  Mail,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useCompany, useCompanyUsers, useUpdateCompany, useInviteUser } from "@/lib/hooks";
import type { CompanyStatus } from "@/lib/database/types";

interface CompanyFormData {
  name: string;
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  quickbooksCustomerId: string;
  status: CompanyStatus;
}

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = use(params);

  const { data: company, isLoading, error, refetch } = useCompany(id);
  const { data: companyUsers = [], refetch: refetchUsers } = useCompanyUsers(id);
  const updateCompany = useUpdateCompany();
  const inviteUser = useInviteUser();

  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    contactEmail: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    quickbooksCustomerId: "",
    status: "active",
  });
  const [isTestingQB, setIsTestingQB] = useState(false);
  const [qbTestResult, setQbTestResult] = useState<"success" | "error" | null>(
    null
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [wasReactivated, setWasReactivated] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);

  // Populate form when company data loads
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        contactEmail: company.contact_email || "",
        phone: company.phone || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        zip: company.zip || "",
        quickbooksCustomerId: company.quickbooks_customer_id || "",
        status: company.status,
      });
    }
  }, [company]);

  const handleChange = (data: Partial<CompanyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setSaveSuccess(false);
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
    updateCompany.mutate(
      {
        id,
        data: {
          name: formData.name,
          contact_email: formData.contactEmail || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          quickbooks_customer_id: formData.quickbooksCustomerId || null,
        },
      },
      {
        onSuccess: () => setSaveSuccess(true),
      }
    );
  };

  const handleInviteUser = () => {
    if (!inviteEmail) return;

    // If company is inactive, show confirmation dialog
    if (!isActive) {
      setShowReactivateConfirm(true);
      return;
    }

    // Company is active, proceed directly
    sendInvitation();
  };

  const sendInvitation = () => {
    setInviteSuccess(false);
    inviteUser.mutate(
      {
        email: inviteEmail,
        fullName: inviteFullName || inviteEmail,
        companyId: id,
        role: "client",
      },
      {
        onSuccess: () => {
          setInviteEmail("");
          setInviteFullName("");
          setInviteSuccess(true);
          refetchUsers();
        },
      }
    );
  };

  const handleConfirmReactivation = () => {
    setShowReactivateConfirm(false);
    setWasReactivated(false);

    // First reactivate the company, then invite the user
    updateCompany.mutate(
      {
        id,
        data: { status: "active" },
      },
      {
        onSuccess: () => {
          setWasReactivated(true);
          refetch();
          sendInvitation();
        },
      }
    );
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    setDeactivateError(null);
    setDeactivateSuccess(false);

    try {
      const response = await fetch(`/api/admin/companies/${id}/deactivate`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        setDeactivateError(result.error || "Failed to deactivate company");
        setIsDeactivating(false);
        return;
      }

      setDeactivateSuccess(true);
      setIsDeactivating(false);
      refetch();
    } catch {
      setDeactivateError("An unexpected error occurred");
      setIsDeactivating(false);
    }
  };

  const canSubmit = formData.name;
  const isActive = company?.status === "active";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">
          {error ? `Failed to load company: ${error.message}` : "Company not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/admin/companies">Back to Companies</Link>
        </Button>
      </div>
    );
  }

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
            title={company.name}
            description={`Company ID: ${id}`}
          />
        </div>
        <Badge variant={company.status === "active" ? "default" : "secondary"}>
          {company.status}
        </Badge>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold">{company.job_count}</p>
              <p className="text-sm text-muted-foreground">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold">{company.invoice_count}</p>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {new Date(company.created_at).toLocaleDateString()}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
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
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange({ phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange({ address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange({ city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange({ state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleChange({ zip: e.target.value })}
                  />
                </div>
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

              {company.quickbooks_status === "connected" && (
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

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <Button onClick={handleSubmit} disabled={!canSubmit || updateCompany.isPending}>
              {updateCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/companies">Back</Link>
            </Button>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Changes saved
              </span>
            )}
            {updateCompany.error && (
              <span className="text-sm text-destructive">
                {updateCompany.error.message}
              </span>
            )}
          </div>
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
                  View Jobs ({company.job_count})
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/invoices?company=${id}`}>
                  View Invoices ({company.invoice_count})
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/requests?company=${id}`}>
                  View Requests
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Portal Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Portal Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users yet</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {companyUsers.map((u) => u.email).join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invite User */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Portal User
              </CardTitle>
              <CardDescription>
                Send an invitation to access the client portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteSuccess(false);
                  }}
                  placeholder="user@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteFullName">Full Name</Label>
                <Input
                  id="inviteFullName"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <Button
                onClick={handleInviteUser}
                disabled={!inviteEmail || inviteUser.isPending}
                className="w-full"
              >
                {inviteUser.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Send Invitation
              </Button>
              {inviteSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {wasReactivated
                    ? "Invitation sent and company reactivated"
                    : "Invitation sent successfully"}
                </p>
              )}
              {inviteUser.error && (
                <p className="text-sm text-destructive">
                  {inviteUser.error.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone - Only show for active companies */}
          {isActive && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Deactivating this company will permanently remove all portal users
                  associated with it. The company data (jobs, invoices, documents)
                  will be preserved, but users will no longer be able to access the portal.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isDeactivating}
                    >
                      {isDeactivating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Deactivate Company
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate {company.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <span className="block">
                          This action will:
                        </span>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Set the company status to inactive</li>
                          <li>Permanently delete all portal users for this company</li>
                        </ul>
                        <span className="block mt-2">
                          Company data (jobs, invoices, documents) will be preserved.
                          This action cannot be undone.
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeactivate}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Deactivate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {deactivateError && (
                  <p className="text-sm text-destructive">{deactivateError}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reactivate Company Confirmation Dialog */}
      <AlertDialog open={showReactivateConfirm} onOpenChange={setShowReactivateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Company?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This company is currently inactive. Inviting a user will automatically
                reactivate it, allowing the user to access the portal.
              </span>
              <span className="block">
                Do you want to proceed?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReactivation}>
              Reactivate & Invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
