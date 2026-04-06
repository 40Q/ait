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
import { useCreateSubCompany } from "@/lib/hooks";

interface FormData {
  name: string;
  contact_email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

const initialFormData: FormData = {
  name: "",
  contact_email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
};

export default function NewSubCompanyPage() {
  const router = useRouter();
  const createSubCompany = useCreateSubCompany();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [nameError, setNameError] = useState("");

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "name") setNameError("");
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setNameError("Company name is required");
      return;
    }

    createSubCompany.mutate(
      {
        name: formData.name.trim(),
        contact_email: formData.contact_email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip: formData.zip || undefined,
      },
      {
        onSuccess: (company) => router.push(`/manager/companies/${company.id}`),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/companies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Add New Company"
          description="Create a sub-company account"
        />
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic information about the company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Acme Corporation"
                aria-invalid={!!nameError}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Los Angeles"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleChange("zip", e.target.value)}
                  placeholder="90001"
                />
              </div>
            </div>

            {createSubCompany.error && (
              <p className="text-sm text-destructive">
                {createSubCompany.error.message}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button onClick={handleSubmit} disabled={createSubCompany.isPending}>
            {createSubCompany.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Company
          </Button>
          <Button variant="outline" asChild>
            <Link href="/manager/companies">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
