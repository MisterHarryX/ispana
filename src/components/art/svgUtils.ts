const fmt = (n: number) => Math.round(n * 100) / 100;

/** Four-point sparkle path centred on (cx, cy). */
export function sparklePath(cx: number, cy: number, r: number, waist = 0.16): string {
  const w = r * waist;
  return `M${fmt(cx)} ${fmt(cy - r)}C${fmt(cx + w)} ${fmt(cy - w)} ${fmt(cx + w)} ${fmt(cy - w)} ${fmt(cx + r)} ${fmt(cy)}C${fmt(cx + w)} ${fmt(cy + w)} ${fmt(cx + w)} ${fmt(cy + w)} ${fmt(cx)} ${fmt(cy + r)}C${fmt(cx - w)} ${fmt(cy + w)} ${fmt(cx - w)} ${fmt(cy + w)} ${fmt(cx - r)} ${fmt(cy)}C${fmt(cx - w)} ${fmt(cy - w)} ${fmt(cx - w)} ${fmt(cy - w)} ${fmt(cx)} ${fmt(cy - r)}Z`;
}
