import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, GraduationCap, Calendar, MessageSquare, LogOut } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface PatientRequest {
  id: string;
  patient_id: string;
  request_type: string;
  description?: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    phone?: string;
  };
}

const AshaWorkerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { profile, ashaProfile, signOut } = useAuth();
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientRequests();
  }, []);

  const fetchPatientRequests = async () => {
    try {
      const { data } = await supabase
        .from('patient_requests')
        .select('*')
        .eq('asha_worker_id', profile?.user_id)
        .order('created_at', { ascending: false });

      if (data) {
        // Fetch patient profiles separately
        const patientIds = data.map(req => req.patient_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .in('user_id', patientIds);

        const requestsWithProfiles = data.map(request => ({
          ...request,
          profiles: profilesData?.find(p => p.user_id === request.patient_id)
        }));

        setRequests(requestsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      await supabase
        .from('patient_requests')
        .update({ status })
        .eq('id', requestId);

      // Refresh requests
      fetchPatientRequests();
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const acceptedRequests = requests.filter(req => req.status === 'accepted');
  const completedRequests = requests.filter(req => req.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              ASHA Worker Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {profile?.full_name}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pending Requests"
            value={pendingRequests.length.toString()}
            icon={MessageSquare}
            trend="neutral"
            trendValue="New requests"
          />
          <StatCard
            title="Active Cases"
            value={acceptedRequests.length.toString()}
            icon={Users}
            trend="neutral"
            trendValue="In progress"
          />
          <StatCard
            title="Completed"
            value={completedRequests.length.toString()}
            icon={Calendar}
            trend="neutral"
            trendValue="This month"
          />
          <StatCard
            title="Total Requests"
            value={requests.length.toString()}
            icon={MessageSquare}
            trend="neutral"
            trendValue="All time"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <Card className="shadow-medical border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                {profile?.phone && (
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                )}
              </div>

              {ashaProfile && (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">ID: {ashaProfile.worker_id}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{ashaProfile.experience_years} years experience</span>
                    </div>

                    {ashaProfile.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{ashaProfile.location}</span>
                      </div>
                    )}

                    {ashaProfile.qualification && (
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{ashaProfile.qualification}</span>
                      </div>
                    )}

                    {ashaProfile.specialization && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-foreground">Specialization:</p>
                        <p className="text-sm text-muted-foreground">{ashaProfile.specialization}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Patient Requests */}
          <div className="lg:col-span-2">
            <Card className="shadow-medical border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <MessageSquare className="h-5 w-5" />
                  Patient Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading requests...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No patient requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.slice(0, 10).map((request) => (
                      <div 
                        key={request.id}
                        className="border border-border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {request.profiles?.full_name || 'Unknown Patient'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {request.request_type}
                            </p>
                            {request.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {request.description}
                              </p>
                            )}
                            {request.profiles?.phone && (
                              <p className="text-sm text-muted-foreground">
                                📞 {request.profiles.phone}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant={
                              request.status === 'pending' ? 'destructive' :
                              request.status === 'accepted' ? 'default' : 'secondary'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>

                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRequestStatus(request.id, 'accepted')}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateRequestStatus(request.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}

                          {request.status === 'accepted' && (
                            <Button
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, 'completed')}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AshaWorkerDashboard;