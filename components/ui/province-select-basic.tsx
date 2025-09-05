'use client';
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, CheckIcon } from "lucide-react";

interface ProvinceSelectBasicProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCustomValueChange?: (value: string) => void;
  className?: string;
  name?: string;
}

const PREDEFINED_PROVINCES = [
  "Punjab",
  "Sindh", 
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir"
];

export function ProvinceSelectBasic({ value, onChange, onCustomValueChange, className, name }: ProvinceSelectBasicProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Check if current value is a predefined province
  const isPredefinedProvince = PREDEFINED_PROVINCES.includes(value);
  const isCustomValue = value && !isPredefinedProvince;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'custom') {
      setShowCustomInput(true);
      setCustomValue(isCustomValue ? value : '');
    } else {
      setShowCustomInput(false);
      onChange(e);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim() && onCustomValueChange) {
      onCustomValueChange(customValue.trim());
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  const handleCustomCancel = () => {
    setShowCustomInput(false);
    setCustomValue('');
  };

  if (showCustomInput) {
    return (
      <div className="flex gap-2">
        <Input
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Enter custom province name"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCustomSubmit();
            } else if (e.key === 'Escape') {
              handleCustomCancel();
            }
          }}
          className="flex-1"
          autoFocus
        />
        <Button
          type="button"
          size="sm"
          onClick={handleCustomSubmit}
          disabled={!customValue.trim()}
        >
          <CheckIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCustomCancel}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <select
      value={isPredefinedProvince ? value : 'custom'}
      onChange={handleSelectChange}
      className={className}
      name={name}
    >
      <option value="">Select Province</option>
      {PREDEFINED_PROVINCES.map((province) => (
        <option key={province} value={province}>
          {province}
        </option>
      ))}
      <option value="custom">+ Custom Province</option>
      {isCustomValue && (
        <option value="custom">{value} (Current)</option>
      )}
    </select>
  );
}
