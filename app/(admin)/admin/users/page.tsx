"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminUsers,
  useCreateAdminUser,
  useSetAdminPassword,
  useSendAdminRecoveryEmail,
  type AdminUser,
} from "@/lib/hooks";
import { generatePassword } from "@/lib/utils/generate-password";

export default function AdminUsersPage() {
  const { data: users = [], isLoading, error } = useAdminUsers();

  // New admin dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMethod, setNewMethod] = useState<"invite" | "password">("invite");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<"invite" | "password" | null>(null);
  const createAdmin = useCreateAdminUser();

  // Set password dialog
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const setPassword = useSetAdminPassword();

  // Recovery email — per-user loading via mutation
  const sendRecovery = useSendAdminRecoveryEmail();
  const [sendingRecoveryId, setSendingRecoveryId] = useState<string | null>(null);

  const openCreateDialog = () => {
    setNewFullName("");
    setNewEmail("");
    setNewMethod("invite");
    setNewPassword("");
    setShowNewPassword(false);
    setCreateSuccess(null);
    createAdmin.reset();
    setCreateOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateOpen(false);
    setNewFullName("");
    setNewEmail("");
    setNewMethod("invite");
    setNewPassword("");
    setShowNewPassword(false);
    setCreateSuccess(null);
    createAdmin.reset();
  };

  const handleCreateAdmin = async () => {
    const withPassword = newMethod === "password";
    createAdmin.mutate(
      {
        email: newEmail,
        fullName: newFullName || undefined,
        password: withPassword ? newPassword : undefined,
      },
      {
        onSuccess: () => setCreateSuccess(withPassword ? "password" : "invite"),
        onError: (err) => toast.error(err.message),
      }
    );
  };

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
        >
          <Button onClick={openCreateDialog}>
            <UserPlus className="mr-2 h-4 w-4" />
            New Admin
          </Button>
        </PageHeader>

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

      {/* New Admin Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && closeCreateDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Admin</DialogTitle>
            <DialogDescription>
              Create a new administrator account with full access.
            </DialogDescription>
          </DialogHeader>

          {createSuccess ? (
            <div className="py-4 text-center space-y-1">
              <p className="font-medium text-green-600">
                {createSuccess === "password"
                  ? "Admin account created"
                  : "Invitation sent"}
              </p>
              <p className="text-sm text-muted-foreground">
                {createSuccess === "password"
                  ? `${newEmail} can now log in with the password below.`
                  : `${newEmail} will receive an email to set their password.`}
              </p>
              {createSuccess === "password" && (
                <p className="pt-2 font-mono text-sm break-all">{newPassword}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-admin-fullname">
                  Full Name{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="new-admin-fullname"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="John Smith"
                  disabled={createAdmin.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-admin-email">Email</Label>
                <Input
                  id="new-admin-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@company.com"
                  disabled={createAdmin.isPending}
                />
              </div>

              <RadioGroup
                value={newMethod}
                onValueChange={(value) => setNewMethod(value as "invite" | "password")}
                disabled={createAdmin.isPending}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="invite" id="new-admin-method-invite" />
                  <Label htmlFor="new-admin-method-invite" className="font-normal">
                    Send invite email
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="password" id="new-admin-method-password" />
                  <Label htmlFor="new-admin-method-password" className="font-normal">
                    Set password now
                  </Label>
                </div>
              </RadioGroup>

              {newMethod === "password" && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter or generate a password"
                      className="pr-9"
                      disabled={createAdmin.isPending}
                    />
                    {newPassword && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-2.5 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
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
                      setNewPassword(generatePassword());
                      setShowNewPassword(true);
                    }}
                    title="Generate password"
                    disabled={createAdmin.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {createAdmin.error && (
                <p className="text-sm text-destructive">{createAdmin.error.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            {createSuccess ? (
              <Button onClick={closeCreateDialog}>Close</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={closeCreateDialog}
                  disabled={createAdmin.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAdmin}
                  disabled={
                    !newEmail ||
                    (newMethod === "password" && newPassword.length < 8) ||
                    createAdmin.isPending
                  }
                >
                  {createAdmin.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {newMethod === "password" ? "Create Admin" : "Send Invite"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
