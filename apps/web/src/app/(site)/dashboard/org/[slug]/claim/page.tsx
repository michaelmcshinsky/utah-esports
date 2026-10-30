import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getMembershipsForUser, getOrganizationBySlug } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { ClaimForm } from "@/src/components/claim-form";

export const metadata: Metadata = { title: "Claim organization" };
export const revalidate = 0;

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const { slug } = await params;
  const database = db();
  const org = await getOrganizationBySlug(database, slug);
  if (!org) notFound();
  const memberships = await getMembershipsForUser(database, user.id);
  if (!memberships.some((m) => m.orgId === org.id)) redirect(`/dashboard/org/${slug}`);

  return (
    <div className="page-container py-8">
      <nav className="text-sm text-charcoal-600">
        <Link href={`/dashboard/org/${slug}`} className="hover:text-redrock-600">
          {org.name}
        </Link>{" "}
        / <span>Claim</span>
      </nav>
      <h1 className="mt-3 font-display text-2xl font-bold">Claim {org.name}</h1>
      <p className="mt-2 max-w-xl text-sm text-charcoal-600">
        “Claimed” means ownership was checked — it is not a safety endorsement. Link a public
        page that shows your affiliation (school page, org site, official social). A moderator
        reviews every claim.
      </p>
      <ClaimForm organizationId={org.id} />
    </div>
  );
}
