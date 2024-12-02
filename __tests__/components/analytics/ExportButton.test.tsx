import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ExportButton from '@/components/analytics/ExportButton';
import { ExportFormat } from '@/components/analytics/types';
import { exportData } from '@/components/analytics/utils/exportService';

// Mock exportService
vi.mock('@/components/analytics/utils/exportService', () => ({
  exportData: vi.fn()
}));

// Mock data
const mockData = [
  {
    id: '1',
    name: 'Test Item 1',
    value: 100
  },
  {
    id: '2',
    name: 'Test Item 2',
    value: 200
  }
];

const mockFieldMappings = {
  id: 'ID',
  name: 'Name',
  value: 'Value'
};

// Mock Dialog components
vi.mock('@/components/ui/Dialog', () => ({
  Dialog: ({ children }: any) => (
    <div data-testid="dialog-root">{children}</div>
  ),
  DialogTrigger: ({ children }: any) => children,
  DialogContent: ({ children }: any) => (
    <div
      role="dialog"
      aria-label="Export Data"
      aria-modal="true"
      data-testid="dialog-content"
    >
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => (
    <div className="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <h2 className="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: any) => (
    <p className="dialog-description">{children}</p>
  ),
  DialogFooter: ({ children }: any) => (
    <div className="dialog-footer">{children}</div>
  )
}));

// Mock Button component
vi.mock('@/components/ui/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

// Mock Select component
vi.mock('@/components/ui/Select', () => {
  const SelectRoot = ({ value, onValueChange, children }: any) => (
    <div className="select-wrapper">
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        data-testid="select"
        aria-label="Select format"
      >
        {children}
      </select>
    </div>
  );

  return {
    Select: SelectRoot,
    SelectTrigger: ({ children }: any) => children,
    SelectValue: ({ placeholder }: any) => (
      <option value="" disabled selected>
        {placeholder}
      </option>
    ),
    SelectContent: ({ children }: any) => children,
    SelectItem: ({ value, children }: any) => (
      <option value={value}>{children}</option>
    )
  };
});

// Mock Input component
vi.mock('@/components/ui/Input', () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder, id, ...props }: any) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      id={id}
      {...props}
    />
  )
}));

// Mock Checkbox component
vi.mock('@/components/ui/Checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange, children }: any) => (
    <div className="checkbox-wrapper">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
      />
      <label htmlFor={id}>{children}</label>
    </div>
  )
}));

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test rendering
  describe('Rendering', () => {
    it('should render the export button', () => {
      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
        />
      );

      expect(
        screen.getByRole('button', { name: 'Export Data' })
      ).toBeInTheDocument();
    });

    it('should open the export dialog when clicked', () => {
      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));

      expect(screen.getByText('Export Format')).toBeInTheDocument();
      expect(screen.getByText('File Name')).toBeInTheDocument();
      expect(screen.getByText('Options')).toBeInTheDocument();
    });
  });

  // Test format selection
  describe('Format Selection', () => {
    it('should allow changing export format', async () => {
      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));

      const formatSelect = screen.getByLabelText('Select format');
      fireEvent.click(formatSelect);

      const xlsxOption = screen.getByText('Excel (XLSX)');
      fireEvent.click(xlsxOption);

      // PDF-specific option should not be visible for XLSX
      expect(
        screen.queryByText('Include charts (PDF only)')
      ).not.toBeInTheDocument();
    });

    it('should show PDF-specific options when PDF format is selected', () => {
      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));

      const formatSelect = screen.getByLabelText('Select format');
      fireEvent.change(formatSelect, { target: { value: 'pdf' } });

      expect(
        screen.getByLabelText('Include charts (PDF only)')
      ).toBeInTheDocument();
    });
  });

  // Test export options
  describe('Export Options', () => {
    it('should allow toggling export options', () => {
      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));

      const filteredDataCheckbox = screen.getByText(
        'Export filtered data only'
      );
      const includeMetadataCheckbox = screen.getByText('Include metadata');
      const includeHeadersCheckbox = screen.getByText('Include headers');
      const includeSummaryCheckbox = screen.getByText('Include summary');

      fireEvent.click(filteredDataCheckbox);
      fireEvent.click(includeMetadataCheckbox);
      fireEvent.click(includeHeadersCheckbox);
      fireEvent.click(includeSummaryCheckbox);

      expect(filteredDataCheckbox).not.toBeChecked();
      expect(includeMetadataCheckbox).not.toBeChecked();
      expect(includeHeadersCheckbox).not.toBeChecked();
      expect(includeSummaryCheckbox).not.toBeChecked();
    });

    it('should allow changing file name', () => {
      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));

      const fileNameInput = screen.getByPlaceholderText('Enter file name');
      fireEvent.change(fileNameInput, { target: { value: 'new-export-name' } });

      expect(fileNameInput).toHaveValue('new-export-name');
    });
  });

  // Test export functionality
  describe('Export Functionality', () => {
    it('should call export service with correct parameters', async () => {
      const handleExportComplete = vi.fn();
      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
          onExportComplete={handleExportComplete}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));

      // Select format
      const formatSelect = screen.getByLabelText('Select format');
      fireEvent.change(formatSelect, { target: { value: 'xlsx' } });

      // Click export
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));

      expect(exportData).toHaveBeenCalledWith(
        mockData,
        mockFieldMappings,
        expect.objectContaining({
          format: 'xlsx',
          fileName: 'test-export.xlsx',
          includeMetadata: true,
          filteredDataOnly: true,
          options: expect.objectContaining({
            includeHeaders: true,
            includeSummary: true
          })
        })
      );

      await vi.waitFor(() => {
        expect(handleExportComplete).toHaveBeenCalled();
      });
    });

    it('should handle export errors', async () => {
      const mockError = new Error('Export failed');
      (exportData as jest.Mock).mockRejectedValueOnce(mockError);
      const handleExportError = vi.fn();

      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
          onExportError={handleExportError}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));

      await vi.waitFor(() => {
        expect(handleExportError).toHaveBeenCalledWith(mockError);
      });
      expect(handleExportError.mock.calls[0][0].message).toBe('Export failed');
    });

    it('should disable export button while exporting', async () => {
      const handleExport = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
          onExport={handleExport}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      expect(exportButton).toBeDisabled();
    });
  });

  // Test accessibility
  describe('Accessibility', () => {
    it('should have accessible dialog', () => {
      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Export Data');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible form controls', () => {
      render(
        <ExportButton
          data={mockData}
          fieldMappings={mockFieldMappings}
          defaultFileName="test-export"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Data' }));

      expect(screen.getByLabelText('Select format')).toBeInTheDocument();
      expect(screen.getByLabelText('File Name')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Export filtered data only')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Include metadata')).toBeInTheDocument();
      expect(screen.getByLabelText('Include headers')).toBeInTheDocument();
      expect(screen.getByLabelText('Include summary')).toBeInTheDocument();
    });
  });
});
