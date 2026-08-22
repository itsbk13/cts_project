// ============================================================
// Authentication Service Abstraction — Patient Journey Intelligence
//
// Modes:
//   NEXT_PUBLIC_DEMO_AUTH=true  → Demo mode: accepts any credentials,
//                                  no backend call (hackathon development).
//   NEXT_PUBLIC_DEMO_AUTH=false → Real mode: calls POST /login via authApi.
//
// WARNING: Demo authentication for hackathon development.
// Replace/disable NEXT_PUBLIC_DEMO_AUTH when backend authentication
// is connected and verified.
//
// Note: Passwords are NEVER stored — not in sessionStorage, not in state.
// ============================================================

import { loginUser } from "@/services/authApi";

export interface UserSession {
  /** Hospital or organization (UI-only field, not sent to backend) */
  organization: string;
  /** Authenticated user's ID / email */
  userId: string;
  /** Display name from backend (optional) */
  userName?: string;
  /** Hospital name from backend (optional) */
  hospitalName?: string;
  /** Hospital ID generated at registration (optional) */
  hospitalId?: string;
  /** User role from backend (optional) */
  role?: string;
  /** JWT token for backend requests */
  accessToken?: string;
  isAuthenticated: boolean;
  loginTime: string;
}

const AUTH_STORAGE_KEY = "pji_auth_session";

const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_AUTH === "true" ||
  process.env.NEXT_PUBLIC_DEMO_AUTH === undefined ||
  process.env.NEXT_PUBLIC_DEMO_AUTH === "";

/**
 * Authenticate a user.
 *
 * In demo mode: accepts any credentials and creates a local session.
 * In real mode: calls POST /login and maps the backend response to UserSession.
 *
 * Note: The `organization` field is UI-only and not sent to the backend.
 * It is preserved in the session for display purposes.
 */
export async function login(
  organization: string,
  userId: string,
  password: string
): Promise<UserSession> {
  let session: UserSession;

  if (isDemoMode) {
    // ── Demo authentication (hackathon development) ─────────────
    // Accepts any non-empty credentials. Replace with real auth when ready.
    const orgName = organization.trim() || "National Hospital";
    const hId = userId.trim().toUpperCase().startsWith("USER-") ? userId.trim() : "USER-114537";
    session = {
      organization: orgName,
      userId: userId.trim() || "user@nationalhospital.com",
      userName: userId.trim() || "Demo User",
      hospitalName: orgName,
      hospitalId: hId,
      role: "Analyst",
      accessToken: hId, // Crucial: passes hospitalId directly to backend since get_hospital_id accepts raw tokens
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
    };
  } else {
    // ── Real backend authentication ──────────────────────────────
    // loginUser() throws a user-facing error string on failure.
    const data = await loginUser(userId.trim(), password);

    session = {
      organization:
        data.user.hospital_name || organization.trim() || "Healthcare Center",
      userId: data.user.user_id,
      userName: data.user.user_name,
      hospitalName: data.user.hospital_name,
      hospitalId: data.user.hospital_id || data.user.user_id,
      role: data.user.role,
      accessToken: data.access_token,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
    };
  }

  if (typeof window !== "undefined") {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

/**
 * Log out the current user and clear the session.
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Retrieve the current user session from client storage.
 * Returns null if no valid session exists.
 */
export function getCurrentUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    const session: UserSession = JSON.parse(stored);
    
    // Auto-patch demo mode sessions missing an access token so they can access the backend without re-logging in
    if (isDemoMode && session.isAuthenticated && !session.accessToken && session.hospitalId) {
      session.accessToken = session.hospitalId;
    }
    
    return session.isAuthenticated ? session : null;
  } catch {
    return null;
  }
}
