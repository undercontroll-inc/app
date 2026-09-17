export function bottomDockPadding(insets = {}, extra = 16) {
  return Math.max(insets.bottom || 0, 8) + extra;
}
