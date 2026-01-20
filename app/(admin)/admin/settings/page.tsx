"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  useQuickBooksStatus,
  useSyncInvoices,
  useDisconnectQuickBooks,
} from "@/lib/hooks";
import { formatDateTimeShort } from "@/lib/utils/date";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isTesting, setIsTesting] = useState(false);

  const { data: qbStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuickBooksStatus();
  const syncInvoices = useSyncInvoices();
  const disconnectQB = useDisconnectQuickBooks();

  const handleConnect = () => {
    // Redirect to QuickBooks OAuth flow
    window.location.href = "/api/quickbooks/connect";
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect from QuickBooks?")) {
      return;
    }

    try {
      await disconnectQB.mutateAsync();
      toast.success("Disconnected from QuickBooks");
      refetchStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncInvoices.mutateAsync();
      toast.success(
        `Synced ${result.result.synced} invoices (${result.result.skipped} skipped)`
      );
      if (result.result.errors.length > 0) {
        console.warn("Sync errors:", result.result.errors);
        toast.warning(`${result.result.errors.length} errors during sync`);
      }
      refetchStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync invoices");
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await refetchStatus();
      if (qbStatus?.connected) {
        toast.success("Connection successful");
      } else {
        toast.error("Connection test failed");
      }
    } catch {
      toast.error("Connection test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return formatDateTimeShort(dateString);
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
            {statusLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : qbStatus?.connected ? (
              <>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Connected to QuickBooks</p>
                      <p className="text-sm text-muted-foreground">
                        Realm ID: {qbStatus.realmId}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open("https://quickbooks.intuit.com", "_blank")
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open QuickBooks
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={handleDisconnect}
                      disabled={disconnectQB.isPending}
                    >
                      {disconnectQB.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Disconnect
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Token Status */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Access Token Expires</p>
                    <p className="font-medium">
                      {formatDate(qbStatus.tokenExpiresAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Refresh Token Expires</p>
                    <p className="font-medium">
                      {formatDate(qbStatus.refreshTokenExpiresAt)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Sync Actions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Last Sync</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(qbStatus.lastSync)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSync} disabled={syncInvoices.isPending}>
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${
                          syncInvoices.isPending ? "animate-spin" : ""
                        }`}
                      />
                      {syncInvoices.isPending ? "Syncing..." : "Sync Now"}
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
              </>
            ) : (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <XCircle className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Not connected</p>
                    <p className="text-sm text-muted-foreground">
                      {qbStatus?.error || "Connect your QuickBooks account to sync invoices"}
                    </p>
                  </div>
                </div>
                <Button onClick={handleConnect}>Connect QuickBooks</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
