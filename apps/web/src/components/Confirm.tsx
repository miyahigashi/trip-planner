"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Options = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
};

type ConfirmFn = (opts: Options) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // ✅ 初期値 null を渡し、null 許容の型にする
  const resolverRef = useRef<((v: boolean) => void) | null>(null);
  const [opts, setOpts] = useState<Options>({});

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve; // 型OK
    });
  }, []);

  const resolve = (v: boolean) => {
    resolverRef.current?.(v); // ✅ null セーフティ
    setOpen(false);
    // 呼び出し後はクリアしておくと安心
    resolverRef.current = null;
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
              onClick={() => resolve(false)}
            />
            <div className="absolute inset-0 grid place-items-center p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                <div className="px-5 pt-5">
                  <h2 className="text-base font-semibold">
                    {opts.title ?? "確認"}
                  </h2>
                  {opts.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {opts.description}
                    </p>
                  )}
                </div>
                <div className="mt-5 flex items-center justify-end gap-2 px-5 pb-5">
                  <button
                    className="h-10 rounded-lg border px-4 text-sm hover:bg-gray-50"
                    onClick={() => resolve(false)}
                    autoFocus
                  >
                    {opts.cancelText ?? "キャンセル"}
                  </button>
                  <button
                    className={
                      "h-10 rounded-lg px-4 text-sm text-white hover:brightness-95 " +
                      (opts.tone === "danger" ? "bg-rose-600" : "bg-indigo-600")
                    }
                    onClick={() => resolve(true)}
                  >
                    {opts.confirmText ?? "OK"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmCtx.Provider>
  );
}
