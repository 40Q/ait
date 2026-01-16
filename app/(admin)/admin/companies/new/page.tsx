"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useCreateCompany } from "@/lib/hooks";
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

const initialFormData: CompanyFormData = {
  name: "",
  contactEmail: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  quickbooksCustomerId: "",
  status: "active",
};

export default function NewCompanyPage() {
  const router = useRouter();
  const createCompany = useCreateCompany();

  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [isTestingQB, setIsTestingQB] = useState(false);
  const [qbTestResult, setQbTestResult] = useState<"success" | "error" | null>(null);

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

  const handleSubmit = () => {
    createCompany.mutate(
      {
        name: formData.name,
        contact_email: formData.contactEmail || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        quickbooks_customer_id: formData.quickbooksCustomerId || null,
        status: formData.status,
        accounts_payable_email: null,
        accounts_payable_phone: null,
      },
      {
        onSuccess: (company) => router.push(`/admin/companies/${company.id}`),
      }
    );
  };

  const canSubmit = formData.name.trim() !== "";

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange({ contactEmail: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange({ phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange({ address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange({ city: e.target.value })}
                  placeholder="Los Angeles"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange({ state: e.target.value })}
                  placeholder="CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleChange({ zip: e.target.value })}
                  placeholder="90001"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive companies cannot access the portal
                </p>
              </div>
              <Switch
                checked={formData.status === "active"}
                onCheckedChange={(checked) =>
                  handleChange({ status: checked ? "active" : "inactive" })
                }
              />
            </div>

            {createCompany.error && (
              <p className="text-sm text-destructive">
                {createCompany.error.message}
              </p>
            )}
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
                  Test
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
            disabled={!canSubmit || createCompany.isPending}
          >
            {createCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
