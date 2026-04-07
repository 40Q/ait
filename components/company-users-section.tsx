"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Mail,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  MoreHorizontal,
  Loader2,
  Receipt,
} from "lucide-react";
import { generatePassword } from "@/lib/utils/generate-password";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Shared user type
// ─────────────────────────────────────────────

export interface PortalUser {
  id: string;
  email: string;
  full_name: string | null;
  invite_pending: boolean;
  /** Present only in manager context */
  invoice_access?: boolean;
}

// ─────────────────────────────────────────────
// PortalUsersCard
// ─────────────────────────────────────────────

interface PortalUsersCardProps {
  companyId: string;
  users: PortalUser[];
  /**
   * API base path used to construct action URLs.
   * e.g. "/api/admin" or "/api/manager"
   */
  apiBaseUrl: string;
  /** Show "Set Password" in the actions dropdown (default false) */
  showSetPassword?: boolean;
  /** Show invoice-access toggle icon (manager only, default false) */
  showInvoiceAccess?: boolean;
  onRefetch: () => void;
}

export function PortalUsersCard({
  companyId,
  users,
  apiBaseUrl,
  showSetPassword = false,
  showInvoiceAccess = false,
  onRefetch,
}: PortalUsersCardProps) {
  // Remove user
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Set password
  const [userToSetPassword, setUserToSetPassword] = useState<{ id: string; email: string } | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Per-user loading states for icon buttons
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [sentRecoveryId, setSentRecoveryId] = useState<string | null>(null);
  const [togglingInvoiceId, setTogglingInvoiceId] = useState<string | null>(null);

  const handleResendInvite = async (user: PortalUser) => {
    setResendingId(user.id);
    try {
      const res = await fetch(`${apiBaseUrl}/invite-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          fullName: user.full_name || user.email,
          companyId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resend invite");
      }
      toast.success("Invitation resent");
      onRefetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend invite");
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyInviteLink = async (userId: string) => {
    setCopyingId(userId);
    try {
      const res = await fetch(`${apiBaseUrl}/users/${userId}/invite-link`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate link");
      await navigator.clipboard.writeText(data.inviteLink);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Invite link copied");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to copy link");
    } finally {
      setCopyingId(null);
    }
  };

  const handleSendRecoveryEmail = async (userId: string) => {
    setRecoveryId(userId);
    try {
      const res = await fetch(`${apiBaseUrl}/users/${userId}/send-recovery-email`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send email");
      }
      setSentRecoveryId(userId);
      setTimeout(() => setSentRecoveryId(null), 3000);
      toast.success("Recovery email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send recovery email");
    } finally {
      setRecoveryId(null);
    }
  };

  const handleToggleInvoiceAccess = async (userId: string, grant: boolean) => {
    setTogglingInvoiceId(userId);
    try {
      const res = await fetch(`/api/manager/users/${userId}/invoice-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update invoice access");
      }
      onRefetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update invoice access");
    } finally {
      setTogglingInvoiceId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/users/${userToDelete.id}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove user");
      }
      setUserToDelete(null);
      onRefetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to remove user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openSetPassword = (user: { id: string; email: string }) => {
    setUserToSetPassword(user);
    setPasswordValue("");
    setShowPassword(false);
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  const closeSetPassword = () => {
    setUserToSetPassword(null);
    setPasswordValue("");
    setShowPassword(false);
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  const handleSetPassword = async () => {
    if (!userToSetPassword) return;
    if (!passwordValue || passwordValue.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/users/${userToSetPassword.id}/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordValue }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Portal Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet</p>
          ) : (
            <ul className="space-y-2">
              {users.map((user) => (
                <li key={user.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0 mr-2">
                    <span className="text-muted-foreground truncate block">{user.email}</span>
                    {user.full_name && (
                      <span className="text-xs text-muted-foreground truncate block">{user.full_name}</span>
                    )}
                    {user.invite_pending && (
                      <span className="text-xs text-amber-600">Invite pending</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {showInvoiceAccess && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${user.invoice_access ? "text-green-600 hover:text-destructive" : "text-muted-foreground hover:text-green-600"}`}
                        onClick={() => handleToggleInvoiceAccess(user.id, !user.invoice_access)}
                        disabled={togglingInvoiceId === user.id}
                        title={user.invoice_access ? "Revoke invoice access" : "Grant invoice access"}
                      >
                        {togglingInvoiceId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Receipt className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.invite_pending ? (
                          <>
                            <DropdownMenuItem
                              disabled={resendingId === user.id}
                              onClick={() => handleResendInvite(user)}
                            >
                              {resendingId === user.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Resend Invite
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={copyingId === user.id}
                              onClick={() => handleCopyInviteLink(user.id)}
                            >
                              {copyingId === user.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : copiedId === user.id ? (
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                              ) : null}
                              Copy Invite Link
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem
                              disabled={recoveryId === user.id}
                              onClick={() => handleSendRecoveryEmail(user.id)}
                            >
                              {recoveryId === user.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : sentRecoveryId === user.id ? (
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                              ) : null}
                              Send Recovery Email
                            </DropdownMenuItem>
                            {showSetPassword && (
                              <DropdownMenuItem onClick={() => openSetPassword({ id: user.id, email: user.email })}>
                                Set Password
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setUserToDelete({ id: user.id, email: user.email })}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Set Password Dialog */}
      <Dialog open={!!userToSetPassword} onOpenChange={(open) => !open && closeSetPassword()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription>
              {userToSetPassword?.email} — set a password and share it with the user directly.
            </DialogDescription>
          </DialogHeader>
          {passwordSuccess ? (
            <div className="py-4 text-center space-y-1">
              <p className="font-medium text-green-600">Password updated</p>
              <p className="text-sm text-muted-foreground">The user can now log in with the new password.</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordValue}
                    onChange={(e) => { setPasswordValue(e.target.value); setPasswordError(null); }}
                    placeholder="Enter or generate a password"
                    className="pr-9"
                    disabled={passwordLoading}
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
                  onClick={() => { setPasswordValue(generatePassword()); setShowPassword(true); }}
                  title="Generate password"
                  disabled={passwordLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
          )}
          <DialogFooter>
            {passwordSuccess ? (
              <Button onClick={closeSetPassword}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeSetPassword} disabled={passwordLoading}>Cancel</Button>
                <Button onClick={handleSetPassword} disabled={!passwordValue || passwordLoading}>
                  {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Set Password
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{userToDelete?.email}</strong>? They will be permanently
              removed from the portal. You can re-invite them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─────────────────────────────────────────────
// InviteUserCard
// ─────────────────────────────────────────────

interface InviteUserCardProps {
  companyId: string;
  /**
   * API base path used to construct the invite URL.
   * e.g. "/api/admin" or "/api/manager"
   */
  apiBaseUrl: string;
  /** Show role selector (admin only) */
  showRoleSelect?: boolean;
  /** Show optional password field and generated-password display (admin only) */
  showPasswordOption?: boolean;
  onRefetch: () => void;
}

export function InviteUserCard({
  companyId,
  apiBaseUrl,
  showRoleSelect = false,
  showPasswordOption = false,
  onRefetch,
}: InviteUserCardProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [role, setRole] = useState<"client" | "manager">("client");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setIsPending(true);
    setError(null);
    setSuccess(false);
    setInviteLink(null);
    setGeneratedPassword(null);
    try {
      const res = await fetch(`${apiBaseUrl}/invite-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName: fullName || email,
          companyId,
          role: showRoleSelect ? role : undefined,
          password: showPasswordOption && password ? password : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");
      setSuccess(true);
      setInviteLink(data.inviteLink ?? null);
      setGeneratedPassword(showPasswordOption && password ? password : null);
      setEmail("");
      setFullName("");
      setPassword("");
      setShowPasswordField(false);
      onRefetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setIsPending(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleCopyPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword).then(() => {
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          {showPasswordOption ? "Add Portal User" : "Invite Portal User"}
        </CardTitle>
        <CardDescription>
          {showPasswordOption
            ? "Send an invitation or create an account with a password directly"
            : "Send an invitation to access the client portal"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSuccess(false); setError(null); }}
            placeholder="user@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-fullname">Full Name</Label>
          <Input
            id="invite-fullname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Smith"
          />
        </div>

        {showPasswordOption && (
          <div className="space-y-2">
            <Label htmlFor="invite-password">
              Password{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="invite-password"
                  type={showPasswordField ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to send email invite"
                  className="pr-9"
                />
                {password && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent"
                    onClick={() => setShowPasswordField(!showPasswordField)}
                  >
                    {showPasswordField ? (
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
                onClick={() => { setPassword(generatePassword()); setShowPasswordField(true); }}
                title="Generate password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {password
                ? "Account will be created with this password — no email sent."
                : "No password? An invite email will be sent instead."}
            </p>
          </div>
        )}

        {showRoleSelect && (
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "client" | "manager")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!email || isPending} className="w-full">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : showPasswordOption && password ? (
            <UserPlus className="mr-2 h-4 w-4" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          {showPasswordOption && password ? "Create Account" : "Send Invitation"}
        </Button>

        {success && (
          <div className="space-y-2">
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {generatedPassword ? "Account created successfully" : "Invitation sent successfully"}
            </p>
            {generatedPassword && (
              <div className="rounded-md border bg-muted p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Password to share with customer:</p>
                <p className="font-mono text-sm break-all">{generatedPassword}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={handleCopyPassword}>
                  {passwordCopied ? (
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {passwordCopied ? "Copied!" : "Copy Password"}
                </Button>
              </div>
            )}
            {inviteLink && (
              <Button variant="outline" size="sm" className="w-full" onClick={handleCopyLink}>
                {linkCopied ? (
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {linkCopied ? "Copied!" : "Copy Invitation Link"}
              </Button>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
