"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

interface CompanyFormData {
  name: string;
  contactEmail: string;
  loginEmail: string;
  password: string;
  quickbooksCustomerId: string;
  status: "active" | "inactive";
  notes: string;
}

const initialFormData: CompanyFormData = {
  name: "",
  contactEmail: "",
  loginEmail: "",
  password: "",
  quickbooksCustomerId: "",
  status: "active",
  notes: "",
};

export default function NewCompanyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingQB, setIsTestingQB] = useState(false);
  const [qbTestResult, setQbTestResult] = useState<"success" | "error" | null>(null);

  const handleChange = (data: Partial<CompanyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Reset QB test result when customer ID changes
    if (data.quickbooksCustomerId !== undefined) {
      setQbTestResult(null);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleChange({ password });
  };

  const testQuickBooksConnection = async () => {
    if (!formData.quickbooksCustomerId) return;

    setIsTestingQB(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Mock: 80% success rate
    setQbTestResult(Math.random() > 0.2 ? "success" : "error");
    setIsTestingQB(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    router.push("/admin/companies");
  };

  const canSubmit =
    formData.name &&
    formData.contactEmail &&
    formData.loginEmail &&
    formData.password;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/companies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Add New Company"
          description="Create a new client company account"
        />
      </div>

      <div className="max-w-2xl space-y-6">
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
                placeholder="Acme Corporation"
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
                onChange={(e) => handleChange({ contactEmail: e.target.value })}
                placeholder="contact@company.com"
              />
              <p className="text-xs text-muted-foreground">
                Primary contact for notifications and communications
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange({ notes: e.target.value })}
                placeholder="Any additional notes about this company..."
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
              Credentials for the company to access the client portal
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
                placeholder="portal@company.com"
              />
              <p className="text-xs text-muted-foreground">
                This email will be used to log into the client portal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => handleChange({ password: e.target.value })}
                  placeholder="Enter or generate password"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate
                </Button>
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
                  Test Connection
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Found in the QuickBooks customer profile. Leave empty if not using
                QuickBooks.
              </p>
              {qbTestResult === "success" && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connection successful - Customer found in QuickBooks
                </p>
              )}
              {qbTestResult === "error" && (
                <p className="text-xs text-red-600">
                  Connection failed - Customer ID not found or QuickBooks error
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Company
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/companies">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
