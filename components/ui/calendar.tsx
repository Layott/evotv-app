import * as React from "react";

import { Stub } from "@/components/ui/_stub";

export interface CalendarProps {
  className?: string;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  mode?: "single" | "range" | "multiple";
}

export const Calendar: React.FC<CalendarProps> = (props) => (
  <Stub name="Calendar" className={props.className} />
);
