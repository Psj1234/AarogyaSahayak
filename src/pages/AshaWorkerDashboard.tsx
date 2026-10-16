import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  MessageSquare, 
  LogOut, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Droplets, 
  Heart, 
  RefreshCw, 
  Loader2, 
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface PatientRequest {
  id: string;
  patient_id: string;
  request_type: string;
  description?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  profiles?: {
    full_name: string;
    phone?: string;
    email?: string;
  };
}

interface PatientLatestVital {
  id: string;
  patient_id: string;
  glucose: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  weight: number | null;
  bmi: number | null;
  risk_level: 'low' | 'moderate' | 'medium' | 'high' | null;
  created_at: string;
}

interface ActivePatientData {
  patientId: string;
  patientName: string;
  phone?: string;
  requestId: string;
  requestType: string;
  description?: string;
  acceptedAt: string;
  latestVital?: PatientLatestVital;
}

const AshaWorkerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { profile, ashaProfile, signOut } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [activePatients, setActivePatients] = useState<ActivePatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch all dashboard data (requests + active patient vitals)
  const fetchDashboardData = useCallback(async () => {
    if (!profile?.user_id) return;
    setLoading(true);
    try {
      // 1. Fetch all requests assigned to this ASHA worker
      const { data: requestsData, error: reqError } = await supabase
        .from('patient_requests')
        .select('*')
        .eq('asha_worker_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setActivePatients([]);
        setLoading(false);
        return;
      }

      // 2. Fetch patient profiles
      const patientIds = Array.from(new Set(requestsData.map(r => r.patient_id)));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email')
        .in('user_id', patientIds);

      const requestsWithProfiles: PatientRequest[] = requestsData.map(req => ({
        ...req,
        status: req.status as any,
        profiles: profilesData?.find(p => p.user_id === req.patient_id)
      }));

      setRequests(requestsWithProfiles);

      // 3. For accepted patients, fetch their latest vitals
      const acceptedReqs = requestsWithProfiles.filter(r => r.status === 'accepted');
      const acceptedPatientIds = Array.from(new Set(acceptedReqs.map(r => r.patient_id)));

      if (acceptedPatientIds.length > 0) {
        const { data: vitalsData, error: vitalsError } = await supabase
          .from('vitals')
          .select('*')
          .in('patient_id', acceptedPatientIds)
          .order('created_at', { ascending: false });

        if (vitalsError) {
          console.error('Error fetching patient vitals:', vitalsError);
        }

        // Map latest vital per accepted patient
        const activeMapped: ActivePatientData[] = acceptedReqs.map(req => {
          const patientVitals = vitalsData?.filter(v => v.patient_id === req.patient_id) || [];
          const latest = patientVitals[0]; // First item is newest due to order desc

          return {
            patientId: req.patient_id,
            patientName: req.profiles?.full_name || 'Patient',
            phone: req.profiles?.phone,
            requestId: req.id,
            requestType: req.request_type,
            description: req.description || undefined,
            acceptedAt: req.created_at,
            latestVital: latest ? {
              id: latest.id,
              patient_id: latest.patient_id,
              glucose: latest.glucose != null ? Number(latest.glucose) : null,
              systolic_bp: latest.systolic_bp != null ? Number(latest.systolic_bp) : null,
              diastolic_bp: latest.diastolic_bp != null ? Number(latest.diastolic_bp) : null,
              weight: latest.weight != null ? Number(latest.weight) : null,
              bmi: latest.bmi != null ? Number(latest.bmi) : null,
              risk_level: latest.risk_level as any,
              created_at: latest.created_at
            } : undefined
          };
        });

        // Clinical Triage Sorting: High risk patients displayed first
        activeMapped.sort((a, b) => {
          const getPriority = (p: ActivePatientData) => {
            const r = p.latestVital?.risk_level;
            if (r === 'high') return 3;
            if (r === 'moderate' || r === 'medium') return 2;
            if (r === 'low') return 1;
            return 0;
          };
          return getPriority(b) - getPriority(a);
        });

        setActivePatients(activeMapped);
      } else {
        setActivePatients([]);
      }
    } catch (err: any) {
      console.error('Error loading ASHA dashboard data:', err);
      toast({
        title: 'Dashboard Sync Error',
        description: err.message || 'Could not refresh patient requests.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, toast]);

  useEffect(() => {
    if (profile?.user_id) {
      fetchDashboardData();
    }
  }, [profile?.user_id, fetchDashboardData]);

  // Update request status (Accept / Reject / Complete)
  const updateRequestStatus = async (requestId: string, newStatus: 'accepted' | 'rejected' | 'completed') => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from('patient_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: `Request ${newStatus.toUpperCase()}`,
        description: newStatus === 'accepted'
          ? 'Patient has been added to your Active Monitoring list.'
          : newStatus === 'rejected'
          ? 'Request has been declined.'
          : 'Consultation marked as completed.'
      });

      // Refresh list
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({
        title: 'Status Update Failed',
        description: err.message || 'Could not update request status.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const acceptedRequests = requests.filter(req => req.status === 'accepted');
  const completedRequests = requests.filter(req => req.status === 'completed');
  const highRiskPatientsCount = activePatients.filter(p => p.latestVital?.risk_level === 'high').length;

  const renderRiskBadge = (riskLevel?: string | null) => {
    if (riskLevel === 'high') {
      return (
        <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20 gap-1 text-xs">
          <AlertTriangle className="h-3 w-3" />
          High Risk Alert
        </Badge>
      );
    }
    if (riskLevel === 'moderate' || riskLevel === 'medium') {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 gap-1 text-xs">
          <Activity className="h-3 w-3" />
          Moderate Risk
        </Badge>
      );
    }
    if (riskLevel === 'low') {
      return (
        <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20 gap-1 text-xs">
          <CheckCircle2 className="h-3 w-3" />
          Stable / Low Risk
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
        <Clock className="h-3 w-3" />
        No Vitals Logged
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                ASHA Patient Monitoring Dashboard
              </h1>
              <Badge variant="secondary" className="gap-1 text-xs">
                <ShieldCheck className="h-3 w-3 text-primary" /> Verified Worker
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Welcome back, <span className="font-semibold text-foreground">{profile?.full_name}</span> • Community Health Hub
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="h-9 gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={signOut}
              className="h-9 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Top Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Pending Requests"
            value={pendingRequests.length.toString()}
            icon={MessageSquare}
            variant={pendingRequests.length > 0 ? "warning" : "default"}
            subtitle="Needs review"
          />
          <StatCard
            title="Active Patients"
            value={acceptedRequests.length.toString()}
            icon={Users}
            variant="default"
            subtitle="Under care"
          />
          <StatCard
            title="High Risk Alerts"
            value={highRiskPatientsCount.toString()}
            icon={AlertTriangle}
            variant={highRiskPatientsCount > 0 ? "danger" : "success"}
            subtitle="Immediate priority"
          />
          <StatCard
            title="Completed Cases"
            value={completedRequests.length.toString()}
            icon={Calendar}
            variant="success"
            subtitle="All time"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Worker Profile Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-medical border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                  <Users className="h-4 w-4" />
                  ASHA Profile Card
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground text-base">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  {profile?.phone && (
                    <p className="text-xs text-muted-foreground mt-0.5">📞 {profile.phone}</p>
                  )}
                </div>

                {ashaProfile && (
                  <div className="pt-2 border-t border-border/40 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Worker ID:</span>
                      <Badge variant="outline" className="font-mono">{ashaProfile.worker_id}</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{ashaProfile.experience_years} Years Experience</span>
                    </div>

                    {ashaProfile.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{ashaProfile.location}</span>
                      </div>
                    )}

                    {ashaProfile.qualification && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5 text-primary" />
                        <span>{ashaProfile.qualification}</span>
                      </div>
                    )}

                    {ashaProfile.specialization && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-foreground">Specialization:</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ashaProfile.specialization}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clinical Triage Guide */}
            <Card className="shadow-card border-border/50 bg-accent/20">
              <CardContent className="p-4 space-y-2.5">
                <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Remote Triage Protocol
                </h4>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                    <span><strong>High Risk:</strong> Glucose &ge;180 or BP &ge;140 mmHg. Call patient immediately.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span><strong>Moderate:</strong> Elevated readings. Follow up within 24-48 hours.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success flex-shrink-0" />
                    <span><strong>Stable:</strong> Normal parameters. Maintain regular check-ins.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs (Active Patients vs Pending Requests) */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="active" className="text-xs gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Active Patients ({acceptedRequests.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Pending ({pendingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed ({completedRequests.length})
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: REMOTE VITALS MONITORING (Active Patients) */}
              <TabsContent value="active" className="mt-4 space-y-4">
                <Card className="shadow-medical border-border/50">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base text-foreground flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Live Remote Vitals Monitoring
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Real-time clinical metrics of accepted patients, prioritized by AI risk score
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Loading active patient vitals...</p>
                      </div>
                    ) : activePatients.length === 0 ? (
                      <div className="text-center py-12 space-y-2">
                        <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-sm font-medium text-foreground">No active patients under monitoring</p>
                        <p className="text-xs text-muted-foreground">
                          Accept incoming patient requests in the "Pending" tab to begin vitals tracking.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activePatients.map((patient) => {
                          const isHighRisk = patient.latestVital?.risk_level === 'high';

                          return (
                            <div 
                              key={patient.requestId}
                              className={`border rounded-xl p-4 transition-all ${
                                isHighRisk 
                                  ? 'border-destructive/40 bg-destructive/5' 
                                  : 'border-border/60 bg-card hover:border-primary/30'
                              }`}
                            >
                              {/* Patient Header & Status */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-base text-foreground">
                                      {patient.patientName}
                                    </h4>
                                    {renderRiskBadge(patient.latestVital?.risk_level)}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Condition / Reason: <span className="text-foreground font-medium">{patient.requestType}</span>
                                    {patient.description && ` — "${patient.description}"`}
                                  </p>
                                </div>

                                {/* Patient Quick Actions */}
                                <div className="flex items-center gap-2">
                                  {patient.phone && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      asChild
                                      className="h-8 text-xs border-primary text-primary hover:bg-primary/5"
                                    >
                                      <a href={`tel:${patient.phone}`}>
                                        <Phone className="h-3.5 w-3.5 mr-1" />
                                        Call ({patient.phone})
                                      </a>
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionLoading === patient.requestId}
                                    onClick={() => updateRequestStatus(patient.requestId, 'completed')}
                                    className="h-8 text-xs hover:bg-success/10 hover:text-success"
                                  >
                                    {actionLoading === patient.requestId ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 mr-1" />
                                    )}
                                    Complete
                                  </Button>
                                </div>
                              </div>

                              {/* Live Metrics Grid */}
                              <div className="pt-3">
                                {patient.latestVital ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {/* Glucose */}
                                    <div className="bg-background/80 rounded-lg p-2.5 border border-border/40">
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                        <Droplets className="h-3.5 w-3.5 text-blue-500" />
                                        <span>Blood Glucose</span>
                                      </div>
                                      <p className="text-base font-bold text-foreground">
                                        {patient.latestVital.glucose != null ? `${patient.latestVital.glucose} mg/dL` : '—'}
                                      </p>
                                      <span className="text-[10px] text-muted-foreground">
                                        {patient.latestVital.glucose && patient.latestVital.glucose > 140 
                                          ? '⚠️ Elevated' 
                                          : 'Target: 80-130'}
                                      </span>
                                    </div>

                                    {/* Blood Pressure */}
                                    <div className="bg-background/80 rounded-lg p-2.5 border border-border/40">
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                        <Heart className="h-3.5 w-3.5 text-green-500" />
                                        <span>Blood Pressure</span>
                                      </div>
                                      <p className="text-base font-bold text-foreground">
                                        {patient.latestVital.systolic_bp && patient.latestVital.diastolic_bp
                                          ? `${patient.latestVital.systolic_bp}/${patient.latestVital.diastolic_bp}`
                                          : '—'}
                                        <span className="text-xs font-normal text-muted-foreground ml-1">mmHg</span>
                                      </p>
                                      <span className="text-[10px] text-muted-foreground">
                                        {patient.latestVital.systolic_bp && patient.latestVital.systolic_bp > 130 
                                          ? '⚠️ Hypertensive' 
                                          : 'Target: <120/80'}
                                      </span>
                                    </div>

                                    {/* Weight & BMI */}
                                    <div className="bg-background/80 rounded-lg p-2.5 border border-border/40">
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                        <Activity className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Weight / BMI</span>
                                      </div>
                                      <p className="text-base font-bold text-foreground">
                                        {patient.latestVital.weight ? `${patient.latestVital.weight} kg` : '—'}
                                        {patient.latestVital.bmi && (
                                          <span className="text-xs text-muted-foreground ml-1">({patient.latestVital.bmi} BMI)</span>
                                        )}
                                      </p>
                                      <span className="text-[10px] text-muted-foreground">
                                        {patient.latestVital.bmi && patient.latestVital.bmi >= 25 ? 'Overweight' : 'Normal range'}
                                      </span>
                                    </div>

                                    {/* Log Timestamp */}
                                    <div className="bg-background/80 rounded-lg p-2.5 border border-border/40">
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                        <span>Last Recorded</span>
                                      </div>
                                      <p className="text-xs font-semibold text-foreground truncate">
                                        {new Date(patient.latestVital.created_at).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                      <span className="text-[10px] text-muted-foreground">Synced to cloud</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-accent/30 rounded-lg p-3 text-xs text-muted-foreground flex items-center justify-between">
                                    <span>No vital records logged yet by this citizen.</span>
                                    <span className="italic">Advise patient to log measurements in their Aarogya portal.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: PENDING PATIENT REQUESTS */}
              <TabsContent value="pending" className="mt-4 space-y-4">
                <Card className="shadow-medical border-border/50">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Pending Consultation Requests
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        New consultation requests from citizens seeking your healthcare guidance
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Loading pending requests...</p>
                      </div>
                    ) : pendingRequests.length === 0 ? (
                      <div className="text-center py-12 space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-success/60 mx-auto" />
                        <p className="text-sm font-medium text-foreground">No pending requests</p>
                        <p className="text-xs text-muted-foreground">
                          All incoming citizen requests have been reviewed.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="border border-border/70 rounded-xl p-4 bg-card hover:border-primary/40 transition-colors space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-foreground text-sm">
                                    {req.profiles?.full_name || 'Patient'}
                                  </h4>
                                  <Badge variant="outline" className="text-[10px]">
                                    {req.request_type}
                                  </Badge>
                                </div>
                                {req.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    "{req.description}"
                                  </p>
                                )}
                                {req.profiles?.phone && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    📞 {req.profiles.phone}
                                  </p>
                                )}
                              </div>

                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                Received: {new Date(req.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Accept / Reject Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionLoading === req.id}
                                onClick={() => updateRequestStatus(req.id, 'rejected')}
                                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                disabled={actionLoading === req.id}
                                onClick={() => updateRequestStatus(req.id, 'accepted')}
                                className="bg-gradient-primary h-8 text-xs"
                              >
                                {actionLoading === req.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                )}
                                Accept Patient
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: COMPLETED CASES ARCHIVE */}
              <TabsContent value="completed" className="mt-4 space-y-4">
                <Card className="shadow-medical border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Completed Consultations
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Archive of resolved citizen cases and completed follow-ups
                    </p>
                  </CardHeader>
                  <CardContent>
                    {completedRequests.length === 0 ? (
                      <div className="text-center py-10 space-y-1">
                        <p className="text-sm text-muted-foreground">No completed cases recorded yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {completedRequests.map((req) => (
                          <div 
                            key={req.id} 
                            className="p-3 rounded-lg border border-border/40 bg-accent/10 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-foreground">{req.profiles?.full_name || 'Patient'}</p>
                              <p className="text-muted-foreground">{req.request_type} {req.description && `• ${req.description}`}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-[10px]">Resolved</Badge>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AshaWorkerDashboard;