import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  riskLevel?: 'low' | 'medium' | 'moderate' | 'high';
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
  loading: boolean;
  setProfile: (profile: UserProfile) => void;
  addVital: (vital: Omit<VitalRecord, 'id'>) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  refreshHealthData: () => Promise<void>;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  // Load offline cache on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('aarogya-profile');
    const savedVitals = localStorage.getItem('aarogya-vitals');
    const savedReminders = localStorage.getItem('aarogya-reminders');

    if (savedProfile) {
      try { setProfileState(JSON.parse(savedProfile)); } catch {}
    }
    if (savedVitals) {
      try { setVitals(JSON.parse(savedVitals)); } catch {}
    }
    if (savedReminders) {
      try { setReminders(JSON.parse(savedReminders)); } catch {}
    }
  }, []);

  // Fetch live cloud data when user is authenticated
  const fetchCloudData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // 1. Fetch persistent vitals from Supabase
      const { data: vitalsData, error: vitalsError } = await supabase
        .from('vitals')
        .select('*')
        .eq('patient_id', userId)
        .order('created_at', { ascending: false });

      if (vitalsError) {
        console.error('Error fetching vitals:', vitalsError);
      } else if (vitalsData) {
        const mappedVitals: VitalRecord[] = vitalsData.map(v => ({
          id: v.id,
          date: v.created_at,
          glucose: v.glucose != null ? Number(v.glucose) : undefined,
          systolic: v.systolic_bp != null ? Number(v.systolic_bp) : undefined,
          diastolic: v.diastolic_bp != null ? Number(v.diastolic_bp) : undefined,
          weight: v.weight != null ? Number(v.weight) : undefined,
          bmi: v.bmi != null ? Number(v.bmi) : undefined,
          riskLevel: v.risk_level ?? undefined
        }));
        setVitals(mappedVitals);
        localStorage.setItem('aarogya-vitals', JSON.stringify(mappedVitals));
      }

      // 2. Fetch persistent reminders from Supabase
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .eq('patient_id', userId)
        .order('created_at', { ascending: false });

      if (remindersError) {
        console.error('Error fetching reminders:', remindersError);
      } else if (remindersData) {
        const mappedReminders: Reminder[] = remindersData.map(r => ({
          id: r.id,
          title: r.title || r.category.charAt(0).toUpperCase() + r.category.slice(1),
          type: r.category as 'medication' | 'checkup' | 'exercise',
          time: r.time.slice(0, 5),
          frequency: r.frequency as 'daily' | 'weekly' | 'monthly',
          isActive: r.is_active
        }));
        setReminders(mappedReminders);
        localStorage.setItem('aarogya-reminders', JSON.stringify(mappedReminders));
      }
    } catch (err) {
      console.error('Cloud synchronization error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchCloudData(user.id);
    }
  }, [user?.id, fetchCloudData]);

  const refreshHealthData = async () => {
    if (user?.id) {
      await fetchCloudData(user.id);
    }
  };

  const setProfile = (newProfile: UserProfile) => {
    setProfileState(newProfile);
    localStorage.setItem('aarogya-profile', JSON.stringify(newProfile));
  };

  // Add Vital with Cloud Sync
  const addVital = async (vital: Omit<VitalRecord, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    const localVital: VitalRecord = { ...vital, id: tempId };
    
    // Optimistic update
    const updatedVitals = [localVital, ...vitals];
    setVitals(updatedVitals);
    localStorage.setItem('aarogya-vitals', JSON.stringify(updatedVitals));

    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('vitals')
          .insert({
            patient_id: user.id,
            glucose: vital.glucose ?? null,
            systolic_bp: vital.systolic ? Math.round(vital.systolic) : null,
            diastolic_bp: vital.diastolic ? Math.round(vital.diastolic) : null,
            weight: vital.weight ?? null,
            bmi: vital.bmi ?? null,
            risk_level: (vital.riskLevel as any) ?? null,
            created_at: vital.date || new Date().toISOString()
          })
          .select('id, created_at')
          .single();

        if (error) {
          console.error('Supabase add vital error:', error);
          toast({
            title: 'Cloud Sync Warning',
            description: 'Vitals saved locally, but failed to sync to cloud database.',
            variant: 'destructive'
          });
        } else if (data) {
          // Replace temp ID with permanent DB UUID
          setVitals(prev => prev.map(v => v.id === tempId ? { ...v, id: data.id, date: data.created_at } : v));
        }
      } catch (err) {
        console.error('Failed to sync vital to Supabase:', err);
      }
    }
  };

  // Add Reminder with Cloud Sync
  const addReminder = async (reminder: Omit<Reminder, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    const localReminder: Reminder = { ...reminder, id: tempId };

    // Optimistic update
    const updatedReminders = [localReminder, ...reminders];
    setReminders(updatedReminders);
    localStorage.setItem('aarogya-reminders', JSON.stringify(updatedReminders));

    if (user?.id) {
      try {
        // Ensure time is formatted HH:mm:00
        const formattedTime = reminder.time.length === 5 ? `${reminder.time}:00` : reminder.time;
        
        const { data, error } = await supabase
          .from('reminders')
          .insert({
            patient_id: user.id,
            title: reminder.title,
            category: reminder.type,
            time: formattedTime,
            frequency: reminder.frequency,
            is_active: reminder.isActive ?? true
          })
          .select('id')
          .single();

        if (error) {
          console.error('Supabase add reminder error:', error);
          toast({
            title: 'Cloud Sync Warning',
            description: 'Reminder saved locally, but failed to sync to cloud database.',
            variant: 'destructive'
          });
        } else if (data) {
          setReminders(prev => prev.map(r => r.id === tempId ? { ...r, id: data.id } : r));
        }
      } catch (err) {
        console.error('Failed to sync reminder to Supabase:', err);
      }
    }
  };

  // Delete Reminder with Cloud Sync
  const deleteReminder = async (id: string) => {
    // Optimistic update
    const updatedReminders = reminders.filter(r => r.id !== id);
    setReminders(updatedReminders);
    localStorage.setItem('aarogya-reminders', JSON.stringify(updatedReminders));

    if (user?.id && !id.startsWith('temp-')) {
      try {
        const { error } = await supabase
          .from('reminders')
          .delete()
          .eq('id', id)
          .eq('patient_id', user.id);

        if (error) {
          console.error('Supabase delete reminder error:', error);
          toast({
            title: 'Sync Error',
            description: 'Could not delete reminder from cloud.',
            variant: 'destructive'
          });
        }
      } catch (err) {
        console.error('Failed to delete reminder from Supabase:', err);
      }
    }
  };

  // Toggle Reminder with Cloud Sync
  const toggleReminder = async (id: string) => {
    let targetNewState = true;
    const updatedReminders = reminders.map(r => {
      if (r.id === id) {
        targetNewState = !r.isActive;
        return { ...r, isActive: !r.isActive };
      }
      return r;
    });

    setReminders(updatedReminders);
    localStorage.setItem('aarogya-reminders', JSON.stringify(updatedReminders));

    if (user?.id && !id.startsWith('temp-')) {
      try {
        const { error } = await supabase
          .from('reminders')
          .update({ is_active: targetNewState })
          .eq('id', id)
          .eq('patient_id', user.id);

        if (error) {
          console.error('Supabase toggle reminder error:', error);
        }
      } catch (err) {
        console.error('Failed to update reminder status:', err);
      }
    }
  };

  return (
    <HealthContext.Provider value={{
      profile,
      vitals,
      reminders,
      loading,
      setProfile,
      addVital,
      addReminder,
      deleteReminder,
      toggleReminder,
      refreshHealthData
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