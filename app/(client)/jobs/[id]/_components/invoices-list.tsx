import { Button } from "@/components/ui/button";
import { StatusBadge, type InvoiceStatus } from "@/components/ui/status-badge";
import { Download, ExternalLink, Receipt } from "lucide-react";

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
}

interface InvoicesListProps {
  invoices: Invoice[];
}

export function InvoicesList({ invoices }: InvoicesListProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
        <Receipt className="h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Invoice pending
        </p>
        <p className="text-xs text-muted-foreground">
          Invoice will be available once processing is complete
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">{invoice.number}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Date: {invoice.date}</span>
              <span>Due: {invoice.dueDate}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-lg font-bold">
              ${invoice.amount.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View</span>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
