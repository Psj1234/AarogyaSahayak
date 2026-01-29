import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  age: number;
  condition: 'none' | 'diabetes' | 'hypertension' | 'both';
  language: 'en' | 'hi';
  ashaId?: string;
  phone: string;
}

export interface VitalRecord {
  id: string;
  date: string;
  glucose?: number;
  systolic?: number;
  diastolic?: number;
  weight?: number;
  bmi?: number;
}

export interface Reminder {
  id: string;
  title: string;
  type: 'medication' | 'checkup' | 'exercise';
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
}

interface HealthContextType {
  profile: UserProfile | null;
  vitals: VitalRecord[];
  reminders: Reminder[];
  setProfile: (profile: UserProfile) => void;
  addVital: (vital: Omit<VitalRecord, 'id'>) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    // Load data from localStorage on mount
    const savedProfile = localStorage.getItem('aarogya-profile');
    const savedVitals = localStorage.getItem('aarogya-vitals');
    const savedReminders = localStorage.getItem('aarogya-reminders');

    if (savedProfile) setProfileState(JSON.parse(savedProfile));
    if (savedVitals) setVitals(JSON.parse(savedVitals));
    if (savedReminders) setReminders(JSON.parse(savedReminders));
  }, []);

  const setProfile = (newProfile: UserProfile) => {
    setProfileState(newProfile);
    localStorage.setItem('aarogya-profile', JSON.stringify(newProfile));
  };

  const addVital = (vital: Omit<VitalRecord, 'id'>) => {
    const newVital = { ...vital, id: Date.now().toString() };
    const updatedVitals = [newVital, ...vitals];
    setVitals(updatedVitals);
    localStorage.setItem('aarogya-vitals', JSON.stringify(updatedVitals));
  };

  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    const newReminder = { ...reminder, id: Date.now().toString() };
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    localStorage.setItem('aarogya-reminders', JSON.stringify(updatedReminders));
  };

  const deleteReminder = (id: string) => {
    const updatedReminders = reminders.filter(r => r.id !== id);
    setReminders(updatedReminders);
    localStorage.setItem('aarogya-reminders', JSON.stringify(updatedReminders));
  };

  const toggleReminder = (id: string) => {
    const updatedReminders = reminders.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    );
    setReminders(updatedReminders);
    localStorage.setItem('aarogya-reminders', JSON.stringify(updatedReminders));
  };

  return (
    <HealthContext.Provider value={{
      profile,
      vitals,
      reminders,
      setProfile,
      addVital,
      addReminder,
      deleteReminder,
      toggleReminder
    }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};