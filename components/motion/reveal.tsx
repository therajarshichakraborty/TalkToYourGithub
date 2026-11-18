"use client";

import { motion, type Variants } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const VIEWPORT = { once: true, margin: "-60px" } as const;

const groupTags = {
  div: motion.div,
  ol: motion.ol,
  ul: motion.ul,
  dl: motion.dl,
} as const;

const itemTags = {
  div: motion.div,
  li: motion.li,
} as const;

export function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  as = "div",
  stagger = 0.08,
  className,
  children,
}: {
  as?: keyof typeof groupTags;
  stagger?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = groupTags[as];
  return (
    <Tag
      className={className}
      initial='hidden'
      whileInView='show'
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  as = "div",
  className,
  children,
}: {
  as?: keyof typeof itemTags;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = itemTags[as];
  return (
    <Tag className={className} variants={itemVariants}>
      {children}
    </Tag>
  );
}
