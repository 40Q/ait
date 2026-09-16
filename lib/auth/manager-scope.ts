import { createAdminClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;

export type ManagerScopeResult =
  | { ok: true; managerCompanyId: string }
  | { ok: false };

/**
 * Verify that `targetCompanyId` is a sub-company of the manager's own company.
 *
 * Both `profiles.company_id` and `companies.parent_company_id` are nullable
 * (company deletion sets them to NULL), so a plain `!==` comparison would let a
 * manager with no company (null) pass the check against every top-level company
 * (parent_company_id null). Both null cases are rejected explicitly here.
 */
export async function assertManagerOwnsCompany(
  adminClient: AdminClient,
  managerUserId: string,
  targetCompanyId: string | null | undefined
): Promise<ManagerScopeResult> {
  if (!targetCompanyId) {
    return { ok: false };
  }

  const { data: managerProfile } = await adminClient
    .from("profiles")
    .select("company_id")
    .eq("id", managerUserId)
    .single();

  const managerCompanyId = managerProfile?.company_id;

  if (!managerCompanyId) {
    return { ok: false };
  }

  if (!(await isSubCompanyOf(adminClient, managerCompanyId, targetCompanyId))) {
    return { ok: false };
  }

  return { ok: true, managerCompanyId };
}

/**
 * True when `targetCompanyId` is a non-null company whose parent is
 * `managerCompanyId`. Null ids on either side always return false.
 */
export async function isSubCompanyOf(
  adminClient: AdminClient,
  managerCompanyId: string | null | undefined,
  targetCompanyId: string | null | undefined
): Promise<boolean> {
  if (!managerCompanyId || !targetCompanyId) {
    return false;
  }

  const { data: targetCompany } = await adminClient
    .from("companies")
    .select("parent_company_id")
    .eq("id", targetCompanyId)
    .single();

  return !!targetCompany && targetCompany.parent_company_id === managerCompanyId;
}
