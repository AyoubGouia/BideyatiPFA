import React, { createContext, useContext, useState } from 'react';

export interface RegistrationData {
  nom?: string;
  prenom?: string;
  dob?: string;
  numeroBAC?: string;
  email?: string;
  pwd?: string;
  confirm?: string;

  section?: string;
  session?: string;
  moyenneBac?: string;
  notes?: Record<string, string>;

  answers?: Record<string, Set<string>>;
}

interface RegistrationContextType {
  data: RegistrationData;
  updateData: (newData: Partial<RegistrationData>) => void;
  clearData: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [data, setData] = useState<RegistrationData>({
    section: 'Math', // Default to a valid section
    session: 'Principale',
    notes: {},
    answers: {},
  });

  const updateData = (newData: Partial<RegistrationData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const clearData = () => {
    setData({});
  };

  return (
    <RegistrationContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error('useRegistration must be used within a RegistrationProvider');
  return context;
};
