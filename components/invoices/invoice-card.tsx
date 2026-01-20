"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Calendar, Download, Loader2 } from "lucide-react";
import { formatDateShort } from "@/lib/utils/date";
import type { InvoiceListItem, InvoiceStatus } from "@/lib/database/types";

interface InvoiceCardProps {
  invoice: InvoiceListItem;
  onDownloadPdf?: (invoice: InvoiceListItem) => void;
  isDownloading?: boolean;
  linkPrefix?: string; // "/admin/jobs" or "/jobs"
}

export function InvoiceCard({
  invoice,
  onDownloadPdf,
  isDownloading = false,
  linkPrefix = "/jobs",
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
              <StatusBadge status={invoice.status as InvoiceStatus} />
            </div>
            {invoice.job_id && invoice.job_number && (
              <div>
                <Link
                  href={`${linkPrefix}/${invoice.job_id}`}
                  className="text-sm hover:text-primary hover:underline"
                >
                  {invoice.job_number}
                </Link>
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateShort(invoice.invoice_date)}
              </span>
              <span
                className={invoice.status === "overdue" ? "text-destructive" : ""}
              >
                Due: {formatDateShort(invoice.due_date)}
              </span>
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
                disabled={!invoice.quickbooks_id || isDownloading}
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
