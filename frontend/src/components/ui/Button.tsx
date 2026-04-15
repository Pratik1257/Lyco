import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost' | 'ghost-cyan' | 'ghost-red' | 'unstyled';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'unstyled';
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading, 
  disabled, 
  ...props 
}: ButtonProps) {
  
  const baseClasses = "inline-flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none";
  
  const variants = {
    primary: "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white shadow-md shadow-cyan-200",
    danger: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-200",
    secondary: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm",
    ghost: "bg-transparent hover:bg-white/10 text-cyan-100 hover:text-white", // Used in header/modals
    "ghost-cyan": "text-cyan-600 bg-cyan-50 hover:bg-cyan-100",
    "ghost-red": "text-red-500 bg-red-50 hover:bg-red-100",
    unstyled: ""
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm font-semibold rounded-xl",
    md: "px-5 py-2.5 text-sm font-bold rounded-xl",
    lg: "px-4 py-3 text-sm font-bold rounded-2xl", // the large full width buttons
    icon: "p-1.5 rounded-lg",
    unstyled: ""
  };

  const finalClasses = [
    variant !== 'unstyled' && size !== 'unstyled' ? baseClasses : '',
    variants[variant],
    sizes[size],
    className
  ].filter(Boolean).join(" ");

  return (
    <button 
      className={finalClasses} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </>
      ) : children}
    </button>
  );
}
