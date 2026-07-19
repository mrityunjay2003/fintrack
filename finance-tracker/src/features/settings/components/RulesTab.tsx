import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CategoryChip } from "@/components/shared/CategoryChip";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/types";
import type { Rule } from "@/hooks/useSettings";
import { useSettingsMutations } from "@/hooks/useSettings";

type RuleWithCategory = Rule & { category: Category };

// Adjust these to whatever fields your backend actually matches transactions on.
const MATCH_FIELDS = [
  { value: "description", label: "Description" },
  { value: "merchant", label: "Merchant" },
];

interface RuleFormState {
  matchField: string;
  pattern: string;
  categoryId: string;
}

const emptyForm: RuleFormState = {
  matchField: "description",
  pattern: "",
  categoryId: "",
};

export function RulesTab({
  rules,
  categories,
  isLoading,
}: {
  rules?: RuleWithCategory[];
  categories?: Category[];
  isLoading: boolean;
}) {
  const { addRule, updateRule, deleteRule } = useSettingsMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<RuleFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddDialog = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!form.pattern.trim() || !form.categoryId) return;

    setIsSaving(true);
    try {
      await addRule.mutateAsync({
        matchField: form.matchField,
        pattern: form.pattern.trim(),
        categoryId: form.categoryId,
      });
      setDialogOpen(false);
      setForm(emptyForm);
    } catch (error) {
      console.error("Failed to save rule", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteRule.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete rule", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Automation Rules</h3>
          <p className="text-sm text-muted-foreground">Automatically categorize new imports based on keywords.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" /> Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add rule</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="rule-field">If</Label>
                <Select value={form.matchField} onValueChange={(v) => setForm((f) => ({ ...f, matchField: v }))}>
                  <SelectTrigger id="rule-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-pattern">Contains</Label>
                <Input
                  id="rule-pattern"
                  value={form.pattern}
                  onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
                  placeholder="e.g. STARBUCKS"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-category">Assign category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger id="rule-category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveRule} disabled={isSaving || !form.pattern.trim() || !form.categoryId}>
                {isSaving ? "Saving..." : "Add rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>If label contains...</TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Assign Category</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground/30" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : (
              rules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium text-sm">
                    <span className="bg-muted/50 border border-border/50 px-2 py-1 rounded text-foreground font-mono text-xs">
                      "{rule.pattern}"
                    </span>
                  </TableCell>
                  <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell><CategoryChip category={rule.category} /></TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this rule?</AlertDialogTitle>
                          <AlertDialogDescription>
                            New imports matching "{rule.pattern}" will no longer be auto-categorized as {rule.category?.name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRule(rule.id)}
                            disabled={deletingId === rule.id}
                          >
                            {deletingId === rule.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}