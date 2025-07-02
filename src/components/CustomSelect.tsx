import React from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  error = false,
}) => {
  const baseClassName = `flex items-center justify-between w-full bg-gray-700 border px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 ${
    disabled
      ? "opacity-50 cursor-not-allowed border-gray-600"
      : error
      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
      : "border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
  }`;

  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger className={`${baseClassName} ${className}`}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="text-gray-400">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="overflow-hidden bg-gray-700 rounded-xl border border-gray-600 shadow-lg z-50">
          <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-gray-700 text-gray-400 cursor-default">
            <ChevronUpIcon />
          </Select.ScrollUpButton>
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="flex items-center px-4 py-3 text-white rounded-lg cursor-pointer hover:bg-gray-600 focus:bg-gray-600 focus:outline-none data-[highlighted]:bg-gray-600"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-gray-700 text-gray-400 cursor-default">
            <ChevronDownIcon />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default CustomSelect;
