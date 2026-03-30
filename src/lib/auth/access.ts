import { hasBackofficeAccess } from "@/lib/auth/roles";
import { getRepository } from "@/lib/data/repository";
import type { ApplicationStatus, Role } from "@/lib/types";

export interface AffiliateAccessState {
  applicationStatus: ApplicationStatus | null;
  isActive: boolean | null;
}

export async function getAffiliateAccessState(
  profileId: string,
): Promise<AffiliateAccessState> {
  const repository = getRepository();
  const [applicationStatus, settings] = await Promise.all([
    repository.getApplicationStatusForProfile(profileId),
    repository.getInfluencerSettings(profileId),
  ]);

  return {
    applicationStatus,
    isActive: settings?.influencer.isActive ?? null,
  };
}

export function getPostLoginPath(
  role: Role,
  accessState: AffiliateAccessState,
) {
  if (hasBackofficeAccess(role)) {
    return "/admin";
  }

  if (accessState.applicationStatus !== "approved") {
    return "/application/pending";
  }

  if (accessState.isActive === false) {
    return "/application/inactive";
  }

  return "/dashboard";
}
