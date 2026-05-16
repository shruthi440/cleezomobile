import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme(); // Detect system theme
  const [theme, setTheme] = useState(systemTheme || 'light');

  useEffect(() => {
    setTheme(systemTheme || 'light');
  }, [systemTheme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const themeStyles = {
    light: {
      containerBackground: '#f5f5f5',
      textColor: '#000000',
      buttonBackground: '#24385f',
      buttonTextColor: '#ffffff',
      inputBackground: '#ffffff',
      inputBorderColor: '#666',
    },
    dark: {
      containerBackground: '#121212',
      textColor: '#000000',
      buttonBackground: '#444',
      buttonTextColor: '#ffffff',
      inputBackground: '#1e1e1e',
      inputBorderColor: '#666',
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeStyles: themeStyles[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};
