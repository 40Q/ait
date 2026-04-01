"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  UserPlus,
  Mail,
  AlertTriangle,
  Users,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { QuickBooksCustomerSelect } from "@/components/ui/quickbooks-customer-select";
import { generatePassword } from "@/lib/utils/generate-password";
import {
  useCompany,
  useCompanyUsers,
  useUpdateCompany,
  useInviteUser,
  useDeactivateUser,
} from "@/lib/hooks";
import { LocationsSection } from "@/components/locations";
import { EmailTagInput } from "@/components/ui/email-tag-input";
import { useFormValidation } from "@/lib/hooks/use-form-validation";
import { companyFormSchema, type CompanyFormInput } from "@/lib/validation";
import type { CompanyStatus } from "@/lib/database/types";
import { toast } from "sonner";

interface CompanyFormData extends CompanyFormInput {
  status: CompanyStatus;
}

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}


export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: company, isLoading, error, refetch } = useCompany(id);
  const { data: companyUsers = [], refetch: refetchUsers } = useCompanyUsers(id);
  const updateCompany = useUpdateCompany();
  const inviteUser = useInviteUser();
  const deleteUser = useDeactivateUser();
  const { errors, validate, clearFieldError } = useFormValidation<CompanyFormInput>(companyFormSchema);

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
    accountsPayableEmail: "",
    accountsPayablePhone: "",
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [userToSetPassword, setUserToSetPassword] = useState<{ id: string; email: string } | null>(null);
  const [setPasswordValue, setSetPasswordValue] = useState("");
  const [showSetPasswordValue, setShowSetPasswordValue] = useState(false);
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const [setPasswordSuccess, setSetPasswordSuccess] = useState(false);

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
        accountsPayableEmail: company.accounts_payable_email || "",
        accountsPayablePhone: company.accounts_payable_phone || "",
      });
    }
  }, [company]);

  const handleChange = (data: Partial<CompanyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setSaveSuccess(false);
    // Clear errors for changed fields
    Object.keys(data).forEach((key) => {
      clearFieldError(key as keyof CompanyFormInput);
    });
  };

  const handleSubmit = async () => {
    const result = validate(formData);
    if (!result.success) {
      return;
    }

    updateCompany.mutate(
      {
        id,
        data: {
          name: result.data.name,
          contact_email: result.data.contactEmail || null,
          phone: result.data.phone || null,
          address: result.data.address || null,
          city: result.data.city || null,
          state: result.data.state || null,
          zip: result.data.zip || null,
          quickbooks_customer_id: result.data.quickbooksCustomerId || null,
          accounts_payable_email: result.data.accountsPayableEmail || null,
          accounts_payable_phone: result.data.accountsPayablePhone || null,
        },
      },
      {
        onSuccess: () => setSaveSuccess(true),
      }
    );
  };

  const handleGenerateInvitePassword = () => {
    setInvitePassword(generatePassword());
    setShowInvitePassword(true);
  };

  const handleInviteUser = () => {
    if (!inviteEmail) return;

    setInviteSuccess(false);
    setInviteLink(null);
    setGeneratedPassword(null);
    inviteUser.mutate(
      {
        email: inviteEmail,
        fullName: inviteFullName || inviteEmail,
        companyId: id,
        role: "client",
        password: invitePassword || undefined,
      },
      {
        onSuccess: (data) => {
          const pwd = invitePassword || null;
          setInviteEmail("");
          setInviteFullName("");
          setInvitePassword("");
          setShowInvitePassword(false);
          setInviteSuccess(true);
          setInviteLink(data.inviteLink ?? null);
          setGeneratedPassword(pwd);
          refetchUsers();
        },
      }
    );
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleCopyPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword).then(() => {
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    });
  };

  const handleResendInvite = async (email: string, fullName: string | null) => {
    try {
      const response = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName: fullName || email, companyId: id, role: "client" }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resend invite");
      }
      toast.success("Invitation resent");
      refetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend invite");
    }
  };

  const handleCopyInviteLink = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/invite-link`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate link");
      await navigator.clipboard.writeText(data.inviteLink);
      toast.success("Invite link copied");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to copy link");
    }
  };

  const handleSendRecoveryEmail = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/send-recovery-email`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }
      toast.success("Recovery email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send recovery email");
    }
  };

  const openSetPassword = (user: { id: string; email: string }) => {
    setUserToSetPassword(user);
    setSetPasswordValue("");
    setShowSetPasswordValue(false);
    setSetPasswordError(null);
    setSetPasswordSuccess(false);
  };

  const closeSetPassword = () => {
    setUserToSetPassword(null);
    setSetPasswordValue("");
    setShowSetPasswordValue(false);
    setSetPasswordError(null);
    setSetPasswordSuccess(false);
  };

  const handleSetPassword = async () => {
    if (!userToSetPassword) return;
    if (!setPasswordValue || setPasswordValue.length < 8) {
      setSetPasswordError("Password must be at least 8 characters");
      return;
    }
    setSetPasswordLoading(true);
    setSetPasswordError(null);
    try {
      const response = await fetch(`/api/admin/users/${userToSetPassword.id}/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: setPasswordValue }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSetPasswordSuccess(true);
    } catch (err) {
      setSetPasswordError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setSetPasswordLoading(false);
    }
  };

  const handleGenerateSetPassword = () => {
    setSetPasswordValue(generatePassword());
    setShowSetPasswordValue(true);
  };

  const handleDeleteCompany = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/companies/${id}/deactivate`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        setDeleteError(result.error || "Failed to delete company");
        setIsDeleting(false);
        return;
      }

      // Company deleted — redirect to companies list
      router.push("/admin/companies");
    } catch {
      setDeleteError("An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;

    deleteUser.mutate(userToDelete.id, {
      onSuccess: () => {
        setUserToDelete(null);
        refetchUsers();
      },
    });
  };

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
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
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
                    aria-invalid={!!errors.contactEmail}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-destructive">{errors.contactEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange({ phone: e.target.value })}
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange({ address: e.target.value })}
                  aria-invalid={!!errors.address}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange({ city: e.target.value })}
                    aria-invalid={!!errors.city}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange({ state: e.target.value })}
                    aria-invalid={!!errors.state}
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive">{errors.state}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleChange({ zip: e.target.value })}
                    aria-invalid={!!errors.zip}
                  />
                  {errors.zip && (
                    <p className="text-sm text-destructive">{errors.zip}</p>
                  )}
                </div>
              </div>

              {/* Accounts Payable */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Accounts Payable</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accountsPayableEmail">AP Email(s)</Label>
                    <EmailTagInput
                      value={formData.accountsPayableEmail}
                      onChange={(val) =>
                        handleChange({ accountsPayableEmail: val })
                      }
                      placeholder="ap@company.com"
                      aria-invalid={!!errors.accountsPayableEmail}
                    />
                    {errors.accountsPayableEmail && (
                      <p className="text-sm text-destructive">{errors.accountsPayableEmail}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountsPayablePhone">AP Phone</Label>
                    <Input
                      id="accountsPayablePhone"
                      type="tel"
                      value={formData.accountsPayablePhone}
                      onChange={(e) =>
                        handleChange({ accountsPayablePhone: e.target.value })
                      }
                      placeholder="(555) 123-4567"
                      aria-invalid={!!errors.accountsPayablePhone}
                    />
                    {errors.accountsPayablePhone && (
                      <p className="text-sm text-destructive">{errors.accountsPayablePhone}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QuickBooks Integration */}
          <Card>
            <CardHeader>
              <CardTitle>QuickBooks Integration</CardTitle>
              <CardDescription>
                Link this company to a QuickBooks customer for invoice syncing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>QuickBooks Customer</Label>
                <QuickBooksCustomerSelect
                  value={formData.quickbooksCustomerId}
                  onChange={(customerId) =>
                    handleChange({ quickbooksCustomerId: customerId })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Search and select a customer from QuickBooks to link invoices
                </p>
              </div>

              {company.quickbooks_status === "connected" && formData.quickbooksCustomerId && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">
                      Linked to QuickBooks
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Customer ID: {formData.quickbooksCustomerId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <LocationsSection companyId={id} />

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <Button onClick={handleSubmit} disabled={updateCompany.isPending}>
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
                <ul className="space-y-2">
                  {companyUsers.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <span className="text-muted-foreground truncate block">{user.email}</span>
                        {user.invite_pending && (
                          <span className="text-xs text-amber-600">Invite pending</span>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.invite_pending ? (
                            <>
                              <DropdownMenuItem onClick={() => handleResendInvite(user.email, user.full_name)}>
                                Resend Invite
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyInviteLink(user.id)}>
                                Copy Invite Link
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => handleSendRecoveryEmail(user.id)}>
                                Send Recovery Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openSetPassword({ id: user.id, email: user.email })}>
                                Set Password
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setUserToDelete({ id: user.id, email: user.email })}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Invite User */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Portal User
              </CardTitle>
              <CardDescription>
                Send an invitation or create an account with a password directly
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
              <div className="space-y-2">
                <Label htmlFor="invitePassword">
                  Password{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="invitePassword"
                      type={showInvitePassword ? "text" : "password"}
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      placeholder="Leave blank to send email invite"
                      className="pr-9"
                    />
                    {invitePassword && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent"
                        onClick={() => setShowInvitePassword(!showInvitePassword)}
                      >
                        {showInvitePassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateInvitePassword}
                    title="Generate password"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {invitePassword
                    ? "Account will be created with this password — no email sent."
                    : "No password? An invite email will be sent instead."}
                </p>
              </div>
              <Button
                onClick={handleInviteUser}
                disabled={!inviteEmail || inviteUser.isPending}
                className="w-full"
              >
                {inviteUser.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : invitePassword ? (
                  <UserPlus className="mr-2 h-4 w-4" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                {invitePassword ? "Create Account" : "Send Invitation"}
              </Button>
              {inviteSuccess && (
                <div className="space-y-2">
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {generatedPassword ? "Account created successfully" : "Invitation sent successfully"}
                  </p>
                  {generatedPassword && (
                    <div className="rounded-md border bg-muted p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Password to share with customer:</p>
                      <p className="font-mono text-sm break-all">{generatedPassword}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleCopyPassword}
                      >
                        {passwordCopied ? (
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        {passwordCopied ? "Copied!" : "Copy Password"}
                      </Button>
                    </div>
                  )}
                  {inviteLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleCopyLink}
                    >
                      {linkCopied ? (
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {linkCopied ? "Copied!" : "Copy Invitation Link"}
                    </Button>
                  )}
                </div>
              )}
              {inviteUser.error && (
                <p className="text-sm text-destructive">
                  {inviteUser.error.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Permanently delete this company and all associated data
                including jobs, invoices, documents, and portal users.
                This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={isDeleting}
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete Company
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">
                        This will permanently delete:
                      </span>
                      <ul className="list-disc list-inside space-y-1">
                        <li>All jobs, requests, and quotes</li>
                        <li>All invoices and documents</li>
                        <li>All portal users for this company</li>
                      </ul>
                      <span className="block mt-2 font-medium">
                        This action cannot be undone.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCompany}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {deleteError && (
                <p className="text-sm text-destructive">{deleteError}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Set Password Dialog */}
      <Dialog open={!!userToSetPassword} onOpenChange={(open) => !open && closeSetPassword()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription>
              {userToSetPassword?.email} — set a password and share it with the user directly.
            </DialogDescription>
          </DialogHeader>
          {setPasswordSuccess ? (
            <div className="py-4 text-center space-y-1">
              <p className="font-medium text-green-600">Password updated</p>
              <p className="text-sm text-muted-foreground">The user can now log in with the new password.</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showSetPasswordValue ? "text" : "password"}
                    value={setPasswordValue}
                    onChange={(e) => { setSetPasswordValue(e.target.value); setSetPasswordError(null); }}
                    placeholder="Enter or generate a password"
                    className="pr-9"
                    disabled={setPasswordLoading}
                  />
                  {setPasswordValue && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent"
                      onClick={() => setShowSetPasswordValue(!showSetPasswordValue)}
                    >
                      {showSetPasswordValue ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </div>
                <Button type="button" variant="outline" size="icon" onClick={handleGenerateSetPassword} title="Generate password" disabled={setPasswordLoading}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {setPasswordError && <p className="text-sm text-destructive">{setPasswordError}</p>}
            </div>
          )}
          <DialogFooter>
            {setPasswordSuccess ? (
              <Button onClick={closeSetPassword}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeSetPassword} disabled={setPasswordLoading}>Cancel</Button>
                <Button onClick={handleSetPassword} disabled={!setPasswordValue || setPasswordLoading}>
                  {setPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Set Password
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Are you sure you want to remove <strong>{userToDelete?.email}</strong>?
              </span>
              <span className="block">
                They will be permanently removed from the portal. You can
                re-invite them later if needed.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteUser.error && (
            <p className="text-sm text-destructive">{deleteUser.error.message}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
