import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/motion/reveal";
import { Section, SectionHeading } from "./section";

const FAQS = [
  {
    q: "What can it access?",
    a: "Exactly what your GitHub account can: your own repositories, ones you collaborate on, and those of organizations you belong to. Requests are made with your own OAuth token.",
  },
  {
    q: "Can it change my code?",
    a: "No. It reads code, commits, branches, pull requests and issues. It can draft an issue, but only you can file it, with one click on the draft.",
  },
  {
    q: "How do I sign in?",
    a: "With GitHub only. There are no separate passwords or email accounts, and you can revoke access any time from GitHub → Settings → Applications.",
  },
  {
    q: "Why are the answers so short?",
    a: "By design. The assistant leads with the answer and keeps replies brief to save time and tokens. Ask for more detail whenever you want it.",
  },
  {
    q: "I have a lot of repositories. Will they all show up?",
    a: "Yes. Repository listing follows GitHub's pagination to the end, and the dashboard lets you search, filter and sort the full list.",
  },
];

export function Faq() {
  return (
    <Section id='faq'>
      <div className='grid gap-12 md:grid-cols-[1fr_1.4fr]'>
        <SectionHeading
          align='left'
          eyebrow='FAQ'
          title='Questions, answered'
          description='Anything else? Sign in and ask the assistant itself.'
        />
        <Reveal delay={0.1}>
          <Accordion type='single' collapsible className='w-full'>
            {FAQS.map((item) => (
              <AccordionItem
                key={item.q}
                value={item.q}
                className='border-b-2 border-dotted border-dot last:border-b-0'
              >
                <AccordionTrigger className='py-6 text-left text-base font-medium transition-colors hover:text-brand hover:no-underline'>
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className='pb-6 text-[15px] leading-relaxed text-muted-foreground'>
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
