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
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">{invoice.number}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Date: {invoice.date}</span>
              <span>Due: {invoice.dueDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold">
              ${invoice.amount.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
