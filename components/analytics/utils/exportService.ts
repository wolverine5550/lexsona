import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type {
  ExportFormat,
  ExportConfig,
  ExportResult,
  ExportServiceConfig
} from '../types';

/**
 * Default export service configuration
 */
const DEFAULT_CONFIG: ExportServiceConfig = {
  clientSideLimit: 10000,
  useServerSide: false,
  timeout: 30000
};

/**
 * Formats a date according to the specified format string
 */
const formatDate = (
  date: string | Date,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
) => {
  return format(new Date(date), formatStr);
};

/**
 * Formats a number according to the specified format
 */
const formatNumber = (num: number, format: string = '0.00') => {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Converts data to CSV format
 */
const toCSV = <T>(
  data: T[],
  fieldMappings: Record<string, string>,
  config: ExportConfig
): string => {
  const headers = Object.values(fieldMappings);
  const fields = Object.keys(fieldMappings);

  const rows = data.map((item) =>
    fields.map((field) => {
      const value = item[field as keyof T];
      if (
        value instanceof Date ||
        (typeof value === 'string' && Date.parse(value))
      ) {
        return formatDate(value, config.options?.dateFormat);
      }
      if (typeof value === 'number') {
        return formatNumber(value, config.options?.numberFormat);
      }
      return value;
    })
  );

  if (config.options?.includeHeaders !== false) {
    rows.unshift(headers);
  }

  return rows.map((row) => row.join(',')).join('\n');
};

/**
 * Converts data to XLSX format
 */
const toXLSX = <T>(
  data: T[],
  fieldMappings: Record<string, string>,
  config: ExportConfig
): Uint8Array => {
  const headers = Object.values(fieldMappings);
  const fields = Object.keys(fieldMappings);

  const rows = data.map((item) =>
    fields.map((field) => {
      const value = item[field as keyof T];
      if (
        value instanceof Date ||
        (typeof value === 'string' && Date.parse(value))
      ) {
        return formatDate(value, config.options?.dateFormat);
      }
      if (typeof value === 'number') {
        return formatNumber(value, config.options?.numberFormat);
      }
      return value;
    })
  );

  if (config.options?.includeHeaders !== false) {
    rows.unshift(headers);
  }

  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(rows);
  utils.book_append_sheet(wb, ws, 'Data');

  return write(wb, { type: 'array' });
};

/**
 * Converts data to PDF format
 */
const toPDF = <T>(
  data: T[],
  fieldMappings: Record<string, string>,
  config: ExportConfig
): Uint8Array => {
  const doc = new jsPDF();
  const headers = Object.values(fieldMappings);
  const fields = Object.keys(fieldMappings);

  const rows = data.map((item) =>
    fields.map((field) => {
      const value = item[field as keyof T];
      if (
        value instanceof Date ||
        (typeof value === 'string' && Date.parse(value))
      ) {
        return formatDate(value, config.options?.dateFormat);
      }
      if (typeof value === 'number') {
        return formatNumber(value, config.options?.numberFormat);
      }
      return value;
    })
  );

  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 20,
    margin: { top: 20 },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] }
  });

  if (config.options?.includeSummary) {
    const pageHeight = doc.internal.pageSize.height;
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      14,
      pageHeight - 20
    );
    doc.text(`Total Records: ${data.length}`, 14, pageHeight - 15);
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
};

/**
 * Exports data to the specified format
 */
export const exportData = async <T>(
  data: T[],
  fieldMappings: Record<string, string>,
  config: ExportConfig,
  serviceConfig: Partial<ExportServiceConfig> = {}
): Promise<ExportResult> => {
  const startTime = Date.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...serviceConfig };

  try {
    // Check if we should use server-side export
    if (
      finalConfig.useServerSide &&
      finalConfig.apiEndpoint &&
      data.length > (finalConfig.clientSideLimit || 0)
    ) {
      const response = await fetch(finalConfig.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, config })
      });

      if (!response.ok) {
        throw new Error('Server-side export failed');
      }

      const blob = await response.blob();
      saveAs(blob, config.fileName || `export-${Date.now()}.${config.format}`);

      return {
        fileName: config.fileName || `export-${Date.now()}.${config.format}`,
        format: config.format,
        recordCount: data.length,
        timestamp: new Date().toISOString(),
        fileSize: blob.size,
        wasFiltered: Boolean(config.filteredDataOnly),
        duration: Date.now() - startTime
      };
    }

    // Client-side export
    let content: string | Uint8Array;
    let blob: Blob;
    const mimeTypes = {
      csv: 'text/csv;charset=utf-8;',
      json: 'application/json;charset=utf-8;',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf'
    };

    switch (config.format) {
      case 'csv':
        content = toCSV(data, fieldMappings, config);
        blob = new Blob([content], { type: mimeTypes.csv });
        break;

      case 'json':
        content = JSON.stringify(data, null, 2);
        blob = new Blob([content], { type: mimeTypes.json });
        break;

      case 'xlsx':
        content = toXLSX(data, fieldMappings, config);
        blob = new Blob([content], { type: mimeTypes.xlsx });
        break;

      case 'pdf':
        content = toPDF(data, fieldMappings, config);
        blob = new Blob([content], { type: mimeTypes.pdf });
        break;

      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }

    const fileName = config.fileName || `export-${Date.now()}.${config.format}`;
    saveAs(blob, fileName);

    return {
      fileName,
      format: config.format,
      recordCount: data.length,
      timestamp: new Date().toISOString(),
      fileSize: blob.size,
      wasFiltered: Boolean(config.filteredDataOnly),
      duration: Date.now() - startTime
    };
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};
