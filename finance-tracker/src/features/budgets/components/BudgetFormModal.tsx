import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudgetMutations } from "@/hooks/useBudgets";
import { useSettingsData } from "@/hooks/useSettings";
import type { Budget } from "@/types";

const formSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(1, "Budget limit must be greater than 0"),
});

type FormValues = z.infer<typeof formSchema>;

interface BudgetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetToEdit?: Budget | null; // Pass a budget to edit, or null to create
}

export function BudgetFormModal({ open, onOpenChange, budgetToEdit }: BudgetFormModalProps) {
  const { saveBudget } = useBudgetMutations();
  const { categoriesQuery } = useSettingsData();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      amount: undefined,
    }
  });

  // Populate form if editing
  useEffect(() => {
    if (budgetToEdit && open) {
      form.reset({
        categoryId: budgetToEdit.categoryId,
        amount: budgetToEdit.amount / 100, // minor units to decimal
      });
    } else if (open) {
      form.reset({ categoryId: '', amount: undefined });
    }
  }, [budgetToEdit, open, form]);

  const onSubmit = (data: FormValues) => {
    saveBudget.mutate({
      categoryId: data.categoryId,
      amount: Math.round(data.amount * 100), // convert back to minor units
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{budgetToEdit ? "Edit Budget" : "Create Budget"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!budgetToEdit}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categoriesQuery.data?.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${c.color}`} />
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Limit</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saveBudget.isPending}>
                {saveBudget.isPending ? "Saving..." : "Save Budget"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}