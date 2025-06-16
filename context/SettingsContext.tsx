import React, { createContext, ReactNode, useContext, useState } from 'react';

type ClimateType = 'moderate' | 'hot'; //climate types

type SettingsType = {
  weight: number;
  exerciseHours: number;
  climate: ClimateType;
  dailyGoal: number;
  currentIntake: number;
};

type SettingsContextType = {
  settings: SettingsType;
  updateSettings: (newSettings: Partial<SettingsType>) => void;
};

//sets default values for settings
const defaultSettings: SettingsType = {
  weight: 150,
  exerciseHours: 0,
  climate: 'moderate',
  dailyGoal: 75,
  currentIntake: 0,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);

  const updateSettings = (newSettings: Partial<SettingsType>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
