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
  contentClassName?: string;
  itemClassName?: string;
  iconClassName?: string;
  error?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  contentClassName = "",
  itemClassName = "",
  iconClassName = "",
  error = false,
}) => {
  const baseClassName = `flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 font-medium text-[#2C3E50] transition-all duration-200 ${
    disabled
      ? "cursor-not-allowed border-[#d6dde5] bg-[#eef3f8] text-[#788896] opacity-50"
      : error
      ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
      : "border-[#d6dde5] focus:border-[#f38d68] focus:ring-2 focus:ring-[#f38d68]/30"
  }`;
  const contentBaseClassName = "z-50 overflow-hidden rounded-xl border border-[#d6dde5] bg-white";
  const itemBaseClassName = "flex cursor-pointer items-center rounded-lg px-4 py-3 text-[#2C3E50] hover:bg-[#f7f9fb] focus:bg-[#f7f9fb] focus:outline-none data-[highlighted]:bg-[#f7f9fb]";

  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger className={`${baseClassName} ${className}`}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className={`text-[#788896] ${iconClassName}`}>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className={`${contentBaseClassName} ${contentClassName}`}>
          <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-white text-[#788896]">
            <ChevronUpIcon />
          </Select.ScrollUpButton>
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={`${itemBaseClassName} ${itemClassName}`}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-white text-[#788896]">
            <ChevronDownIcon />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default CustomSelect;
