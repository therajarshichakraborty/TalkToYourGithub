import { WorkspaceProvider } from "@/components/workspace/workspace-provider";
import { requireAuth } from "@/features/auth/actions";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();

  return (
    <WorkspaceProvider
      user={{ name: user.name, email: user.email, image: user.image }}
    >
      {children}
    </WorkspaceProvider>
  );
}
