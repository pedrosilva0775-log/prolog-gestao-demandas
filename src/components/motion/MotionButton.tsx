import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type MotionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(({ children, ...props }, ref) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      whileTap={reduceMotion || props.disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </motion.button>
  );
});

MotionButton.displayName = 'MotionButton';
