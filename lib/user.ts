/**
 * User utilities for client identification and permissions.
 *
 * This is a centralized place for user-related checks.
 * Currently mocked - will be replaced with Supabase auth integration.
 */

// Mock user data - replace with actual Supabase user data later
interface MockUser {
  id: string;
  email: string;
  companyName: string;
  isCyrusOne: boolean;
}

// Mock current user - replace with actual auth context
const mockCurrentUser: MockUser = {
  id: "user-123",
  email: "user@example.com",
  companyName: "Example Corp",
  isCyrusOne: true, // Set to true to test CyrusOne features
};

/**
 * Check if the current user is a CyrusOne client.
 *
 * CyrusOne clients have access to special forms:
 * - E-Waste Recycling form
 * - Wood and Metal Supplies form
 * - Logistics form
 *
 * @returns boolean indicating if user is a CyrusOne client
 */
export function isCyrusOneUser(): boolean {
  // TODO: Replace with actual Supabase user check
  // Example: const user = await supabase.auth.getUser()
  // return user?.app_metadata?.client_type === 'cyrusone'
  return mockCurrentUser.isCyrusOne;
}

/**
 * Get the current user's company name.
 *
 * @returns The company name or null if not available
 */
export function getCurrentUserCompany(): string | null {
  // TODO: Replace with actual Supabase user data
  return mockCurrentUser.companyName;
}

/**
 * Get the current user's ID.
 *
 * @returns The user ID or null if not authenticated
 */
export function getCurrentUserId(): string | null {
  // TODO: Replace with actual Supabase user data
  return mockCurrentUser.id;
}
