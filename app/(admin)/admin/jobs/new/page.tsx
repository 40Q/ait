"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanySelect } from "@/components/ui/company-select";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useCreateJob } from "@/lib/hooks";
import type { EquipmentItem, Location, Contact } from "@/lib/database/types";

interface JobFormData {
  company_id: string;
  pickup_date: string;
  pickup_time_window: string;
  logistics_person_name: string;
  // Location
  address: string;
  city: string;
  state: string;
  zip_code: string;
  building_info: string;
  // Contact
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  // Equipment
  equipment: EquipmentItem[];
  // Services
  services: string[];
}

const initialFormData: JobFormData = {
  company_id: "",
  pickup_date: "",
  pickup_time_window: "",
  logistics_person_name: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  building_info: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  equipment: [{ type: "", quantity: 1, details: "" }],
  services: [],
};

const availableServices = [
  "Standard Pickup",
  "Data Destruction",
  "HD Serialization",
  "Asset Serialization",
  "White Glove Service",
  "Palletizing",
];

export default function NewJobPage() {
  const router = useRouter();
  const createJob = useCreateJob();

  const [formData, setFormData] = useState<JobFormData>(initialFormData);

  const handleChange = (data: Partial<JobFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const addEquipmentItem = () => {
    setFormData((prev) => ({
      ...prev,
      equipment: [...prev.equipment, { type: "", quantity: 1, details: "" }],
    }));
  };

  const removeEquipmentItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index),
    }));
  };

  const updateEquipmentItem = (index: number, field: keyof EquipmentItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSubmit = () => {
    const location: Location = {
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      building_info: formData.building_info || undefined,
    };

    const contact: Contact = {
      name: formData.contact_name,
      email: formData.contact_email,
      phone: formData.contact_phone,
    };

    createJob.mutate(
      {
        company_id: formData.company_id,
        quote_id: null,
        request_id: null,
        status: "pickup_scheduled",
        pickup_date: formData.pickup_date,
        pickup_time_window: formData.pickup_time_window || null,
        logistics_person_name: formData.logistics_person_name || null,
        location,
        contact,
        equipment: formData.equipment.filter((e) => e.type),
        services: formData.services,
        pickup_scheduled_at: new Date().toISOString(),
      },
      {
        onSuccess: (job) => router.push(`/admin/jobs/${job.id}`),
      }
    );
  };

  const canSubmit =
    formData.company_id &&
    formData.pickup_date &&
    formData.address &&
    formData.contact_name;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Create Job"
          description="Create a new job directly without going through quote flow"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company & Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Company & Schedule</CardTitle>
            <CardDescription>Select the company and pickup details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <CompanySelect
                value={formData.company_id}
                onValueChange={(value) => handleChange({ company_id: value })}
                placeholder="Search for a company..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date *</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickup_date}
                  onChange={(e) => handleChange({ pickup_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeWindow">Time Window</Label>
                <Input
                  id="timeWindow"
                  placeholder="e.g., 9:00 AM - 12:00 PM"
                  value={formData.pickup_time_window}
                  onChange={(e) => handleChange({ pickup_time_window: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logisticsPerson">Logistics Person</Label>
              <Input
                id="logisticsPerson"
                placeholder="Name of pickup driver"
                value={formData.logistics_person_name}
                onChange={(e) => handleChange({ logistics_person_name: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Pickup Location</CardTitle>
            <CardDescription>Enter the pickup address details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
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
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zip_code}
                  onChange={(e) => handleChange({ zip_code: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buildingInfo">Building Info</Label>
              <Textarea
                id="buildingInfo"
                placeholder="Floor, suite, loading dock details..."
                value={formData.building_info}
                onChange={(e) => handleChange({ building_info: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>On-Site Contact</CardTitle>
            <CardDescription>Contact person at the pickup location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Name *</Label>
              <Input
                id="contactName"
                value={formData.contact_name}
                onChange={(e) => handleChange({ contact_name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange({ contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange({ contact_phone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Select the services for this job</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableServices.map((service) => (
                <Button
                  key={service}
                  type="button"
                  variant={formData.services.includes(service) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleService(service)}
                >
                  {service}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Equipment</CardTitle>
                <CardDescription>List the equipment to be picked up</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addEquipmentItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.equipment.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1 grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Input
                        placeholder="e.g., Desktop Computers"
                        value={item.type}
                        onChange={(e) => updateEquipmentItem(index, "type", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateEquipmentItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Details</Label>
                      <Input
                        placeholder="Additional details..."
                        value={item.details || ""}
                        onChange={(e) => updateEquipmentItem(index, "details", e.target.value)}
                      />
                    </div>
                  </div>
                  {formData.equipment.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8"
                      onClick={() => removeEquipmentItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/admin/jobs">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || createJob.isPending}>
          {createJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Job
        </Button>
      </div>
    </div>
  );
}
