"use client";

import { StatCard } from "@/components/ui/stat-card";
import { DollarSign, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface InvoiceStatsProps {
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  unpaidCount?: number;
  unlinkedCount?: number;
  showUnlinked?: boolean;
}

export function InvoiceStats({
  totalAmount,
  paidAmount,
  unpaidAmount,
  unpaidCount,
  unlinkedCount,
  showUnlinked = false,
}: InvoiceStatsProps) {
  const cols = showUnlinked ? "sm:grid-cols-4" : "sm:grid-cols-3";

  return (
    <div className={`grid gap-4 ${cols}`}>
      <StatCard
        title="Total Invoiced"
        value={`$${totalAmount.toLocaleString()}`}
        icon={DollarSign}
      />
      <StatCard
        title="Total Paid"
        value={`$${paidAmount.toLocaleString()}`}
        icon={CheckCircle2}
      />
      <StatCard
        title="Outstanding"
        value={`$${unpaidAmount.toLocaleString()}`}
        description={
          unpaidCount !== undefined
            ? `${unpaidCount} invoice${unpaidCount !== 1 ? "s" : ""}`
            : undefined
        }
        icon={Clock}
      />
      {showUnlinked && unlinkedCount !== undefined && (
        <StatCard
          title="Unlinked"
          value={unlinkedCount}
          description="Need to link to jobs"
          icon={AlertCircle}
        />
      )}
    </div>
  );
}
