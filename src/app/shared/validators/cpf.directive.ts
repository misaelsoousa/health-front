import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

import { cpfValidator } from './cpf.validator';

@Directive({
  selector: '[appCpfValidator][ngModel],[appCpfValidator][formControl],[appCpfValidator][formControlName]',
  providers: [{ provide: NG_VALIDATORS, useExisting: CpfValidatorDirective, multi: true }],
})
export class CpfValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    return cpfValidator(control);
  }
}
