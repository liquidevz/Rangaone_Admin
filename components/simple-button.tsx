interface ButtonProps {
  children: React.ReactNode;
  size?: "default" | "lg";
  className?: string;
}

export function Button({ children, size = "default", className = "" }: ButtonProps) {
  const sizeClasses = size === "lg" ? "px-6 py-3 text-lg" : "px-4 py-2";
  return (
    <button className={`bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors flex items-center ${sizeClasses} ${className}`}>
      {children}
    </button>
  );
}