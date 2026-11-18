import { Reveal } from "@/components/motion/reveal";
import { ProductPreview } from "./product-preview";
import { Section, SectionHeading } from "./section";

export function ProductShowcase() {
  return (
    <Section id='product'>
      <SectionHeading
        eyebrow='Product'
        title='One conversation for every repository'
        description='Pick a repository, ask a question, and get an answer backed by live GitHub data. The tools it used are shown right in the reply.'
      />
      <Reveal>
        <ProductPreview />
      </Reveal>
    </Section>
  );
}
