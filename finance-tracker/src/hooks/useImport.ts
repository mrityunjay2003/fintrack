import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ParsedCSV {
  batchId: string;
  headers: string[];
  rows: any[];
  duplicates: number[];
}

export function useImportMutations() {
  const queryClient = useQueryClient();

  const parseCsv = useMutation({
    mutationFn: async (payload: { file: File; accountId: string }): Promise<ParsedCSV> => {
      // 1. Upload the file
      const formData = new FormData();
      formData.append("file", payload.file);
      formData.append("account_id", payload.accountId);
      
      const uploadRes = await api.post("/import/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const { batchId, headers, savedMapping } = uploadRes.data;

      // 2. Fetch the preview using saved mapping (or defaults so the UI has something to show)
      const mapping = savedMapping || {
        dateCol: headers[0], detailsCol: headers[1],
        debitCol: headers.length > 2 ? headers[2] : null,
        creditCol: headers.length > 3 ? headers[3] : null,
        balanceCol: headers.length > 4 ? headers[4] : null,
        dateFormat: "%Y-%m-%d"
      };

      const previewRes = await api.post(`/import/${batchId}/preview`, mapping);
      
      // 3. Map backend response back to the frontend's expected format
// 3. Map backend response back to the frontend's expected format
      const duplicates: number[] = [];
      const rows = previewRes.data.rows.map((r: any) => {
        if (r.isDuplicate) duplicates.push(r.rowIndex);
        
        // Dynamically reconstruct the columns the UI table is expecting
        const reconstructedRow: any = { ...r };
        
        reconstructedRow[mapping.dateCol] = r.date;
        reconstructedRow[mapping.detailsCol] = r.rawDetails;
        
        if (mapping.debitCol) {
          reconstructedRow[mapping.debitCol] = r.amount < 0 ? (Math.abs(r.amount) / 100).toFixed(2) : "";
        }
        if (mapping.creditCol) {
          reconstructedRow[mapping.creditCol] = r.amount > 0 ? (r.amount / 100).toFixed(2) : "";
        }
        if (mapping.balanceCol && r.statementBalance !== null) {
          reconstructedRow[mapping.balanceCol] = (r.statementBalance / 100).toFixed(2);
        }

        return reconstructedRow;
      });

      return { batchId, headers, rows, duplicates };
    }
  });

  const commitImport = useMutation({
    mutationFn: async (payload: { batchId: string; rows: any[] }) => {
      // The backend expects an array of the row indexes the user decided to keep
      const includedRowIndexes = payload.rows.map(r => r.rowIndex);
      const { data } = await api.post(`/import/${payload.batchId}/commit`, {
        includedRowIndexes: includedRowIndexes
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    }
  });

  return { parseCsv, commitImport };
}