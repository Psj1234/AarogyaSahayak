import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Heart, Droplets, Scale, Gauge } from 'lucide-react';
import { MedicalCard, MedicalCardContent, MedicalCardHeader, MedicalCardTitle } from '@/components/ui/medical-card';
import { StatCard } from '@/components/ui/stat-card';
import { AlertBox } from '@/components/ui/alert-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useHealth } from '@/contexts/HealthContext';
import { useToast } from '@/hooks/use-toast';

const Vitals: React.FC = () => {
  const { t } = useTranslation();
  const { vitals, addVital } = useHealth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    glucose: '',
    systolic: '',
    diastolic: '',
    weight: ''
  });

  const [riskData, setRiskData] = useState<{
    score: number;
    level: 'low' | 'moderate' | 'high';
    loading: boolean;
  } | null>(null);

  // Generate chart data for the last 7 days
  const chartData = vitals.length > 0 ? vitals.slice(0, 7).reverse().map((vital, index) => ({
    date: new Date(vital.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    glucose: vital.glucose || null,
    systolic: vital.systolic || null,
    diastolic: vital.diastolic || null,
    weight: vital.weight || null,
    bmi: vital.bmi || null
  })) : [
    { date: '1/15', glucose: 120, systolic: 130, diastolic: 85, weight: 70, bmi: 25.7 },
    { date: '1/16', glucose: 115, systolic: 128, diastolic: 82, weight: 69.8, bmi: 25.6 },
    { date: '1/17', glucose: 125, systolic: 135, diastolic: 88, weight: 70.2, bmi: 25.8 },
    { date: '1/18', glucose: 110, systolic: 125, diastolic: 80, weight: 69.5, bmi: 25.5 },
    { date: '1/19', glucose: 118, systolic: 132, diastolic: 86, weight: 70.1, bmi: 25.7 },
    { date: '1/20', glucose: 122, systolic: 129, diastolic: 84, weight: 69.9, bmi: 25.6 },
    { date: '1/21', glucose: 116, systolic: 127, diastolic: 83, weight: 70.0, bmi: 25.7 }
  ];

  const chartConfig = {
    glucose: {
      label: t('vitals.glucose'),
      color: 'hsl(220 70% 50%)'
    },
    systolic: {
      label: 'Systolic BP',
      color: 'hsl(142 76% 36%)'
    },
    diastolic: {
      label: 'Diastolic BP', 
      color: 'hsl(142 76% 56%)'
    },
    weight: {
      label: t('vitals.weight'),
      color: 'hsl(38 92% 50%)'
    },
    bmi: {
      label: 'BMI',
      color: 'hsl(262 83% 58%)'
    }
  };

  const calculateBMI = (weight: number) => {
    // Assuming average height of 165cm for demo
    const height = 1.65;
    return (weight / (height * height)).toFixed(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vital = {
      date: new Date().toISOString(),
      glucose: formData.glucose ? parseFloat(formData.glucose) : undefined,
      systolic: formData.systolic ? parseFloat(formData.systolic) : undefined,
      diastolic: formData.diastolic ? parseFloat(formData.diastolic) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      bmi: formData.weight ? parseFloat(calculateBMI(parseFloat(formData.weight))) : undefined
    };

    addVital(vital);
    setFormData({ glucose: '', systolic: '', diastolic: '', weight: '' });
    
    toast({
      title: t('vitals.success'),
      description: "Your vitals have been recorded"
    });
  };

  const predictRisk = async () => {
    if (!formData.glucose || !formData.systolic || !formData.weight) {
      toast({
        title: t('common.error'),
        description: "Please fill in glucose, blood pressure, and weight to predict risk",
        variant: "destructive"
      });
      return;
    }

    setRiskData(prev => ({ ...prev, loading: true } as any));

    try {
      const response = await fetch('https://health-uxaj.onrender.com/predict_risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          glucose: parseFloat(formData.glucose),
          blood_pressure: parseFloat(formData.systolic),
          bmi: parseFloat(calculateBMI(parseFloat(formData.weight)))
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Handle different possible response formats
      let score = data.risk_score || data.risk || data.prediction || data.score;
      
      // If no score found, try to calculate from the response data
      if (score === undefined || score === null) {
        // Try to use any numeric value as a fallback
        const values = Object.values(data).filter(val => typeof val === 'number');
        if (values.length > 0) {
          score = values[0];
        } else {
          throw new Error(`Invalid response format: ${JSON.stringify(data)}`);
        }
      }
      
      // Ensure score is between 0 and 1
      if (score > 1) score = score / 100;
      
      let level: 'low' | 'moderate' | 'high' = 'low';
      if (score > 0.7) level = 'high';
      else if (score > 0.4) level = 'moderate';

      setRiskData({ score: Math.round(score * 100), level, loading: false });
      
      toast({
        title: "Risk Assessment Complete",
        description: `Your risk level is ${level}`
      });
    } catch (error) {
      setRiskData(prev => ({ ...prev, loading: false } as any));
      console.error('API call failed:', error);
      
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : "Failed to get risk prediction. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (level: 'low' | 'moderate' | 'high') => {
    switch (level) {
      case 'low': return 'text-success';
      case 'moderate': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskIcon = (level: 'low' | 'moderate' | 'high') => {
    switch (level) {
      case 'low': return CheckCircle;
      case 'moderate': return AlertCircle;
      case 'high': return AlertCircle;
      default: return Activity;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="bg-primary/10 rounded-full p-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-nunito text-foreground">
            {t('vitals.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('vitals.subtitle')}
          </p>
        </motion.div>

        {/* Quick Stats */}
        {vitals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            {vitals.slice(-1).map((vital, index) => (
              <React.Fragment key={index}>
                {vital.glucose && (
                  <StatCard
                    title="Glucose"
                    value={`${vital.glucose}`}
                    subtitle="mg/dL"
                    icon={Droplets}
                    variant={vital.glucose > 140 ? "warning" : "success"}
                  />
                )}
                {vital.systolic && (
                  <StatCard
                    title="Blood Pressure"
                    value={`${vital.systolic}/${vital.diastolic || 80}`}
                    subtitle="mmHg"
                    icon={Heart}
                    variant={vital.systolic > 140 ? "danger" : "success"}
                  />
                )}
                {vital.weight && (
                  <StatCard
                    title="Weight"
                    value={`${vital.weight}`}
                    subtitle="kg"
                    icon={Scale}
                  />
                )}
                {vital.bmi && (
                  <StatCard
                    title="BMI"
                    value={vital.bmi}
                    subtitle="kg/m²"
                    icon={Gauge}
                    variant={vital.bmi > 25 ? "warning" : "success"}
                  />
                )}
              </React.Fragment>
            ))}
          </motion.div>
        )}

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MedicalCard variant="elevated">
            <MedicalCardHeader>
              <MedicalCardTitle className="flex items-center gap-2 text-primary">
                <Activity className="h-6 w-6" />
                Log Today's Vitals
              </MedicalCardTitle>
            </MedicalCardHeader>
            <MedicalCardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Glucose */}
                  <div className="space-y-3">
                    <Label htmlFor="glucose" className="text-sm font-semibold flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-primary" />
                      {t('vitals.glucose')}
                    </Label>
                    <Input
                      id="glucose"
                      type="number"
                      step="0.1"
                      value={formData.glucose}
                      onChange={(e) => setFormData(prev => ({ ...prev, glucose: e.target.value }))}
                      placeholder="120"
                      className="h-12 text-base rounded-xl border-border focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  {/* Weight */}
                  <div className="space-y-3">
                    <Label htmlFor="weight" className="text-sm font-semibold flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" />
                      {t('vitals.weight')}
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="70.0"
                      className="h-12 text-base rounded-xl border-border focus:border-primary focus:ring-primary/20"
                    />
                    {formData.weight && (
                      <p className="text-sm text-muted-foreground">
                        {t('vitals.bmi')}: {calculateBMI(parseFloat(formData.weight))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Blood Pressure */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    {t('vitals.bloodPressure')}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        value={formData.systolic}
                        onChange={(e) => setFormData(prev => ({ ...prev, systolic: e.target.value }))}
                        placeholder="120"
                        className="h-12 text-base rounded-xl border-border focus:border-primary focus:ring-primary/20"
                      />
                      <Label className="text-xs text-muted-foreground mt-1 block">{t('vitals.systolic')}</Label>
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={formData.diastolic}
                        onChange={(e) => setFormData(prev => ({ ...prev, diastolic: e.target.value }))}
                        placeholder="80"
                        className="h-12 text-base rounded-xl border-border focus:border-primary focus:ring-primary/20"
                      />
                      <Label className="text-xs text-muted-foreground mt-1 block">{t('vitals.diastolic')}</Label>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <Button 
                    type="submit" 
                    size="lg"
                    className="medical-button h-12 text-base rounded-xl"
                  >
                    {t('vitals.log')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg"
                    onClick={predictRisk}
                    disabled={riskData?.loading}
                    className="h-12 text-base rounded-xl border-primary text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    {riskData?.loading ? t('common.loading') : t('vitals.predict')}
                  </Button>
                </div>
              </form>
            </MedicalCardContent>
          </MedicalCard>
        </motion.div>

        {/* Risk Assessment */}
        {riskData && !riskData.loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <AlertBox
              type={riskData.level === 'low' ? 'success' : riskData.level === 'moderate' ? 'warning' : 'danger'}
              title={t('vitals.riskScore')}
              message={`Your health risk level is ${riskData.level} (${riskData.score}%)`}
              dismissible={false}
              animated={true}
            />
          </motion.div>
        )}

        {/* Charts */}
        <Tabs defaultValue="7days" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="7days">{t('vitals.days7')}</TabsTrigger>
            <TabsTrigger value="30days">{t('vitals.days30')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="7days" className="space-y-6">
            {/* Blood Glucose Chart */}
            <MedicalCard variant="elevated">
              <MedicalCardHeader>
                <MedicalCardTitle className="flex items-center gap-2 text-blue-600">
                  <Droplets className="h-5 w-5" />
                  Blood Glucose Trends
                </MedicalCardTitle>
              </MedicalCardHeader>
              <MedicalCardContent>
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        domain={[80, 160]}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          hideLabel={false}
                          formatter={(value) => [`${value} mg/dL`, 'Glucose Level']}
                        />} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="glucose" 
                        stroke={chartConfig.glucose.color}
                        strokeWidth={3}
                        dot={{ fill: chartConfig.glucose.color, strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: chartConfig.glucose.color, strokeWidth: 2 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </MedicalCardContent>
            </MedicalCard>

            {/* Blood Pressure Chart */}
            <MedicalCard variant="elevated">
              <MedicalCardHeader>
                <MedicalCardTitle className="flex items-center gap-2 text-green-600">
                  <Heart className="h-5 w-5" />
                  Blood Pressure Trends
                </MedicalCardTitle>
              </MedicalCardHeader>
              <MedicalCardContent>
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        domain={[60, 150]}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          hideLabel={false}
                          formatter={(value, name) => [
                            `${value} mmHg`, 
                            name === 'systolic' ? 'Systolic BP' : 'Diastolic BP'
                          ]}
                        />} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="systolic" 
                        stroke={chartConfig.systolic.color}
                        strokeWidth={3}
                        dot={{ fill: chartConfig.systolic.color, strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: chartConfig.systolic.color, strokeWidth: 2 }}
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="diastolic" 
                        stroke={chartConfig.diastolic.color}
                        strokeWidth={3}
                        dot={{ fill: chartConfig.diastolic.color, strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: chartConfig.diastolic.color, strokeWidth: 2 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-3 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.systolic.color }} />
                    <span className="text-sm font-medium text-muted-foreground">Systolic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.diastolic.color }} />
                    <span className="text-sm font-medium text-muted-foreground">Diastolic</span>
                  </div>
                </div>
              </MedicalCardContent>
            </MedicalCard>

            {/* Weight & BMI Chart */}
            <MedicalCard variant="elevated">
              <MedicalCardHeader>
                <MedicalCardTitle className="flex items-center gap-2 text-amber-600">
                  <Scale className="h-5 w-5" />
                  Weight & BMI Trends
                </MedicalCardTitle>
              </MedicalCardHeader>
              <MedicalCardContent>
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          hideLabel={false}
                          formatter={(value, name) => [
                            `${value}${name === 'weight' ? ' kg' : ' BMI'}`, 
                            name === 'weight' ? 'Weight' : 'BMI'
                          ]}
                        />} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke={chartConfig.weight.color}
                        strokeWidth={3}
                        dot={{ fill: chartConfig.weight.color, strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: chartConfig.weight.color, strokeWidth: 2 }}
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="bmi" 
                        stroke={chartConfig.bmi.color}
                        strokeWidth={3}
                        dot={{ fill: chartConfig.bmi.color, strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: chartConfig.bmi.color, strokeWidth: 2 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-3 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.weight.color }} />
                    <span className="text-sm font-medium text-muted-foreground">Weight (kg)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.bmi.color }} />
                    <span className="text-sm font-medium text-muted-foreground">BMI</span>
                  </div>
                </div>
              </MedicalCardContent>
            </MedicalCard>
          </TabsContent>
          
          <TabsContent value="30days">
            <MedicalCard variant="elevated">
              <MedicalCardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>30-day trends coming soon!</p>
                  <p className="text-sm mt-2">Keep logging your vitals to see longer trends.</p>
                </div>
              </MedicalCardContent>
            </MedicalCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Vitals;