'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartLine } from '@/lib/types';
import { round2, totalFromLines } from '@/lib/format';

interface CartState {
  lines: CartLine[];
  /** Bumped whenever the cart changes, so fly-to-cart animations can trigger. */
  lastAdded: { sku: string; at: number } | null;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (productId: string, variantValue: string | undefined, quantity: number) => void;
  remove: (productId: string, variantValue?: string) => void;
  clear: () => void;
}

const keyOf = (l: { productId: string; variant?: { value: string } | null }) =>
  `${l.productId}::${l.variant?.value ?? ''}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      lastAdded: null,

      add: (line, quantity = 1) => {
        const incoming = { ...line, quantity: Math.max(1, quantity) };
        const lines = [...get().lines];
        const idx = lines.findIndex((l) => keyOf(l) === keyOf(incoming));

        if (idx >= 0) {
          const merged = { ...lines[idx] };
          merged.quantity = Math.min(merged.quantity + incoming.quantity, merged.maxStock || 99);
          lines[idx] = merged;
        } else {
          incoming.quantity = Math.min(incoming.quantity, incoming.maxStock || 99);
          lines.push(incoming);
        }
        set({ lines, lastAdded: { sku: line.sku, at: Date.now() } });
      },

      setQuantity: (productId, variantValue, quantity) => {
        const target = `${productId}::${variantValue ?? ''}`;
        set({
          lines: get()
            .lines.map((l) =>
              keyOf(l) === target
                ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxStock || 99)) }
                : l,
            )
            .filter((l) => l.quantity > 0),
        });
      },

      remove: (productId, variantValue) => {
        const target = `${productId}::${variantValue ?? ''}`;
        set({ lines: get().lines.filter((l) => keyOf(l) !== target) });
      },

      clear: () => set({ lines: [] }),
    }),
    {
      name: 'sbd.cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Derived selectors. Totals are computed in paise to avoid float drift. */
export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);

export const cartSubtotal = (lines: CartLine[]) =>
  totalFromLines(
    lines.map((l) => ({
      unitPrice: round2(l.unitPrice + (l.variant?.priceDelta ?? 0)),
      quantity: l.quantity,
    })),
  );

export const FREE_SHIPPING_THRESHOLD = 499;
export const SHIPPING_FEE = 49;

export const cartShipping = (subtotal: number) =>
  subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
