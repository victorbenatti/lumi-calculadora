import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  items: FaqItem[];
  className?: string;
};

export function FaqSection({ eyebrow, title, description, items, className = '' }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className={className}>
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-brown text-white shadow-[0_10px_24px_rgba(61,43,31,0.16)]">
          <HelpCircle className="h-4 w-4" />
        </div>
        <div>
          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-brown/40">
              {eyebrow}
            </p>
          )}
          <h2 className="text-2xl font-semibold tracking-tight text-brand-brown">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-brand-brown/55">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-brown/10 bg-white shadow-[0_8px_30px_rgba(61,43,31,0.04)]">
        {items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={item.question} className="border-b border-brand-brown/5 last:border-b-0">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-[#fcfbf9] sm:px-5"
              >
                <span className="text-sm font-semibold leading-snug text-brand-brown sm:text-base">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-brand-brown/45 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-5 text-sm leading-relaxed text-brand-brown/60 sm:px-5">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
