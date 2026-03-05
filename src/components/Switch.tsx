import React from 'react';

type CaseProps<T> = {
  value: T;
  children: React.ReactNode;
};

export function Case<T>({ children }: CaseProps<T>) {
  return <>{children}</>;
}
type SwitchProps<T> = {
  mode: T;
  children: React.ReactNode;
};

export function Switch<T>({ mode, children }: SwitchProps<T>) {
  const match = React.Children.toArray(children).find((child: any) => {
    return child?.props?.value === mode;
  });

  return <>{match || null}</>;
}