import { useState } from "react";
import { UploadStep } from "./components/UploadStep";
import { PreviewStep } from "./components/PreviewStep";
import { useImportMutations } from "@/hooks/useImport";
import type { ParsedCSV } from "@/hooks/useImport";
import { useNavigate } from "react-router-dom";

export function ImportView() {
  const [step, setStep] = useState<1 | 2>(1);
  const [accountId, setAccountId] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  
  const { parseCsv, commitImport } = useImportMutations();
  const navigate = useNavigate();

  const handleProcessFile = async (file: File, selectedAccountId: string) => {
    setAccountId(selectedAccountId);
    try {
      const data = await parseCsv.mutateAsync({ file, accountId: selectedAccountId });
      setParsedData(data);
      setStep(2);
    } catch (error) {
      console.error("Failed to parse CSV", error);
    }
  };

const handleConfirmImport = async (selectedRows: Record<string, string>[], mapping: Record<string, string>) => {
    try {
      if (!parsedData?.batchId) return;
      
      await commitImport.mutateAsync({ 
        batchId: parsedData.batchId, 
        rows: selectedRows 
      });
      
      navigate("/transactions");
    } catch (error) {
      console.error("Failed to import", error);
    }
  };

  const reset = () => {
    setStep(1);
    setParsedData(null);
    setAccountId("");
  };

  return (
    <div className="pb-20 md:pb-0">
      {step === 1 && (
        <UploadStep 
          onProcess={handleProcessFile} 
          isProcessing={parseCsv.isPending} 
        />
      )}

      {step === 2 && parsedData && (
        <PreviewStep 
          data={parsedData} 
          onConfirm={handleConfirmImport} 
          onCancel={reset}
          isImporting={commitImport.isPending}
        />
      )}
    </div>
  );
}