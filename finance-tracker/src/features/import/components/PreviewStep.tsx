import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ParsedCSV } from "@/hooks/useImport";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

interface PreviewStepProps {
  data: ParsedCSV;
  onConfirm: (selectedRows: Record<string, string>[], mapping: Record<string, string>) => void;
  onCancel: () => void;
  isImporting: boolean;
}

const REQUIRED_FIELDS = [
  { key: "date", label: "Date" },
  { key: "details", label: "Details / Label" },
  { key: "debit", label: "Debit (Expense)" },
  { key: "credit", label: "Credit (Income)" },
  { key: "balance", label: "Balance" },
];

export function PreviewStep({ data, onConfirm, onCancel, isImporting }: PreviewStepProps) {
  // mapping: targetFieldKey -> sourceHeaderName
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // Set all rows as selected by default, except duplicates
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    new Set(data.rows.map((_, i) => i).filter(i => !data.duplicates.includes(i)))
  );

  const toggleRow = (index: number) => {
    const newSet = new Set(selectedIndexes);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndexes(newSet);
  };

  const handleMappingChange = (targetField: string, sourceHeader: string) => {
    setMapping(prev => ({ ...prev, [targetField]: sourceHeader }));
  };

  const isMappingComplete = mapping["date"] && mapping["details"] && (mapping["debit"] || mapping["credit"]);

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Map & Preview</h2>
          <p className="text-sm text-muted-foreground">Match your CSV columns to standard fields.</p>
        </div>
      </div>

      {/* Mapping Bar */}
      <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4">
        {REQUIRED_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{field.label}</label>
            <Select value={mapping[field.key] || ""} onValueChange={(val) => handleMappingChange(field.key, val)}>
              <SelectTrigger className="h-8 text-xs bg-muted/30"><SelectValue placeholder="Ignore" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-muted-foreground italic">Ignore</SelectItem>
                {data.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Preview Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[500px]">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox 
                    checked={selectedIndexes.size === data.rows.length} 
                    onCheckedChange={(c) => c ? setSelectedIndexes(new Set(data.rows.map((_, i) => i))) : setSelectedIndexes(new Set())} 
                  />
                </TableHead>
                <TableHead className="w-24">Status</TableHead>
                {data.headers.map((header) => {
                  const mappedTo = Object.entries(mapping).find(([_, src]) => src === header)?.[0];
                  return (
                    <TableHead key={header} className="whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">{header}</span>
                        {mappedTo && <span className="text-[10px] uppercase tracking-wider text-primary font-medium border border-primary/20 bg-primary/10 px-1.5 py-0.5 rounded-sm w-max">{mappedTo}</span>}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, index) => {
                const isSelected = selectedIndexes.has(index);
                const isDuplicate = data.duplicates.includes(index);

                return (
                  <TableRow key={index} className={!isSelected ? 'opacity-50 bg-muted/20' : ''}>
                    <TableCell className="text-center">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(index)} />
                    </TableCell>
                    <TableCell>
                      {isDuplicate ? (
                        <Badge variant="outline" className="text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-950/30 gap-1"><AlertCircle className="w-3 h-3" /> Dup</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 gap-1"><CheckCircle2 className="w-3 h-3" /> New</Badge>
                      )}
                    </TableCell>
                    {data.headers.map(header => (
                      <TableCell key={header} className="text-sm max-w-[200px] truncate">{row[header]}</TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirm Bar */}
      <div className="bg-background border-t border-border/50 p-4 fixed bottom-0 md:bottom-auto md:relative md:rounded-xl md:border md:shadow-sm left-0 right-0 z-50 flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold">{selectedIndexes.size}</span> rows selected
          <span className="text-muted-foreground"> ({data.rows.length - selectedIndexes.size} skipped)</span>
        </div>
        <Button 
          disabled={!isMappingComplete || selectedIndexes.size === 0 || isImporting}
          onClick={() => {
            const finalRows = data.rows.filter((_, i) => selectedIndexes.has(i));
            onConfirm(finalRows, mapping);
          }}
        >
          {isImporting ? "Importing..." : `Import ${selectedIndexes.size} Transactions`}
        </Button>
      </div>
    </div>
  );
}