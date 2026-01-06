"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface SyncLogEntry {
  id: string;
  timestamp: string;
  companyName: string;
  status: "success" | "error";
  recordsSynced?: number;
  errorMessage?: string;
}

// Mock data
const syncLogs: SyncLogEntry[] = [
  {
    id: "1",
    timestamp: "Today at 2:30 PM",
    companyName: "Acme Corporation",
    status: "success",
    recordsSynced: 3,
  },
  {
    id: "2",
    timestamp: "Today at 2:30 PM",
    companyName: "TechStart Inc",
    status: "success",
    recordsSynced: 1,
  },
  {
    id: "3",
    timestamp: "Today at 2:30 PM",
    companyName: "Global Systems",
    status: "error",
    errorMessage: "Customer ID not found in QuickBooks",
  },
  {
    id: "4",
    timestamp: "Today at 2:30 PM",
    companyName: "DataFlow LLC",
    status: "success",
    recordsSynced: 2,
  },
  {
    id: "5",
    timestamp: "Yesterday at 8:30 PM",
    companyName: "Acme Corporation",
    status: "success",
    recordsSynced: 0,
  },
  {
    id: "6",
    timestamp: "Yesterday at 8:30 PM",
    companyName: "TechStart Inc",
    status: "success",
    recordsSynced: 1,
  },
];

export default function SettingsPage() {
  const [syncFrequency, setSyncFrequency] = useState("6");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncing(false);
  };

  const handleTest = async () => {
    setIsTesting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure QuickBooks integration and system settings"
      />

      <div className="max-w-3xl space-y-6">
        {/* QuickBooks Connection */}
        <Card>
          <CardHeader>
            <CardTitle>QuickBooks Connection</CardTitle>
            <CardDescription>
              Manage your connection to QuickBooks Online
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Connected to QuickBooks</p>
                  <p className="text-sm text-muted-foreground">
                    AIT Recycling Services
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open QuickBooks
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Disconnect
                </Button>
              </div>
            </div>

            <Separator />

            {/* Sync Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Auto-Sync Frequency</Label>
                <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Every 6 hours</SelectItem>
                    <SelectItem value="12">Every 12 hours</SelectItem>
                    <SelectItem value="24">Daily</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How often to automatically sync invoices from QuickBooks
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </div>

            <Separator />

            {/* Sync Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Last Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Today at 2:30 PM - 6 invoices synced
                  </p>
                </div>
                <div>
                  <p className="font-medium">Next Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Today at 8:30 PM
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSync} disabled={isSyncing}>
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                  />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={isTesting}
                >
                  {isTesting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Test Connection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>
              Recent invoice sync attempts and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>{log.companyName}</TableCell>
                      <TableCell>
                        {log.status === "success" ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 hover:bg-green-100"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.status === "success"
                          ? `${log.recordsSynced} invoice${log.recordsSynced !== 1 ? "s" : ""} synced`
                          : log.errorMessage}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>
              Common issues and how to resolve them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <p className="font-medium">Customer ID not found</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Make sure the QuickBooks Customer ID in the company settings
                matches exactly with the customer ID in QuickBooks. You can find
                the ID in QuickBooks under Customers {">"} Customer Details.
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <p className="font-medium">Connection expired</p>
              </div>
              <p className="text-sm text-muted-foreground">
                QuickBooks connections expire after 100 days. If you see
                connection errors, try disconnecting and reconnecting your
                QuickBooks account.
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <p className="font-medium">Invoice not appearing</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Invoices are synced based on the customer ID linked to each
                company. Make sure the invoice is associated with the correct
                customer in QuickBooks and try syncing again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
