import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Bell, Pill, Calendar, Dumbbell, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useHealth } from '@/contexts/HealthContext';
import { useToast } from '@/hooks/use-toast';

const Reminders: React.FC = () => {
  const { t } = useTranslation();
  const { reminders, addReminder, deleteReminder, toggleReminder } = useHealth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'medication' as 'medication' | 'checkup' | 'exercise',
    time: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.time) {
      toast({
        title: t('common.error'),
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    addReminder({
      ...formData,
      isActive: true
    });

    setFormData({
      title: '',
      type: 'medication',
      time: '',
      frequency: 'daily'
    });

    setIsDialogOpen(false);
    
    toast({
      title: t('reminders.success'),
      description: "Reminder has been created"
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication': return Pill;
      case 'checkup': return Calendar;
      case 'exercise': return Dumbbell;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'medication': return 'text-primary bg-primary/10';
      case 'checkup': return 'text-success bg-success/10';
      case 'exercise': return 'text-warning bg-warning/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('reminders.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('reminders.subtitle')}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary shadow-medical">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-primary">
                  {t('reminders.add')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Reminder Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Take morning medication"
                    className="border-input focus:border-primary"
                    required
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'medication' | 'checkup' | 'exercise') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="border-input focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medication">{t('reminders.medication')}</SelectItem>
                      <SelectItem value="checkup">{t('reminders.checkup')}</SelectItem>
                      <SelectItem value="exercise">{t('reminders.exercise')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-medium">
                    {t('reminders.time')} *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="border-input focus:border-primary"
                    required
                  />
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('reminders.frequency')}
                  </Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      setFormData(prev => ({ ...prev, frequency: value }))
                    }
                  >
                    <SelectTrigger className="border-input focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t('reminders.daily')}</SelectItem>
                      <SelectItem value="weekly">{t('reminders.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('reminders.monthly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-primary"
                  >
                    {t('reminders.save')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <Card className="shadow-medical border-border/50">
            <CardContent className="pt-6 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t('reminders.noReminders')}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Set up your first health reminder to stay on track
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-primary shadow-medical"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('reminders.add')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const TypeIcon = getTypeIcon(reminder.type);
              return (
                <Card key={reminder.id} className="shadow-card border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(reminder.type)}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {reminder.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(reminder.time)}</span>
                            <span>• {t(`reminders.${reminder.frequency}`)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reminder.isActive}
                          onCheckedChange={() => toggleReminder(reminder.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReminder(reminder.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* TODO: Push Notifications Integration Note */}
        <Card className="shadow-card border-border/50 bg-accent/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Smart Notifications
                </h4>
                <p className="text-sm text-muted-foreground">
                  {/* TODO: Integrate with browser/device push notifications */}
                  Push notifications will be enabled in the next update to ensure you never miss your health routine.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reminders;