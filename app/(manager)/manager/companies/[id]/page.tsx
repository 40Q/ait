"use client";

import { useState, use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Loader2,
  UserPlus,
  Mail,
  CheckCircle2,
  Users,
  Trash2,
  Copy,
  Check,
  Receipt,
  BellRing,
  KeyRound,
} from "lucide-react";
import {
  useSubCompanyUsers,
  useManagerInviteUser,
  useManagerDeactivateUser,
  useToggleInvoiceAccess,
} from "@/lib/hooks";

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ManagerCompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = use(params);

  const { data: users = [], refetch: refetchUsers } = useSubCompanyUsers(id);
  const requestingUsers = users.filter((u) => u.invoice_access_requested);
  const inviteUser = useManagerInviteUser();
  const deleteUser = useManagerDeactivateUser();
  const toggleInvoiceAccess = useToggleInvoiceAccess();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copyingLinkId, setCopyingLinkId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [sendingRecoveryId, setSendingRecoveryId] = useState<string | null>(null);
  const [sentRecoveryId, setSentRecoveryId] = useState<string | null>(null);

  const handleInviteUser = () => {
    if (!inviteEmail) return;

    setInviteSuccess(false);
    setInviteLink(null);
    inviteUser.mutate(
      {
        email: inviteEmail,
        fullName: inviteFullName || inviteEmail,
        companyId: id,
      },
      {
        onSuccess: (data) => {
          setInviteEmail("");
          setInviteFullName("");
          setInviteSuccess(true);
          setInviteLink(data.inviteLink ?? null);
          refetchUsers();
        },
      }
    );
  };

  const handleResendInvite = (user: { id: string; email: string; full_name: string | null }) => {
    setResendingId(user.id);
    inviteUser.mutate(
      { email: user.email, fullName: user.full_name || user.email, companyId: id },
      { onSettled: () => setResendingId(null) }
    );
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleCopyInviteLink = async (userId: string) => {
    setCopyingLinkId(userId);
    try {
      const response = await fetch(`/api/manager/users/${userId}/invite-link`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await navigator.clipboard.writeText(result.inviteLink);
      setCopiedLinkId(userId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    } finally {
      setCopyingLinkId(null);
    }
  };

  const handleSendRecoveryEmail = async (userId: string) => {
    setSendingRecoveryId(userId);
    try {
      const response = await fetch(`/api/manager/users/${userId}/send-recovery-email`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSentRecoveryId(userId);
      setTimeout(() => setSentRecoveryId(null), 3000);
    } catch (err) {
      console.error("Failed to send recovery email:", err);
    } finally {
      setSendingRecoveryId(null);
    }
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;

    deleteUser.mutate(userToDelete.id, {
      onSuccess: () => {
        setUserToDelete(null);
        refetchUsers();
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/manager/companies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Company Details"
          description="Manage users for this company"
        />
      </div>

      {requestingUsers.length > 0 && (
        <div className="max-w-3xl rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <BellRing className="h-5 w-5 shrink-0" />
            <p className="font-semibold text-sm">
              {requestingUsers.length === 1
                ? "1 user is requesting invoice access"
                : `${requestingUsers.length} users are requesting invoice access`}
            </p>
          </div>
          <ul className="space-y-2">
            {requestingUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-2 rounded-md bg-amber-100 dark:bg-amber-900/30 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{user.full_name || user.email}</p>
                  {user.full_name && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={toggleInvoiceAccess.isPending}
                    onClick={() =>
                      toggleInvoiceAccess.mutate(
                        { userId: user.id, grant: false },
                        { onSuccess: () => refetchUsers() }
                      )
                    }
                  >
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={toggleInvoiceAccess.isPending}
                    onClick={() =>
                      toggleInvoiceAccess.mutate(
                        { userId: user.id, grant: true },
                        { onSuccess: () => refetchUsers() }
                      )
                    }
                  >
                    Grant Access
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 max-w-3xl">
        {/* Portal Users */}
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
                  <li
                    key={user.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-muted-foreground truncate">{user.email}</p>
                      {user.full_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.full_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${user.invoice_access ? "text-green-600 hover:text-destructive" : "text-muted-foreground hover:text-green-600"}`}
                        onClick={() =>
                          toggleInvoiceAccess.mutate(
                            { userId: user.id, grant: !user.invoice_access },
                            { onSuccess: () => refetchUsers() }
                          )
                        }
                        disabled={toggleInvoiceAccess.isPending}
                        title={user.invoice_access ? "Revoke invoice access" : "Grant invoice access"}
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      {user.invite_pending ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleResendInvite(user)}
                            disabled={resendingId === user.id}
                            title="Resend invitation email"
                          >
                            {resendingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyInviteLink(user.id)}
                            disabled={copyingLinkId === user.id}
                            title="Copy invitation link"
                          >
                            {copyingLinkId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : copiedLinkId === user.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleSendRecoveryEmail(user.id)}
                          disabled={sendingRecoveryId === user.id}
                          title={sentRecoveryId === user.id ? "Email sent!" : "Send password recovery email"}
                        >
                          {sendingRecoveryId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : sentRecoveryId === user.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setUserToDelete({ id: user.id, email: user.email })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Invite User */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Portal User
            </CardTitle>
            <CardDescription>
              Send an invitation to access the client portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteSuccess(false);
                }}
                placeholder="user@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteFullName">Full Name</Label>
              <Input
                id="inviteFullName"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <Button
              onClick={handleInviteUser}
              disabled={!inviteEmail || inviteUser.isPending}
              className="w-full"
            >
              {inviteUser.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Invitation
            </Button>
            {inviteSuccess && (
              <div className="space-y-2">
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Invitation sent successfully
                </p>
                {inviteLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleCopyLink}
                  >
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
            {inviteUser.error && (
              <p className="text-sm text-destructive">{inviteUser.error.message}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete User Confirmation */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{userToDelete?.email}</strong>? They will be permanently
              removed from the portal. You can re-invite them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteUser.error && (
            <p className="text-sm text-destructive">{deleteUser.error.message}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
