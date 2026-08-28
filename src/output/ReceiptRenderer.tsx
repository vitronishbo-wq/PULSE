import React from 'react';
import { FormattedReceiptPayload, ReceiptFormat } from '../types/pulse';
import { Thermal58Template } from './templates/thermal58';
import { Thermal80Template } from './templates/thermal80';
import { A4Template } from './templates/a4';

interface ReceiptRendererProps {
  payload: FormattedReceiptPayload;
  format?: ReceiptFormat;
}

export const ReceiptRenderer: React.FC<ReceiptRendererProps> = ({
  payload,
  format = 'THERMAL_80',
}) => {
  if (format === 'THERMAL_58') {
    return <Thermal58Template payload={payload} />;
  }

  if (format === 'A4') {
    return <A4Template payload={payload} />;
  }

  // Default to industry standard 80mm
  return <Thermal80Template payload={payload} />;
};
