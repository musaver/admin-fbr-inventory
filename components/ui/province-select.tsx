'use client';
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, CheckIcon } from "lucide-react";

interface ProvinceSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
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

export function ProvinceSelect({ value, onValueChange, placeholder = "Select Province", className }: ProvinceSelectProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Check if current value is a predefined province
  const isPredefinedProvince = PREDEFINED_PROVINCES.includes(value);
  const isCustomValue = value && !isPredefinedProvince;

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'custom') {
      setShowCustomInput(true);
      setCustomValue(isCustomValue ? value : '');
    } else {
      setShowCustomInput(false);
      onValueChange(selectedValue);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onValueChange(customValue.trim());
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
      <div className={`flex gap-2 ${className}`}>
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
    <Select value={isPredefinedProvince ? value : 'custom'} onValueChange={handleSelectChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {isCustomValue ? value : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PREDEFINED_PROVINCES.map((province) => (
          <SelectItem key={province} value={province}>
            {province}
          </SelectItem>
        ))}
        <SelectItem value="custom">
          <div className="flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            Custom Province
          </div>
        </SelectItem>
        {isCustomValue && (
          <SelectItem value="custom">
            <div className="flex items-center">
              <CheckIcon className="h-4 w-4 mr-2" />
              {value} (Current)
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
