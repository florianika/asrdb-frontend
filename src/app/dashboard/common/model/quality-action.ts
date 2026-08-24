export const QUALITY_ACTIONS = ['ADR', 'MISS', 'QUE', 'ERR', 'ESS'] as const;

export type QualityAction = (typeof QUALITY_ACTIONS)[number];
