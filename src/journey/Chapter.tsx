import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useExperience } from '@/store/useExperience';
import { sectionStyle } from './ui';

/** A chapter set-piece. Semantic <section> (doubles as the crawlable parallel
 *  DOM, §22); reports itself as the active chapter when it crosses the centre
 *  band so the rail can track travel. */
export default function Chapter({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const setActiveChapter = useExperience((s) => s.setActiveChapter);
  return (
    <motion.section
      id={id}
      aria-label={label}
      data-chapter={id}
      style={sectionStyle}
      onViewportEnter={() => setActiveChapter(id)}
      viewport={{ amount: 0.5 }}
    >
      {children}
    </motion.section>
  );
}
