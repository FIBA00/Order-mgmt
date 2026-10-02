export function money(cents) {
  const amount = Number(cents) || 0;
  return `$${(amount / 100).toFixed(2)}`;
}
