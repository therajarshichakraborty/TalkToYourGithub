import { Footer } from "./footer";
import { Navbar } from "./navbar";

export function LandingShell({
  isSignedIn,
  children,
}: {
  isSignedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className='px-0 md:px-6'>
      <div className='dotted-x relative mx-auto min-h-svh max-w-6xl'>
        <Navbar isSignedIn={isSignedIn} />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
