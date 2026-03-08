export const formatMoney = (val: number) => {
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)} Jt`;
  return `Rp ${val.toLocaleString()}`;
};
