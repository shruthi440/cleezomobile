import React, { createContext, ReactNode } from 'react';
import { Alert } from 'react-native';

type ErrorContextValue = {
  showError: (title: string, message?: string) => void;
};

export const ErrorContext = createContext<ErrorContextValue>({
  showError: (title: string, message?: string) => {
    Alert.alert(title, message || '');
  },
});

type ErrorProviderProps = {
  children: ReactNode;
};

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const showError = (title: string, message?: string) => {
    Alert.alert(title, message || '');
  };

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
    </ErrorContext.Provider>
  );
};
