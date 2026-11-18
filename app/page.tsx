import { ClosingCta } from "@/components/landing/closing-cta";
import { Efficiency } from "@/components/landing/efficiency";
import { Faq } from "@/components/landing/faq";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { QuestionMarquee } from "@/components/landing/question-marquee";
import { Workflow } from "@/components/landing/workflow";
import { getServerSession } from "@/features/auth/actions";

export default async function HomePage() {
  const session = await getServerSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <div className='relative flex min-h-svh flex-col'>
      <Navbar isSignedIn={isSignedIn} />
      <main className='flex-1'>
        <Hero isSignedIn={isSignedIn} />
        <QuestionMarquee />
        <FeatureGrid />
        <Workflow />
        <Efficiency />
        <Faq />
        <ClosingCta isSignedIn={isSignedIn} />
      </main>
      <Footer />
    </div>
  );
}
