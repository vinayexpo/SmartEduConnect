import { useRef, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export interface TemplateColumn {
  /** Header text shown in the spreadsheet template. */
  header: string;
  /** API field name the column maps to. */
  key: string;
  /** Example value placed in the template's sample row. */
  sample: string;
  /** Appended to the header when true (e.g. "Full Name *"). */
  required?: boolean;
}

export interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

interface TemplateImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  templateFileName: string;
  sheetName?: string;
  columns: TemplateColumn[];
  /** POST endpoint accepting `{ rows: [...] }`, returning `{ imported, total, errors }`. */
  endpoint: string;
  onSuccess?: () => void;
}

/**
 * Generic spreadsheet import dialog: downloads a templated `.xlsx`,
 * parses the uploaded file, maps headers to API fields, posts rows,
 * and shows per-row errors without aborting the file.
 */
export default function TemplateImportDialog({
  open,
  onOpenChange,
  title,
  description,
  templateFileName,
  sheetName = 'Template',
  columns,
  endpoint,
  onSuccess,
}: TemplateImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<ImportRowError[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const headerOf = (col: TemplateColumn) => (col.required ? `${col.header} *` : col.header);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      columns.map(headerOf),
      columns.map((c) => c.sample),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    ws['!cols'] = columns.map(() => ({ wch: 22 }));
    XLSX.writeFile(wb, templateFileName.endsWith('.xlsx') ? templateFileName : `${templateFileName}.xlsx`);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setErrors([]);
    setImportedCount(0);
    setTotalCount(0);
    setShowResults(false);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rawRows.length === 0) {
        toast.error('Empty file — no data rows found.');
        setImporting(false);
        return;
      }

      const keyByHeader = new Map(columns.map((c) => [headerOf(c).toLowerCase(), c.key]));
      const plainByHeader = new Map(columns.map((c) => [c.header.toLowerCase(), c.key]));

      const rows = rawRows.map((raw) => {
        const mapped: Record<string, unknown> = {};
        for (const [header, value] of Object.entries(raw)) {
          const key = keyByHeader.get(header.trim().toLowerCase()) ?? plainByHeader.get(header.trim().toLowerCase());
          if (key && value !== '') mapped[key] = value;
        }
        return mapped;
      });

      const result = await apiClient.post<{ imported: number; total: number; errors: ImportRowError[] }>(
        endpoint,
        { rows },
      );

      setImportedCount(result.imported);
      setTotalCount(result.total);
      setErrors(result.errors || []);
      setShowResults(true);

      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} of ${result.total} rows.`);
        onSuccess?.();
      } else {
        toast.error('No rows imported — fix the errors and retry.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description ?? 'Download the template, fill one row per record, then upload the file.'}
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-4">
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={importing} className="w-full">
              {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {importing ? 'Importing...' : 'Upload Filled File (.xlsx, .csv)'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Columns marked * are required. Unknown columns are ignored. Rows with errors are
              skipped and listed after import — valid rows are still saved.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg flex items-center gap-3 ${errors.length === 0 ? 'bg-primary/10' : 'bg-amber-500/10'}`}>
              {errors.length === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              <p className="font-medium">
                Imported {importedCount} of {totalCount} rows
                {errors.length > 0 && ` — ${errors.length} row(s) skipped`}
              </p>
            </div>
            {errors.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors.map((err, i) => (
                      <TableRow key={i}>
                        <TableCell>{err.row}</TableCell>
                        <TableCell>{err.field}</TableCell>
                        <TableCell>{err.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowResults(false);
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
