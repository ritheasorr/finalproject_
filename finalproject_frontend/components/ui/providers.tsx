"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

interface UIProvidersProps {
  children: ReactNode;
}

export function UIProviders({ children }: UIProvidersProps) {
  return (
    <TooltipProvider delayDuration={180}>
      {children}
      <Toaster
        richColors
        closeButton
        toastOptions={{
          className: "shadow-lg",
        }}
      />
    </TooltipProvider>
  );
}
