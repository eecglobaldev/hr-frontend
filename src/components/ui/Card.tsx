import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  /** Optional class for the title (e.g. text-blue-600) */
  titleClassName?: string;
  action?: ReactNode;
  /** Allow dropdowns/popovers inside the card to extend outside (uses overflow-visible + z-index) */
  overflowVisible?: boolean;
}

export default function Card({ children, className = '', title, titleClassName, action, overflowVisible }: CardProps) {
  return (
    <div className={`glass-card rounded-[24px] shadow-2xl  ${overflowVisible ? 'overflow-visible z-50 relative' : 'overflow-hidden'} ${className}`}>
      {(title || action) && (
        <div className="px-8 py-5 flex items-center justify-between border-b border-white/[0.05] bg-white/[0.01]">
          {title && (
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-widest ${titleClassName ?? 'text-white'}`}>{title}</h2>
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-8">{children}</div>
    </div>
  );
}

