import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHealth } from '@/contexts/HealthContext';
import { useToast } from '@/hooks/use-toast';

const Onboarding: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setProfile } = useHealth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    condition: 'none' as 'none' | 'diabetes' | 'hypertension' | 'both',
    language: 'en' as 'en' | 'hi',
    ashaId: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.phone) {
      toast({
        title: t('common.error'),
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const profile = {
      ...formData,
      age: parseInt(formData.age)
    };

    setProfile(profile);
    
    // Change language if different from current
    if (formData.language !== i18n.language) {
      i18n.changeLanguage(formData.language);
    }

    toast({
      title: t('onboarding.success'),
      description: "Welcome to Aarogya Sahayak!"
    });

    navigate('/vitals');
  };

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mr-2 -ml-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('onboarding.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('onboarding.subtitle')}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-medical border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-center text-primary">
              Profile Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  {t('onboarding.name')} *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="border-input focus:border-primary"
                  required
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">
                  {t('onboarding.age')} *
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  className="border-input focus:border-primary"
                  required
                />
              </div>

              {/* Health Condition */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('onboarding.condition')}
                </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value: 'none' | 'diabetes' | 'hypertension' | 'both') => 
                    setFormData(prev => ({ ...prev, condition: value }))
                  }
                >
                  <SelectTrigger className="border-input focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('onboarding.conditionOptions.none')}</SelectItem>
                    <SelectItem value="diabetes">{t('onboarding.conditionOptions.diabetes')}</SelectItem>
                    <SelectItem value="hypertension">{t('onboarding.conditionOptions.hypertension')}</SelectItem>
                    <SelectItem value="both">{t('onboarding.conditionOptions.both')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('onboarding.language')}
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: 'en' | 'hi') => 
                    setFormData(prev => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger className="border-input focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिंदी</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ASHA ID */}
              <div className="space-y-2">
                <Label htmlFor="ashaId" className="text-sm font-medium">
                  {t('onboarding.ashaId')}
                </Label>
                <Input
                  id="ashaId"
                  type="text"
                  value={formData.ashaId}
                  onChange={(e) => setFormData(prev => ({ ...prev, ashaId: e.target.value }))}
                  placeholder="ASHA001"
                  className="border-input focus:border-primary"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t('onboarding.phone')} *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="border-input focus:border-primary"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary text-white shadow-medical hover:shadow-lg transition-all"
                size="lg"
              >
                {t('onboarding.save')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;