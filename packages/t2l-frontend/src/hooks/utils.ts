import React from "react";

export function useValidatedState<T>(
  initialValue: T,
  validator: (value: T) => string | undefined
): [T, string | undefined, (value: T) => void] {
  const [valueAndError, setValueAndError] = React.useState<{
    value: T;
    error: string | undefined;
  }>({
    value: initialValue,
    error: undefined,
  });

  function setAndValidateValue(value: T) {
    setValueAndError({
      value,
      error: validator(value),
    });
  }

  return [valueAndError.value, valueAndError.error, setAndValidateValue];
}
