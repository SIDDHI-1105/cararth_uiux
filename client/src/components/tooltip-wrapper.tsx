import { ReactNode } from "react";
import { ContextualTooltip, getTooltipConfig } from "@/components/contextual-help";

interface TooltipWrapperProps {
  trigger: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component that automatically adds contextual help tooltips to elements
 * based on their data-testid or identifier
 */
export function TooltipWrapper({ trigger, children, className }: TooltipWrapperProps) {
  const config = getTooltipConfig(trigger);
  
  if (!config) {
    return <>{children}</>;
  }
  
  return (
    <ContextualTooltip config={config} className={className}>
      {children}
    </ContextualTooltip>
  );
}

/**
 * Higher-order component that wraps any component with contextual help tooltips
 */
export function withTooltip<T extends object>(
  Component: React.ComponentType<T>, 
  trigger: string
) {
  return function WrappedComponent(props: T) {
    return (
      <TooltipWrapper trigger={trigger}>
        <Component {...props} />
      </TooltipWrapper>
    );
  };
}