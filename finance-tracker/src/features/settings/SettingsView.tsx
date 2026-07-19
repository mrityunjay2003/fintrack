import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsTab } from "./components/AccountsTab";
import { CategoriesTab } from "./components/CategoriesTab";
import { RulesTab } from "./components/RulesTab";
import { useSettingsData } from "@/hooks/useSettings";

export function SettingsView() {
  const { accountsQuery, categoriesQuery, rulesQuery } = useSettingsData();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your vault preferences and underlying data.</p>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
          <TabsTrigger 
            value="accounts" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none"
          >
            Accounts
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none"
          >
            Categories
          </TabsTrigger>
          <TabsTrigger 
            value="rules" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none"
          >
            Rules
          </TabsTrigger>
        </TabsList>
        
        <div className="pt-6">
          <TabsContent value="accounts" className="mt-0 outline-none">
            <AccountsTab accounts={accountsQuery.data} isLoading={accountsQuery.isLoading} />
          </TabsContent>
          <TabsContent value="categories" className="mt-0 outline-none">
            <CategoriesTab categories={categoriesQuery.data} isLoading={categoriesQuery.isLoading} />
          </TabsContent>
          <TabsContent value="rules" className="mt-0 outline-none">
            <RulesTab rules={rulesQuery.data} isLoading={rulesQuery.isLoading} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}