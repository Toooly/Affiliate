import { WorkspaceLoginPage } from "@/components/auth/workspace-login-page";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    redirectTo?: string;
  }>;
};

export default async function AdminLoginEntryPage({
  searchParams,
}: AdminLoginPageProps) {
  return <WorkspaceLoginPage workspace="merchant" searchParams={(await searchParams) ?? {}} />;
}
