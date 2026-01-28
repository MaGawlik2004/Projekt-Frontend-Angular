import { AbstractControl, ValidationErrors } from '@angular/forms';

export function doctorDomainValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value as string;
  const domain = '@med-clinic.pl';

  if (email && !email.toLowerCase().endsWith(domain)) {
    return { invalidDomain: { expected: domain } };
  }

  return null;
}
