import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        month_caption: `${defaultClassNames.month_caption} text-sm font-medium`,
        button_previous: `${defaultClassNames.button_previous} h-7 w-7 bg-transparent border border-input rounded-md hover:bg-accent hover:text-accent-foreground`,
        button_next: `${defaultClassNames.button_next} h-7 w-7 bg-transparent border border-input rounded-md hover:bg-accent hover:text-accent-foreground`,
        weekday: `${defaultClassNames.weekday} text-muted-foreground text-[0.8rem] font-normal`,
        day_button: `${defaultClassNames.day_button} hover:bg-accent hover:text-accent-foreground rounded-md`,
        selected: `bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground`,
        today: `bg-accent text-accent-foreground font-semibold`,
        outside: `text-muted-foreground opacity-50`,
        disabled: `text-muted-foreground opacity-50`,
        range_middle: `bg-accent text-accent-foreground`,
        hidden: `invisible`,
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
