// src/data/insulins.ts
export type Acting =
  | 'rapid'      // e.g., Aspart/NovoRapid, Lispro/Humalog
  | 'short'      // e.g., Actrapid (regular)
  | 'intermediate' // e.g., NPH/Insulatard
  | 'long'       // e.g., Glargine (Lantus), Detemir (Levemir), Degludec (Tresiba)
  | 'premix';    // e.g., Biphasic 30/70

export interface Insulin {
  id: string;
  brand: string;           // e.g., "Lantus"
  generic: string;         // e.g., "Insulin glargine"
  acting: Acting;
  onsetMin: number;        // time to onset in minutes
  peakMin?: number | null; // time to peak in minutes (null if flat)
  durationH: number;       // duration in hours
  tags?: string[];         // optional: e.g., ["basal"], ["prandial"], ["premix 30/70"]
}

export const INSULIN_CATALOGUE: Insulin[] = [
  // Rapid
  { id: 'aspart', brand: 'NovoRapid', generic: 'Insulin aspart', acting: 'rapid', onsetMin: 10, peakMin: 60, durationH: 4, tags: ['prandial'] },
  { id: 'lispro', brand: 'Humalog', generic: 'Insulin lispro', acting: 'rapid', onsetMin: 10, peakMin: 60, durationH: 4, tags: ['prandial'] },
  // Short
  { id: 'regular', brand: 'Actrapid', generic: 'Regular insulin', acting: 'short', onsetMin: 30, peakMin: 120, durationH: 6, tags: ['prandial'] },
  // Intermediate (NPH)
  { id: 'nph', brand: 'Insulatard', generic: 'Isophane (NPH)', acting: 'intermediate', onsetMin: 90, peakMin: 360, durationH: 12, tags: ['basal'] },
  // Long
  { id: 'glargine', brand: 'Lantus', generic: 'Insulin glargine U100', acting: 'long', onsetMin: 90, peakMin: null, durationH: 24, tags: ['basal'] },
  { id: 'detemir', brand: 'Levemir', generic: 'Insulin detemir', acting: 'long', onsetMin: 90, peakMin: null, durationH: 20, tags: ['basal'] },
  { id: 'degludec', brand: 'Tresiba', generic: 'Insulin degludec', acting: 'long', onsetMin: 60, peakMin: null, durationH: 42, tags: ['basal'] },
  // Premix
  { id: 'biphasic30', brand: 'NovoMix 30', generic: 'Biphasic aspart 30', acting: 'premix', onsetMin: 10, peakMin: 60, durationH: 18, tags: ['premix 30/70'] },
  // Add more from your table as needed
];
