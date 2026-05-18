export const dicomModalities = ['CR', 'CT', 'DX', 'MG', 'MR', 'NM', 'OT', 'PT', 'RF', 'US', 'XA'] as const;

export type DicomModality = (typeof dicomModalities)[number];
export type DicomModalityValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const dicomModalityOptions = dicomModalities.map((label, value) => ({
  label,
  value: value as DicomModalityValue,
}));

export function getDicomModalityLabel(modality?: number | string) {
  if (typeof modality === 'string') {
    return dicomModalities.includes(modality as DicomModality) ? modality : '-';
  }

  if (typeof modality === 'number') {
    return dicomModalities[modality] ?? '-';
  }

  return '-';
}

export function getDicomModalityValue(modality?: number | string): DicomModalityValue {
  if (typeof modality === 'string') {
    const index = dicomModalities.indexOf(modality as DicomModality);

    return index >= 0 ? (index as DicomModalityValue) : 0;
  }

  if (typeof modality === 'number') {
    return dicomModalities[modality] ? (modality as DicomModalityValue) : 0;
  }

  return 0;
}
