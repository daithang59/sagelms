import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import Button from './Button';
import AnimatedPopup from './AnimatedPopup';
import { ConfirmDialogContext, type ConfirmFn, type ConfirmOptions } from '../../contexts/ConfirmContext';

interface PendingConfirm extends Required<Omit<ConfirmOptions, 'variant'>> {
  variant: NonNullable<ConfirmOptions['variant']>;
  resolve: (confirmed: boolean) => void;
}

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

const defaultOptions: Required<Omit<ConfirmOptions, 'variant'>> & { variant: NonNullable<ConfirmOptions['variant']> } = {
  title: 'Xác nhận thao tác',
  message: '',
  confirmLabel: 'Xác nhận',
  cancelLabel: 'Hủy',
  variant: 'default',
};

export default function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const close = useCallback((confirmed: boolean) => {
    setPending((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => (
    new Promise<boolean>((resolve) => {
      const normalized = typeof options === 'string'
        ? { ...defaultOptions, message: options }
        : { ...defaultOptions, ...options };
      setPending({ ...normalized, resolve });
    })
  ), []);

  const contextValue = useMemo(() => confirm, [confirm]);
  const isDanger = pending?.variant === 'danger';

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <AnimatedPopup
        isOpen={Boolean(pending)}
        onClose={() => close(false)}
        zIndexClassName="z-[70]"
        labelledBy="confirm-dialog-title"
        describedBy="confirm-dialog-message"
        panelClassName="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
      >
        {pending && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
          >
            <div className="relative flex flex-col items-center px-6 pb-6 pt-6 text-center">
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDanger ? 'bg-rose-50 text-rose-600' : 'bg-violet-50 text-violet-600'}`}>
                {isDanger ? <AlertTriangle className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-center">
                  <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-900">
                    {pending.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="absolute right-5 top-5 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Hủy xác nhận"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p id="confirm-dialog-message" className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-slate-600">
                  {pending.message}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => close(false)}>
                {pending.cancelLabel}
              </Button>
              <Button type="button" variant={isDanger ? 'danger' : 'primary'} onClick={() => close(true)}>
                {pending.confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </AnimatedPopup>
    </ConfirmDialogContext.Provider>
  );
}
