import * as React from "react";

import { Stub } from "@/components/ui/_stub";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<string, string>;
  }
>;

export interface ChartContainerProps {
  className?: string;
  config?: ChartConfig;
  children?: React.ReactNode;
  id?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  className,
  children,
}) => <Stub name="ChartContainer" className={className}>{children}</Stub>;

const ChartTooltip: React.FC = () => null;
const ChartTooltipContent: React.FC = () => null;
const ChartLegend: React.FC = () => null;
const ChartLegendContent: React.FC = () => null;
const ChartStyle: React.FC = () => null;

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
