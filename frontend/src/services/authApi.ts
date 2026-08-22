// ============================================================
// Auth API Service — Patient Journey Intelligence
// Centralized authentication backend integration.
//
// Backend contract (from reference implementation):
//   POST /login          { user_id, password }
//   POST /register       { user_name, hospital_name, email, role, password }
//   POST /forgot-password { email }
//   POST /verify-code    { email, code }
//   POST /reset-password { email, code, new_password }
//
// Configure via environment:
//   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
//   NEXT_PUBLIC_DEMO_AUTH=true  (bypass backend for hackathon dev)
//
// WARNING: Demo authentication for hackathon development.
// Replace/disable NEXT_PUBLIC_DEMO_AUTH when backend is connected.
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

// ── Type Contracts ─────────────────────────────────────────

export interface LoginRequest {
  user_id: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  access_token: string;
  token_type?: string;
  user: {
    user_id: string;
    user_name?: string;
    hospital_name?: string;
    hospital_id?: string;
    role?: string;
  };
}

export interface RegisterRequest {
  user_name: string;
  hospital_name: string;
  email: string;
  role: string;
  password: string;
}

export interface RegisterResponse {
  user_id: string;
  hospital_id?: string;
  message?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

// ── Internal Helper ────────────────────────────────────────

async function post<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Network-level failure (no connection, CORS, DNS, etc.)
    throw new Error(
      "Unable to connect to the authentication service. Please try again."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Surface a safe, user-facing error — never expose stack traces
    const detail =
      typeof data.detail === "string" ? data.detail : undefined;
    throw new Error(
      detail ?? "An unexpected error occurred. Please try again."
    );
  }

  return data as TResponse;
}

// ── Auth API Functions ─────────────────────────────────────

/**
 * Authenticate a user against the backend.
 * Throws a user-facing error string on failure.
 */
export async function loginUser(
  userId: string,
  password: string
): Promise<LoginResponse> {
  return post<LoginRequest, LoginResponse>("/login", {
    user_id: userId,
    password,
  });
}

/**
 * Register a new hospital user.
 * Returns the generated user_id on success.
 */
export async function registerUser(
  data: RegisterRequest
): Promise<RegisterResponse> {
  return post<RegisterRequest, RegisterResponse>("/register", data);
}

/**
 * Initiate a password reset flow.
 * The backend sends a verification code to the provided email.
 */
export async function requestPasswordReset(
  email: string
): Promise<{ message?: string }> {
  return post<PasswordResetRequest, { message?: string }>(
    "/forgot-password",
    { email }
  );
}

/**
 * Verify the reset code sent to the user's email.
 * Returns successfully if the code is valid — otherwise throws.
 */
export async function verifyResetCode(
  email: string,
  code: string
): Promise<{ message?: string }> {
  return post<VerifyCodeRequest, { message?: string }>("/verify-code", {
    email,
    code,
  });
}

/**
 * Set a new password after successful code verification.
 */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ message?: string }> {
  return post<ResetPasswordRequest, { message?: string }>("/reset-password", {
    email,
    code,
    new_password: newPassword,
  });
}
