import { motion } from 'framer-motion';
import { useMotion } from '../../app/MotionContext';

interface CutTransitionProps {
  children: React.ReactNode;
}

export default function CutTransition({ children }: CutTransitionProps) {
  const { reducedMotion } = useMotion();

  if (reducedMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ clipPath: 'inset(0 50% 0 50%)', opacity: 0 }}
      animate={{ clipPath: 'inset(0 0% 0 0%)', opacity: 1 }}
      exit={{ clipPath: 'inset(0 50% 0 50%)', opacity: 0 }}
      transition={{
        clipPath: { duration: 0.7, ease: [0.77, 0, 0.18, 1] },
        opacity: { duration: 0.3 },
      }}
    >
      {children}
    </motion.div>
  );
}
