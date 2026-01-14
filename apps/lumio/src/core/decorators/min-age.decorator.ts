import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsAtLeastYearsOld(
  minYears: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAtLeastYearsOld',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (!value) return true;

          const birthDate = new Date(value);
          const today = new Date();

          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          return age >= minYears;
        },
      },
    });
  };
}
