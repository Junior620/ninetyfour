"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ToastItem = { id: number; message: string };

let pushToastExternal: ((message: string) => void) | null = null;

export function toast(message: string) {
  pushToastExternal?.(message);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const push = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  useEffect(() => {
    pushToastExternal = push;
    return () => {
      pushToastExternal = null;
    };
  }, [push]);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto rounded-xl border border-[#E5E2D9] bg-white px-4 py-3 text-sm font-medium text-navy shadow-lg",
            "animate-in fade-in slide-in-from-bottom-2 duration-200"
          )}
          role="status"
        >
          {item.message}
        </div>
      ))}
    </div>,
    document.body
  );
}
