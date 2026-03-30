import { WorkspaceLoginPage } from "@/components/auth/workspace-login-page";

type AffiliateLoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    redirectTo?: string;
    application?: string;
  }>;
};

export default async function AffiliateLoginEntryPage({
  searchParams,
}: AffiliateLoginPageProps) {
  return <WorkspaceLoginPage workspace="affiliate" searchParams={(await searchParams) ?? {}} />;
}
