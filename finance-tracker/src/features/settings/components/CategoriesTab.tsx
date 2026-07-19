import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Edit2, Trash2 } from "lucide-react";
import type { Category } from "@/types";
import { useSettingsMutations } from "@/hooks/useSettings";

interface CategoryFormState {
  name: string;
  color: string;
}

const emptyForm: CategoryFormState = {
  name: "",
  color: "#6366f1",
};

export function CategoriesTab({ categories, isLoading }: { categories?: Category[]; isLoading: boolean }) {
  const { addCategory, updateCategory, deleteCategory } = useSettingsMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      color: cat.color ?? emptyForm.color,
    });
    setDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      color: form.color,
    };

    setIsSaving(true);
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...payload });
      } else {
        await addCategory.mutateAsync(payload);
      }
      setDialogOpen(false);
      setEditingCategory(null);
      setForm(emptyForm);
    } catch (error) {
      console.error("Failed to save category", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCategory.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete category", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Categories</h3>
          <p className="text-sm text-muted-foreground">Customize how your transactions are grouped.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit category" : "Add category"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Groceries"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="category-color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="h-9 w-12 rounded-md border border-border/50 bg-transparent p-1 cursor-pointer"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    placeholder="#6366f1"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              {form.name.trim() && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Preview:</span>
                  <CategoryChip category={{ id: "preview", name: form.name, color: form.color } as Category} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory} disabled={isSaving || !form.name.trim()}>
                {isSaving ? "Saving..." : editingCategory ? "Save changes" : "Add category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Color Tag</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              categories?.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell><CategoryChip category={cat} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono text-xs">{cat.color}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(cat)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

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
                            <AlertDialogTitle>Delete {cat.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Transactions using this category will need to be recategorized. This action can't be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(cat.id)}
                              disabled={deletingId === cat.id}
                            >
                              {deletingId === cat.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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