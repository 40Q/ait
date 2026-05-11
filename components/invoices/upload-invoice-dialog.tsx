"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateInvoice } from "@/lib/hooks";
import { toast } from "sonner";

interface CompanyOption {
  id: string;
  name: string;
}

interface UploadInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-bound company. When provided, the company picker is hidden. */
  companyId?: string;
  /** Pre-bound job to link the invoice to. */
  jobId?: string;
  /** Companies to choose from when `companyId` is not provided. */
  companies?: CompanyOption[];
  /** Optional override for the dialog description. */
  description?: string;
}

export function UploadInvoiceDialog({
  open,
  onOpenChange,
  companyId,
  jobId,
  companies,
  description,
}: UploadInvoiceDialogProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const createInvoice = useCreateInvoice();

  const resolvedCompanyId = companyId ?? selectedCompanyId;
  const showCompanyPicker = !companyId;

  const reset = () => {
    setSelectedCompanyId("");
    setInvoiceNumber("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resolvedCompanyId) return;

    const raw = new FormData(e.currentTarget);
    const pdf = raw.get("pdf") as File | null;

    const formData = new FormData();
    formData.set("company_id", resolvedCompanyId);
    if (jobId) formData.set("job_id", jobId);
    if (invoiceNumber.trim()) {
      formData.set("invoice_number", invoiceNumber.trim());
    }
    const today = new Date().toISOString().split("T")[0];
    formData.set("amount", "0");
    formData.set("invoice_date", today);
    formData.set("due_date", today);
    formData.set("status", "unpaid");
    if (pdf && pdf.size > 0) formData.set("pdf", pdf);

    try {
      await createInvoice.mutateAsync(formData);
      toast.success("Invoice uploaded successfully");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Invoice</DialogTitle>
          <DialogDescription>
            {description ?? "Upload a PDF invoice for a company."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {showCompanyPicker && (
              <div className="space-y-2">
                <Label htmlFor="upload-invoice-company">Company</Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                  required
                >
                  <SelectTrigger id="upload-invoice-company">
                    <SelectValue placeholder="Select a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(companies ?? []).map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="upload-invoice-number">Invoice Number</Label>
              <Input
                id="upload-invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g., 12345"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-invoice-pdf">PDF</Label>
              <Input
                id="upload-invoice-pdf"
                name="pdf"
                type="file"
                accept="application/pdf"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createInvoice.isPending || !resolvedCompanyId}
            >
              {createInvoice.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Upload Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
