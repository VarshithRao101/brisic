import { notFound } from "next/navigation";
import { getAccess } from "@/lib/creators";
import { BackButton } from "@/components/controls";
import { AdminNav } from "@/components/admin-nav";

export const metadata = { title: "Admin · Brisic" };

/** Every /admin page: admins only (ADMIN_EMAILS), with the admin tabs on top. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccess();
  if (!access.isAdmin) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <BackButton />
      <h1 className="m-0 text-[28px] font-bold text-white">Brisic <span className="text-primary">Admin</span></h1>
      <AdminNav />
      {children}
    </div>
  );
}
