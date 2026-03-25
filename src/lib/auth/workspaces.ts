import { hasBackofficeAccess } from "@/lib/auth/roles";
import type { ApplicationStatus, Role } from "@/lib/types";

export const loginWorkspaces = ["merchant", "affiliate", "pending"] as const;
export type LoginWorkspace = (typeof loginWorkspaces)[number];

export function isLoginWorkspace(value: string | null | undefined): value is LoginWorkspace {
  return value === "merchant" || value === "affiliate" || value === "pending";
}

export function getLoginPath(workspace: LoginWorkspace) {
  return workspace === "merchant" ? "/login/admin" : "/login/affiliate";
}

export function getWorkspaceDefaultPath(workspace: LoginWorkspace) {
  if (workspace === "merchant") {
    return "/admin";
  }

  return workspace === "pending" ? "/application/pending" : "/dashboard";
}

export function getProtectedLoginPath(pathname: string) {
  return pathname.startsWith("/admin") ? "/login/admin" : "/login/affiliate";
}

export function buildLoginRedirectPath(pathname: string, search = "") {
  const loginPath = getProtectedLoginPath(pathname);
  const nextPath = `${pathname}${search}`;
  return `${loginPath}?next=${encodeURIComponent(nextPath)}`;
}

export function workspaceMatchesRole(role: Role, workspace: LoginWorkspace) {
  if (workspace === "merchant") {
    return hasBackofficeAccess(role);
  }

  return !hasBackofficeAccess(role);
}

export function getWorkspaceError(role: Role, workspace?: LoginWorkspace) {
  if (!workspace) {
    return null;
  }

  if (workspace === "merchant" && !hasBackofficeAccess(role)) {
    return "Questo accesso e riservato all'area admin / gestore.";
  }

  if ((workspace === "affiliate" || workspace === "pending") && hasBackofficeAccess(role)) {
    return "Usa l'accesso admin / gestore per entrare nell'area di controllo globale.";
  }

  return null;
}

export function getPostLoginRedirect(role: Role, applicationStatus: ApplicationStatus | null) {
  if (hasBackofficeAccess(role)) {
    return "/admin";
  }

  return applicationStatus === "approved" ? "/dashboard" : "/application/pending";
}

export function sanitizeNextPath(
  nextPath: string | null | undefined,
  workspace: LoginWorkspace,
) {
  if (!nextPath) {
    return null;
  }

  let normalized = nextPath.trim();

  if (!normalized) {
    return null;
  }

  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    return null;
  }

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return null;
  }

  if (workspace === "merchant") {
    return normalized.startsWith("/admin") ? normalized : null;
  }

  return normalized.startsWith("/dashboard") || normalized.startsWith("/application/pending")
    ? normalized
    : null;
}
