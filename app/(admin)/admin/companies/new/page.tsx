"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCreateCompany } from "@/lib/hooks";
import { useFormValidation } from "@/lib/hooks/use-form-validation";
import { companyFormSchema, type CompanyFormInput } from "@/lib/validation";
import { QuickBooksCustomerSelect } from "@/components/ui/quickbooks-customer-select";

const initialFormData: CompanyFormInput = {
  name: "",
  contactEmail: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  quickbooksCustomerId: "",
  accountsPayableEmail: "",
  accountsPayablePhone: "",
};

export default function NewCompanyPage() {
  const router = useRouter();
  const createCompany = useCreateCompany();
  const { errors, validate, clearFieldError } = useFormValidation<CompanyFormInput>(companyFormSchema);

  const [formData, setFormData] = useState<CompanyFormInput>(initialFormData);

  const handleChange = (data: Partial<CompanyFormInput>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Clear errors for changed fields
    Object.keys(data).forEach((key) => {
      clearFieldError(key as keyof CompanyFormInput);
    });
  };

  const handleSubmit = () => {
    const result = validate(formData);
    if (!result.success) {
      return;
    }

    createCompany.mutate(
      {
        name: result.data.name,
        contact_email: result.data.contactEmail || null,
        phone: result.data.phone || null,
        address: result.data.address || null,
        city: result.data.city || null,
        state: result.data.state || null,
        zip: result.data.zip || null,
        quickbooks_customer_id: result.data.quickbooksCustomerId || null,
        status: "active",
        accounts_payable_email: null,
        accounts_payable_phone: null,
      },
      {
        onSuccess: (company) => router.push(`/admin/companies/${company.id}`),
      }
    );
  };

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
                  onChange={(e) => handleChange({ contactEmail: e.target.value })}
                  placeholder="contact@company.com"
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
                  placeholder="(555) 123-4567"
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
                placeholder="123 Main Street"
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
                  placeholder="Los Angeles"
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
                  placeholder="CA"
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
                  placeholder="90001"
                  aria-invalid={!!errors.zip}
                />
                {errors.zip && (
                  <p className="text-sm text-destructive">{errors.zip}</p>
                )}
              </div>
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
              <Label>QuickBooks Customer</Label>
              <QuickBooksCustomerSelect
                value={formData.quickbooksCustomerId}
                onChange={(customerId) =>
                  handleChange({ quickbooksCustomerId: customerId })
                }
              />
              <p className="text-xs text-muted-foreground">
                Search and select a customer from QuickBooks. Leave empty if not
                using QuickBooks.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={createCompany.isPending}
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
