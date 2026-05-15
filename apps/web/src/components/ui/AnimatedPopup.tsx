import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, type ReactNode } from 'react';

interface AnimatedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  overlayClassName?: string;
  labelledBy?: string;
  describedBy?: string;
  closeOnOverlay?: boolean;
  zIndexClassName?: string;
}

export default function AnimatedPopup({
  isOpen,
  onClose,
  children,
  panelClassName = '',
  overlayClassName = '',
  labelledBy,
  describedBy,
  closeOnOverlay = true,
  zIndexClassName = 'z-50',
}: AnimatedPopupProps) {
  const reduceMotion = useReducedMotion();
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleEscape, isOpen]);

  const panelInitial = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 14 };
  const panelAnimate = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 };
  const panelExit = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 10 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-4`}>
          <motion.button
            type="button"
            aria-label="Đóng popup"
            className={`absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm ${overlayClassName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: 'easeOut' }}
            onClick={closeOnOverlay ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            className={`relative ${panelClassName}`}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
