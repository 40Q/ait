"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  MoreHorizontal,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminUsers,
  useSetAdminPassword,
  useSendAdminRecoveryEmail,
  type AdminUser,
} from "@/lib/hooks";
import { generatePassword } from "@/lib/utils/generate-password";

export default function AdminUsersPage() {
  const { data: users = [], isLoading, error } = useAdminUsers();

  // Set password dialog
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const setPassword = useSetAdminPassword();

  // Recovery email — per-user loading via mutation
  const sendRecovery = useSendAdminRecoveryEmail();
  const [sendingRecoveryId, setSendingRecoveryId] = useState<string | null>(null);

  const openPasswordDialog = (user: AdminUser) => {
    setPasswordTarget(user);
    setPasswordValue("");
    setShowPassword(false);
    setPasswordSuccess(false);
    setPassword.reset();
  };

  const closePasswordDialog = () => {
    setPasswordTarget(null);
    setPasswordValue("");
    setShowPassword(false);
    setPasswordSuccess(false);
    setPassword.reset();
  };

  const handleSetPassword = async () => {
    if (!passwordTarget) return;
    setPassword.mutate(
      { userId: passwordTarget.id, password: passwordValue },
      {
        onSuccess: () => setPasswordSuccess(true),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleSendRecovery = async (user: AdminUser) => {
    setSendingRecoveryId(user.id);
    sendRecovery.mutate(user.id, {
      onSuccess: () => toast.success(`Recovery email sent to ${user.email}`),
      onError: (err) => toast.error(err.message),
      onSettled: () => setSendingRecoveryId(null),
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load users: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Admin Users"
          description="Manage administrator accounts and credentials"
        />

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[52px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="text-muted-foreground">No admin users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {user.invite_pending ? (
                        <span className="text-xs text-amber-600">Invite pending</span>
                      ) : (
                        <span className="text-xs text-green-600">Active</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.last_sign_in_at
                        ? format(new Date(user.last_sign_in_at), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                            Set Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={sendingRecoveryId === user.id}
                            onClick={() => handleSendRecovery(user)}
                          >
                            {sendingRecoveryId === user.id && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Send Reset Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Set Password Dialog */}
      <Dialog open={!!passwordTarget} onOpenChange={(open) => !open && closePasswordDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription>
              {passwordTarget?.email} — set a password and share it directly.
            </DialogDescription>
          </DialogHeader>

          {passwordSuccess ? (
            <div className="py-4 text-center space-y-1">
              <p className="font-medium text-green-600">Password updated</p>
              <p className="text-sm text-muted-foreground">
                The user can now log in with the new password.
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="Enter or generate a password"
                    className="pr-9"
                    disabled={setPassword.isPending}
                  />
                  {passwordValue && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setPasswordValue(generatePassword());
                    setShowPassword(true);
                  }}
                  title="Generate password"
                  disabled={setPassword.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {setPassword.error && (
                <p className="text-sm text-destructive">{setPassword.error.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            {passwordSuccess ? (
              <Button onClick={closePasswordDialog}>Close</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={closePasswordDialog}
                  disabled={setPassword.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetPassword}
                  disabled={!passwordValue || passwordValue.length < 8 || setPassword.isPending}
                >
                  {setPassword.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Set Password
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
