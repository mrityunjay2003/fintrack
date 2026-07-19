import { useState, useRef } from "react";
import { UploadCloud, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useSettingsData } from "@/hooks/useSettings";

interface UploadStepProps {
  onProcess: (file: File, accountId: string) => void;
  isProcessing: boolean;
}

export function UploadStep({ onProcess, isProcessing }: UploadStepProps) {
  const { accountsQuery } = useSettingsData();
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) setFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 mt-8 animate-in fade-in-50 duration-500">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Import Transactions</h2>
        <p className="text-sm text-muted-foreground">Upload your bank statement CSV to categorize and import.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">1. Select Account</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Which account is this file for?" />
              </SelectTrigger>
              <SelectContent>
                {accountsQuery.data?.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.bankName})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">2. Upload File</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} />
              
              {file ? (
                <div className="flex items-center gap-3 text-sm">
                  <FileIcon className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="ml-4">Remove</Button>
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Drag & drop your CSV here</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">or click to browse from your computer</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button 
            className="w-full" 
            disabled={!file || !accountId || isProcessing}
            onClick={() => file && accountId && onProcess(file, accountId)}
          >
            {isProcessing ? "Processing..." : "Continue to Mapping"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}