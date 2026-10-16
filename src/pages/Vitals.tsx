import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Heart, Droplets, Scale, Gauge, Info, Calendar } from 'lucide-react';
import { MedicalCard, MedicalCardContent, MedicalCardHeader, MedicalCardTitle } from '@/components/ui/medical-card';
import { StatCard } from '@/components/ui/stat-card';
import { AlertBox } from '@/components/ui/alert-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useHealth, VitalRecord } from '@/contexts/HealthContext';
import { useToast } from '@/hooks/use-toast';

interface ChartPoint {
  date: string;
  glucose: number | null;
  systolic: number | null;
  diastolic: number | null;
  weight: number | null;
  bmi: number | null;
}

const DEFAULT_7_DAYS: ChartPoint[] = [
  { date: 'Day 1', glucose: 110, systolic: 122, diastolic: 78, weight: 69.5, bmi: 25.5 },
  { date: 'Day 2', glucose: 115, systolic: 128, diastolic: 82, weight: 69.8, bmi: 25.6 },
  { date: 'Day 3', glucose: 125, systolic: 135, diastolic: 88, weight: 70.2, bmi: 25.8 },
  { date: 'Day 4', glucose: 118, systolic: 125, diastolic: 80, weight: 69.7, bmi: 25.6 },
  { date: 'Day 5', glucose: 112, systolic: 124, diastolic: 81, weight: 69.9, bmi: 25.6 },
  { date: 'Day 6', glucose: 120, systolic: 129, diastolic: 84, weight: 70.0, bmi: 25.7 },
  { date: 'Day 7', glucose: 116, systolic: 126, diastolic: 82, weight: 69.8, bmi: 25.6 }
];

const DEFAULT_30_DAYS: ChartPoint[] = [
  { date: 'Week 1', glucose: 125, systolic: 136, diastolic: 88, weight: 71.0, bmi: 26.1 },
  { date: 'Week 2', glucose: 120, systolic: 130, diastolic: 84, weight: 70.4, bmi: 25.8 },
  { date: 'Week 3', glucose: 114, systolic: 126, diastolic: 82, weight: 69.9, bmi: 25.6 },
  { date: 'Week 4', glucose: 112, systolic: 122, diastolic: 79, weight: 69.5, bmi: 25.5 }
];

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

  const [activeTab, setActiveTab] = useState<'7days' | '30days'>('7days');

  // Chart configuration tokens
  const chartConfig = {
    glucose: {
      label: t('vitals.glucose') || 'Blood Glucose',
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
      label: t('vitals.weight') || 'Weight (kg)',
      color: 'hsl(38 92% 50%)'
    },
    bmi: {
      label: 'BMI',
      color: 'hsl(262 83% 58%)'
    }
  };

  const calculateBMI = (weight: number) => {
    const height = 1.65; // Average baseline height 165cm
    return (weight / (height * height)).toFixed(1);
  };

  // Format a single vital record into a chart point
  const mapVitalToPoint = (v: VitalRecord): ChartPoint => {
    const d = new Date(v.date);
    const dateLabel = isNaN(d.getTime()) 
      ? 'Recent' 
      : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

    return {
      date: dateLabel,
      glucose: v.glucose ?? null,
      systolic: v.systolic ?? null,
      diastolic: v.diastolic ?? null,
      weight: v.weight ?? null,
      bmi: v.bmi ?? null
    };
  };

  // Dynamic 7-day dataset
  const chartData7Days = useMemo(() => {
    if (vitals.length === 0) return DEFAULT_7_DAYS;
    return vitals.slice(0, 7).reverse().map(mapVitalToPoint);
  }, [vitals]);

  // Dynamic 30-day dataset
  const chartData30Days = useMemo(() => {
    if (vitals.length === 0) return DEFAULT_30_DAYS;
    return vitals.slice(0, 30).reverse().map(mapVitalToPoint);
  }, [vitals]);

  const currentChartData = activeTab === '7days' ? chartData7Days : chartData30Days;
  const isUsingSampleData = vitals.length === 0;

  const predictRisk = async (dataToPredict = formData): Promise<{ level: 'low' | 'moderate' | 'high'; score: number }> => {
    const glucoseVal = parseFloat(dataToPredict.glucose);
    const systolicVal = parseFloat(dataToPredict.systolic);
    const diastolicVal = parseFloat(dataToPredict.diastolic);
    const weightVal = parseFloat(dataToPredict.weight);
    const bmiVal = weightVal ? parseFloat(calculateBMI(weightVal)) : undefined;

    setRiskData(prev => ({ ...prev, loading: true } as any));

    try {
      const riskApiUrl = import.meta.env.VITE_RISK_API_URL || 'http://localhost:8000/predict_risk';
      const response = await fetch(riskApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          glucose: isNaN(glucoseVal) ? 100 : glucoseVal,
          systolic_bp: isNaN(systolicVal) ? 120 : systolicVal,
          diastolic_bp: isNaN(diastolicVal) ? 80 : diastolicVal,
          weight: isNaN(weightVal) ? undefined : weightVal,
          bmi: bmiVal
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      const data = await response.json();
      
      let level: 'low' | 'moderate' | 'high' = 'low';
      if (data.risk_level) {
        const rawLevel = String(data.risk_level).toLowerCase();
        if (rawLevel === 'high') level = 'high';
        else if (rawLevel === 'moderate' || rawLevel === 'medium') level = 'moderate';
        else level = 'low';
      } else {
        let score = data.risk_score ?? data.risk ?? data.score ?? 20;
        if (score > 1) score = score / 100;
        if (score > 0.7) level = 'high';
        else if (score > 0.4) level = 'moderate';
        else level = 'low';
      }

      const score = data.risk_score ?? (level === 'high' ? 85 : level === 'moderate' ? 55 : 20);
      const result = { level, score };

      setRiskData({ score, level, loading: false });
      
      toast({
        title: "Risk Analysis Complete",
        description: `Calculated risk level: ${level.toUpperCase()}`
      });

      return result;
    } catch (error: any) {
      console.warn('Risk prediction service offline or unreachable, using clinical heuristic fallback:', error);
      
      // Clinical rule-based heuristic fallback
      let calculatedLevel: 'low' | 'moderate' | 'high' = 'low';
      let calculatedScore = 20;

      const g = isNaN(glucoseVal) ? 100 : glucoseVal;
      const s = isNaN(systolicVal) ? 120 : systolicVal;

      if (g >= 180 || s >= 140) {
        calculatedLevel = 'high';
        calculatedScore = 85;
      } else if (g >= 140 || s >= 130) {
        calculatedLevel = 'moderate';
        calculatedScore = 55;
      }

      const fallbackResult = { score: calculatedScore, level: calculatedLevel };
      setRiskData({ score: calculatedScore, level: calculatedLevel, loading: false });

      toast({
        title: "Health Risk Estimated",
        description: `Estimated clinical risk level: ${calculatedLevel.toUpperCase()}`
      });

      return fallbackResult;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.glucose && !formData.systolic && !formData.weight) {
      toast({
        title: t('common.error') || 'Error',
        description: "Please fill in at least one vital metric to save",
        variant: "destructive"
      });
      return;
    }

    // Auto-predict in background if riskData is not yet calculated
    let resolvedRiskLevel = riskData?.level;
    if (!resolvedRiskLevel) {
      const prediction = await predictRisk(formData);
      resolvedRiskLevel = prediction.level;
    }

    // Guaranteed fallback: risk level is never null
    if (!resolvedRiskLevel) {
      resolvedRiskLevel = 'low';
    }

    const vital = {
      date: new Date().toISOString(),
      glucose: formData.glucose ? parseFloat(formData.glucose) : undefined,
      systolic: formData.systolic ? parseFloat(formData.systolic) : undefined,
      diastolic: formData.diastolic ? parseFloat(formData.diastolic) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      bmi: formData.weight ? parseFloat(calculateBMI(parseFloat(formData.weight))) : undefined,
      riskLevel: resolvedRiskLevel
    };

    await addVital(vital);
    setFormData({ glucose: '', systolic: '', diastolic: '', weight: '' });
    
    toast({
      title: t('vitals.success') || 'Vitals Recorded',
      description: `Your health metrics have been saved with ${resolvedRiskLevel.toUpperCase()} risk classification.`
    });
  };

  const handleManualPredictClick = () => {
    if (!formData.glucose || !formData.systolic || !formData.weight) {
      toast({
        title: t('common.error') || 'Error',
        description: "Please fill in glucose, blood pressure, and weight to predict risk",
        variant: "destructive"
      });
      return;
    }
    predictRisk(formData);
  };

  const renderTrendCharts = (data: ChartPoint[], titlePrefix: string) => (
    <div className="space-y-6">
      {/* Blood Glucose Chart */}
      <MedicalCard variant="elevated">
        <MedicalCardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <MedicalCardTitle className="flex items-center gap-2 text-blue-600 text-base">
              <Droplets className="h-5 w-5" />
              {titlePrefix} Blood Glucose Trends
            </MedicalCardTitle>
            {isUsingSampleData && (
              <Badge variant="secondary" className="text-[10px]">Sample Preview</Badge>
            )}
          </div>
        </MedicalCardHeader>
        <MedicalCardContent>
          <ChartContainer config={chartConfig} className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
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
                  domain={['dataMin - 15', 'dataMax + 15']}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    hideLabel={false}
                    formatter={(value) => [`${value} mg/dL`, 'Blood Glucose']}
                  />} 
                />
                <Line 
                  type="monotone" 
                  dataKey="glucose" 
                  stroke={chartConfig.glucose.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.glucose.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: chartConfig.glucose.color, strokeWidth: 2 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            Optimal fasting target: 80 - 130 mg/dL
          </div>
        </MedicalCardContent>
      </MedicalCard>

      {/* Blood Pressure Chart */}
      <MedicalCard variant="elevated">
        <MedicalCardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <MedicalCardTitle className="flex items-center gap-2 text-green-600 text-base">
              <Heart className="h-5 w-5" />
              {titlePrefix} Blood Pressure Trends
            </MedicalCardTitle>
            {isUsingSampleData && (
              <Badge variant="secondary" className="text-[10px]">Sample Preview</Badge>
            )}
          </div>
        </MedicalCardHeader>
        <MedicalCardContent>
          <ChartContainer config={chartConfig} className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
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
                  domain={[60, 160]}
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
                  dot={{ fill: chartConfig.systolic.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: chartConfig.systolic.color, strokeWidth: 2 }}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="diastolic" 
                  stroke={chartConfig.diastolic.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.diastolic.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: chartConfig.diastolic.color, strokeWidth: 2 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-3 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.systolic.color }} />
              <span className="text-xs font-medium text-muted-foreground">Systolic (&lt;120 mmHg)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.diastolic.color }} />
              <span className="text-xs font-medium text-muted-foreground">Diastolic (&lt;80 mmHg)</span>
            </div>
          </div>
        </MedicalCardContent>
      </MedicalCard>

      {/* Weight & BMI Chart */}
      <MedicalCard variant="elevated">
        <MedicalCardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <MedicalCardTitle className="flex items-center gap-2 text-amber-600 text-base">
              <Scale className="h-5 w-5" />
              {titlePrefix} Weight & BMI Trends
            </MedicalCardTitle>
            {isUsingSampleData && (
              <Badge variant="secondary" className="text-[10px]">Sample Preview</Badge>
            )}
          </div>
        </MedicalCardHeader>
        <MedicalCardContent>
          <ChartContainer config={chartConfig} className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
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
                  domain={['dataMin - 3', 'dataMax + 3']}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    hideLabel={false}
                    formatter={(value, name) => [
                      `${value}${name === 'weight' ? ' kg' : ' BMI'}`, 
                      name === 'weight' ? 'Body Weight' : 'BMI'
                    ]}
                  />} 
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke={chartConfig.weight.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.weight.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: chartConfig.weight.color, strokeWidth: 2 }}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="bmi" 
                  stroke={chartConfig.bmi.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.bmi.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: chartConfig.bmi.color, strokeWidth: 2 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-3 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.weight.color }} />
              <span className="text-xs font-medium text-muted-foreground">Weight (kg)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.bmi.color }} />
              <span className="text-xs font-medium text-muted-foreground">BMI (Normal: 18.5 - 24.9)</span>
            </div>
          </div>
        </MedicalCardContent>
      </MedicalCard>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {t('vitals.title') || 'Vitals & Risk Tracking'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('vitals.subtitle') || 'Monitor your daily health indicators and AI assessment'}
          </p>
        </div>

        {/* Latest Vitals Summary Cards */}
        {vitals.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {vitals.slice(0, 1).map((vital) => (
              <React.Fragment key={vital.id}>
                {vital.glucose && (
                  <StatCard
                    title="Glucose"
                    value={`${vital.glucose} mg/dL`}
                    subtitle={new Date(vital.date).toLocaleDateString()}
                    icon={Droplets}
                    variant={vital.glucose > 140 ? 'warning' : 'success'}
                  />
                )}
                {vital.systolic && vital.diastolic && (
                  <StatCard
                    title="Blood Pressure"
                    value={`${vital.systolic}/${vital.diastolic}`}
                    subtitle="mmHg"
                    icon={Heart}
                    variant={vital.systolic > 130 ? 'warning' : 'success'}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Vitals Input Form */}
        <MedicalCard variant="elevated">
          <MedicalCardHeader className="pb-3">
            <MedicalCardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Log Daily Measurements
            </MedicalCardTitle>
          </MedicalCardHeader>
          <MedicalCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="glucose" className="text-xs font-medium">Glucose (mg/dL)</Label>
                  <Input
                    id="glucose"
                    type="number"
                    placeholder="e.g. 110"
                    value={formData.glucose}
                    onChange={(e) => setFormData({ ...formData, glucose: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weight" className="text-xs font-medium">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 68.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Blood Pressure (mmHg)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Systolic (120)"
                    value={formData.systolic}
                    onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                    className="h-9 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Diastolic (80)"
                    value={formData.diastolic}
                    onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {formData.weight && (
                <div className="bg-primary/5 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Estimated BMI:</span>
                  <span className="font-semibold text-primary">{calculateBMI(parseFloat(formData.weight))}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-primary h-9 text-xs"
                  disabled={!formData.glucose && !formData.systolic && !formData.weight}
                >
                  Save Vitals
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleManualPredictClick}
                  disabled={riskData?.loading}
                  className="flex-1 border-primary text-primary hover:bg-primary/5 h-9 text-xs"
                >
                  {riskData?.loading ? 'Analyzing...' : 'Predict AI Risk'}
                </Button>
              </div>
            </form>
          </MedicalCardContent>
        </MedicalCard>

        {/* AI Risk Score Assessment Box */}
        {riskData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertBox
              type={riskData.level === 'low' ? 'success' : riskData.level === 'moderate' ? 'warning' : 'danger'}
              title={`Clinical Risk Assessment: ${riskData.level.toUpperCase()}`}
              message={`Calculated health risk score: ${riskData.score}%. Regular vitals monitoring and lifestyle moderation recommended.`}
            />
          </motion.div>
        )}

        {/* Analytics Tabs: 7 Days vs 30 Days */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as '7days' | '30days')} className="w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                Historical Analytics
              </span>
              <TabsList className="grid w-[180px] grid-cols-2 h-8">
                <TabsTrigger value="7days" className="text-xs">7 Days</TabsTrigger>
                <TabsTrigger value="30days" className="text-xs">30 Days</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="7days" className="mt-0">
              {renderTrendCharts(chartData7Days, '7-Day')}
            </TabsContent>
            
            <TabsContent value="30days" className="mt-0">
              {renderTrendCharts(chartData30Days, '30-Day')}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Vitals;