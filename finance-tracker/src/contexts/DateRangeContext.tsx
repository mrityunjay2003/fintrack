import { createContext, useContext, useState, ReactNode } from "react";
import { addDays, startOfMonth, endOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";

interface DateRangeContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useGlobalDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) throw new Error("useGlobalDateRange must be used within DateRangeProvider");
  return context;
}
