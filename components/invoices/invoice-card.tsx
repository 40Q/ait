"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Loader2 } from "lucide-react";
import { formatDateShort } from "@/lib/utils/date";
import type { InvoiceListItem } from "@/lib/database/types";

interface InvoiceCardProps {
  invoice: InvoiceListItem;
  onDownloadPdf?: (invoice: InvoiceListItem) => void;
  isDownloading?: boolean;
  linkPrefix?: string; // "/admin/jobs" or "/jobs"
  /** Whether to render the company name. */
  showCompany?: boolean;
  /** If set, the company name renders as a link to `${companyLinkPrefix}/${company_id}`. */
  companyLinkPrefix?: string;
}

export function InvoiceCard({
  invoice,
  onDownloadPdf,
  isDownloading = false,
  linkPrefix = "/jobs",
  showCompany = false,
  companyLinkPrefix,
}: InvoiceCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-medium">
                {invoice.invoice_number}
              </span>
            </div>
            {(showCompany || (invoice.job_id && invoice.job_number)) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {showCompany &&
                  (companyLinkPrefix ? (
                    <Link
                      href={`${companyLinkPrefix}/${invoice.company_id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {invoice.company_name}
                    </Link>
                  ) : (
                    <span>{invoice.company_name}</span>
                  ))}
                {invoice.job_id && invoice.job_number && (
                  <Link
                    href={`${linkPrefix}/${invoice.job_id}`}
                    className="font-mono text-muted-foreground hover:text-primary hover:underline"
                  >
                    {invoice.job_number}
                  </Link>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateShort(invoice.invoice_date)}
              </span>
              <span>Due: {formatDateShort(invoice.due_date)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-lg font-bold">
              ${invoice.amount.toLocaleString()}
            </span>
            {onDownloadPdf && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPdf(invoice)}
                disabled={(!invoice.quickbooks_id && !invoice.pdf_path) || isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Download className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">PDF</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
