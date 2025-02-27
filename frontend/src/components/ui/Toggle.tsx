import React from 'react';

interface ToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const Toggle: React.FC<ToggleProps> = ({ options, value, onChange, label }) => {
  return (
    <div className="flex items-center">
      {label && <span className="mr-2 text-sm text-gray-600">{label}</span>}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {options.map((option) => (
          <button
            key={option.value}
            className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
              value === option.value
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => onChange(option.value)}
            aria-label={option.label}
          >
            {option.icon && <span className="mr-1.5">{option.icon}</span>}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toggle;
