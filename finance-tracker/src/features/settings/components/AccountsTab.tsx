import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BankBadge } from "@/components/shared/BankBadge";
import { AmountText } from "@/components/shared/AmountText";
import { MoreHorizontal, Plus } from "lucide-react";
import type { Account } from "@/types";
import { useSettingsMutations } from "@/hooks/useSettings";

const ACCOUNT_TYPES = ["checking", "savings", "credit", "investment", "loan"] as const;

interface AccountFormState {
  name: string;
  bank: string;
  type: string;
  mask: string;
  // Balance is collected from the user in standard dollar format (e.g. 100.50)
  // and converted to integer cents right before it's sent to the backend.
  openingBalance: string;
}

const emptyForm: AccountFormState = {
  name: "",
  bank: "",
  type: "checking",
  mask: "",
  openingBalance: "",
};

export function AccountsTab({ accounts, isLoading }: { accounts?: Account[]; isLoading: boolean }) {
  const { addAccount, updateAccount, deleteAccount } = useSettingsMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (acc: Account) => {
    setEditingAccount(acc);
    setForm({
      name: acc.name,
      // @ts-expect-error - `bank` may not yet be declared on the Account type; add it there if missing
      bank: acc.bank ?? "",
      type: acc.type,
      mask: acc.mask ?? "",
      // balance comes back from the backend in cents; show it in dollars for editing
      openingBalance: (acc.balance / 100).toString(),
    });
    setDialogOpen(true);
  };

  const handleSaveAccount = async () => {
    const parsedBalance = parseFloat(form.openingBalance);
    if (!form.name.trim() || !form.bank.trim() || Number.isNaN(parsedBalance)) return;

    // UI collects balances in standard format (e.g. 100.50) — convert to
    // integer cents before sending to the backend.
    const payload = {
      name: form.name.trim(),
      bank: form.bank.trim(),
      type: form.type,
      mask: form.mask.trim(),
      openingBalance: Math.round(parsedBalance * 100),
    };

    setIsSaving(true);
    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({ id: editingAccount.id, ...payload });
      } else {
        await addAccount.mutateAsync(payload);
      }
      setDialogOpen(false);
      setEditingAccount(null);
      setForm(emptyForm);
    } catch (error) {
      console.error("Failed to save account", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAccount.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete account", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Bank Accounts</h3>
          <p className="text-sm text-muted-foreground">Manage your connected accounts and balances.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit account" : "Add account"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="account-name">Account name</Label>
                <Input
                  id="account-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Everyday Checking"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-bank">Bank</Label>
                <Input
                  id="account-bank"
                  value={form.bank}
                  onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
                  placeholder="e.g. Axis Bank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-type">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger id="account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-mask">Last 4 digits</Label>
                <Input
                  id="account-mask"
                  value={form.mask}
                  maxLength={4}
                  onChange={(e) => setForm((f) => ({ ...f, mask: e.target.value.replace(/\D/g, "") }))}
                  placeholder="1234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-balance">
                  {editingAccount ? "Current balance" : "Opening balance"}
                </Label>
                <Input
                  id="account-balance"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={form.openingBalance}
                  onChange={(e) => setForm((f) => ({ ...f, openingBalance: e.target.value }))}
                  placeholder="100.50"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveAccount} disabled={isSaving || !form.name.trim() || !form.bank.trim()}>
                {isSaving ? "Saving..." : editingAccount ? "Save changes" : "Add account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Current Balance</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : (
              accounts?.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">
                    {acc.name}
                    <span className="ml-2 text-xs text-muted-foreground font-normal border border-border/50 px-1.5 py-0.5 rounded">
                      ••• {acc.mask}
                    </span>
                  </TableCell>
                  <TableCell><BankBadge accountId={acc.id} className="h-6" /></TableCell>
                  <TableCell className="capitalize text-sm text-muted-foreground">{acc.type}</TableCell>
                  <TableCell className="text-right font-medium"><AmountText amount={acc.balance} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(acc)}>Edit</DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {acc.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the account and its transaction history. This action can't be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAccount(acc.id)}
                                disabled={deletingId === acc.id}
                              >
                                {deletingId === acc.id ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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