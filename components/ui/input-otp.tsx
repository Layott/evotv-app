import * as React from "react";

import { Stub } from "@/components/ui/_stub";

const InputOTP: React.FC<{ children?: React.ReactNode; className?: string; maxLength?: number; value?: string; onChange?: (v: string) => void }> = ({
  children,
}) => <Stub name="InputOTP">{children}</Stub>;
const InputOTPGroup: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children }) => (
  <>{children}</>
);
const InputOTPSlot: React.FC<{ index: number; className?: string }> = () => (
  <Stub name="InputOTPSlot" />
);
const InputOTPSeparator: React.FC = () => null;

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
