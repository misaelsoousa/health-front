import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function isValidCpf(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const digits = value.replace(/\D/g, '');

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const calcCheckDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += parseInt(digits.charAt(i), 10) * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    calcCheckDigit(9) === parseInt(digits.charAt(9), 10) &&
    calcCheckDigit(10) === parseInt(digits.charAt(10), 10)
  );
}

export const cpfValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null;
  }

  return isValidCpf(value) ? null : { cpfInvalid: true };
};
