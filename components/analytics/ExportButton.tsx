import { useState } from 'react';
import Button from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/Dialog';
import { Checkbox } from '@/components/ui/Checkbox';
import Input from '@/components/ui/Input';
import { exportData } from './utils/exportService';
import type { ExportButtonProps, ExportFormat, ExportConfig } from './types';

/**
 * ExportButton Component
 *
 * A reusable button component that provides data export functionality
 * with configurable options for format and content.
 */
const ExportButton = <T,>({
  data,
  currentFilters,
  fieldMappings,
  defaultFileName,
  onExportStart,
  onExportComplete,
  onExportError,
  variant = 'slim',
  className
}: ExportButtonProps<T>) => {
  // State for export configuration
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [fileName, setFileName] = useState(defaultFileName);
  const [config, setConfig] = useState<Partial<ExportConfig>>({
    includeMetadata: true,
    filteredDataOnly: true,
    options: {
      includeHeaders: true,
      includeCharts: false,
      includeSummary: true,
      dateFormat: 'yyyy-MM-dd HH:mm:ss',
      numberFormat: '0.00'
    }
  });

  // Handle export initiation
  const handleExport = async () => {
    try {
      setIsExporting(true);
      onExportStart?.();

      const exportConfig: ExportConfig = {
        format: exportFormat,
        fileName: `${fileName}.${exportFormat}`,
        ...config
      };

      // If filtered data only is selected, filter the data
      const dataToExport =
        config.filteredDataOnly && currentFilters
          ? data.filter((item) => {
              // Apply all current filters
              return Object.entries(currentFilters).every(([key, value]) => {
                if (!value) return true;
                const itemValue = item[key as keyof T];
                return itemValue === value;
              });
            })
          : data;

      const result = await exportData(
        dataToExport,
        fieldMappings,
        exportConfig
      );

      onExportComplete?.();
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setFileName(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant as 'slim' | 'flat'}
          className={className}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export Data'}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Configure your export settings below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select
              value={exportFormat}
              onValueChange={(value: ExportFormat) => setExportFormat(value)}
            >
              <SelectTrigger aria-label="Select format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Name */}
          <div className="space-y-2">
            <label htmlFor="file-name" className="text-sm font-medium">
              File Name
            </label>
            <Input
              id="file-name"
              value={fileName}
              onChange={handleInputChange}
              placeholder="Enter file name"
            />
          </div>

          {/* Export Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Options</label>
            <div className="space-y-2">
              <Checkbox
                id="filtered-data"
                checked={config.filteredDataOnly}
                onCheckedChange={(checked: boolean) =>
                  setConfig((prev) => ({
                    ...prev,
                    filteredDataOnly: checked
                  }))
                }
              >
                Export filtered data only
              </Checkbox>
              <Checkbox
                id="include-metadata"
                checked={config.includeMetadata}
                onCheckedChange={(checked: boolean) =>
                  setConfig((prev) => ({
                    ...prev,
                    includeMetadata: checked
                  }))
                }
              >
                Include metadata
              </Checkbox>
              <Checkbox
                id="include-headers"
                checked={config.options?.includeHeaders}
                onCheckedChange={(checked: boolean) =>
                  setConfig((prev) => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      includeHeaders: checked
                    }
                  }))
                }
              >
                Include headers
              </Checkbox>
              <Checkbox
                id="include-summary"
                checked={config.options?.includeSummary}
                onCheckedChange={(checked: boolean) =>
                  setConfig((prev) => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      includeSummary: checked
                    }
                  }))
                }
              >
                Include summary
              </Checkbox>
              {exportFormat === 'pdf' && (
                <Checkbox
                  id="include-charts"
                  checked={config.options?.includeCharts}
                  onCheckedChange={(checked: boolean) =>
                    setConfig((prev) => ({
                      ...prev,
                      options: {
                        ...prev.options,
                        includeCharts: checked
                      }
                    }))
                  }
                >
                  Include charts (PDF only)
                </Checkbox>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="flat"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            variant="slim"
            onClick={handleExport}
            disabled={isExporting || !fileName}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportButton;
