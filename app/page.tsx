import { ClosingCta } from "@/components/landing/closing-cta";
import { Efficiency } from "@/components/landing/efficiency";
import { Faq } from "@/components/landing/faq";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Hero } from "@/components/landing/hero";
import { LandingShell } from "@/components/landing/landing-shell";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { Workflow } from "@/components/landing/workflow";
import { getServerSession } from "@/features/auth/actions";

export default async function HomePage() {
  const session = await getServerSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <LandingShell isSignedIn={isSignedIn}>
      <Hero isSignedIn={isSignedIn} />
      <ProductShowcase />
      <FeatureGrid />
      <Workflow />
      <Efficiency />
      <Faq />
      <ClosingCta isSignedIn={isSignedIn} />
    </LandingShell>
  );
}
