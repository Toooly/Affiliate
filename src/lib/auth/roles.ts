import type { Role } from "@/lib/types";

export function hasBackofficeAccess(role: Role) {
  return role === "ADMIN" || role === "MANAGER";
}
