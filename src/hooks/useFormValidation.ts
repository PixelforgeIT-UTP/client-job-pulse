import { useState } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: any): string | null => {
    const rule = rules[field];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${field} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return null;

    // Length validations
    if (rule.minLength && value.length < rule.minLength) {
      return `${field} must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `${field} must be less than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${field} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  };

  const validateForm = (data: Record<string, any>): boolean => {
    const newErrors: Record<string, string> = {};

    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validateForm,
    validateField,
    clearError,
    clearAllErrors,
    setErrors,
  };
};

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

// Common validation functions
export const ValidationHelpers = {
  email: (email: string): string | null => {
    if (!ValidationPatterns.email.test(email)) {
      return 'Please enter a valid email address';
    }
    if (email.length > 254) {
      return 'Email address is too long';
    }
    return null;
  },

  phone: (phone: string): string | null => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!ValidationPatterns.phone.test(cleanPhone)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  futureDate: (date: string): string | null => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return 'Date cannot be in the past';
    }
    return null;
  },

  amount: (amount: number, min = 0, max = 1000000): string | null => {
    if (amount < min) {
      return `Amount must be at least $${min}`;
    }
    if (amount > max) {
      return `Amount cannot exceed $${max.toLocaleString()}`;
    }
    return null;
  },

  strongPassword: (password: string): string | null => {
    if (!ValidationPatterns.strongPassword.test(password)) {
      return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    return null;
  },
};