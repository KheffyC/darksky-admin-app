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
  const baseClassName = `flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 font-medium text-ink transition-all duration-200 ${
    disabled
      ? "cursor-not-allowed border-line bg-canvas text-muted opacity-50"
      : error
      ? "border-behind-line focus:border-behind-line focus:ring-2 focus:ring-behind-line"
      : "border-line focus:border-ink focus:ring-2 focus:ring-ink/10/30"
  }`;
  const contentBaseClassName = "z-50 overflow-hidden rounded-xl border border-line bg-white";
  const itemBaseClassName = "flex cursor-pointer items-center rounded-lg px-4 py-3 text-ink hover:bg-wash focus:bg-wash focus:outline-none data-[highlighted]:bg-wash";

  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger className={`${baseClassName} ${className}`}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className={`text-muted ${iconClassName}`}>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className={`${contentBaseClassName} ${contentClassName}`}>
          <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-white text-muted">
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
          <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-white text-muted">
            <ChevronDownIcon />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default CustomSelect;
