export const lightColors = {
  background: '#F5F7FB', surface: '#FFFFFF', surfaceElevated: '#FFFFFF', text: '#152033',
  textMuted: '#667085', border: '#D9E0EA', primary: '#2563EB', primaryText: '#FFFFFF',
  danger: '#C93838', dangerText: '#FFFFFF', tabInactive: '#7C8798', success: '#15803D',
} as const;

export const darkColors = {
  background: '#0B1220', surface: '#121C2D', surfaceElevated: '#19263A', text: '#F1F5F9',
  textMuted: '#A7B1C2', border: '#2E3C52', primary: '#60A5FA', primaryText: '#08111F',
  danger: '#F87171', dangerText: '#1A0909', tabInactive: '#8491A6', success: '#4ADE80',
} as const;

export type AppColors = typeof lightColors | typeof darkColors;
