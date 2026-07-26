export type ItemLayout = {
  y: number;
  height: number;
};

export function moveItem<T>(items: readonly T[], from: number, to: number): readonly T[] {
  if (
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length ||
    from === to
  ) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}

export function targetIndexForDrag(
  from: number,
  translatedCenterY: number,
  layouts: readonly ItemLayout[],
): number {
  if (!layouts[from] || layouts.length === 0) return from;

  let target = 0;
  for (const [index, layout] of layouts.entries()) {
    if (translatedCenterY >= layout.y + layout.height / 2) {
      target = index;
    }
  }

  return Math.max(0, Math.min(layouts.length - 1, target));
}
