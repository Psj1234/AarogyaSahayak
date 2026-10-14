import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, MessageCircle, MapPin, Star, Clock, Loader2, AlertCircle, RefreshCw, Send, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface DisplayWorker {
  id: string;
  userId: string;
  workerId: string;
  name: string;
  role: string;
  phone: string;
  location: string;
  experience: string;
  rating: number;
  status: 'available' | 'busy' | 'offline';
  avatar: string;
  languages: string[];
  specialties: string[];
  isVerified: boolean;
}

// Fallback demo workers if database has no registered ASHA workers yet
const FALLBACK_WORKERS: DisplayWorker[] = [
  {
    id: 'demo-1',
    userId: 'demo-user-1',
    workerId: 'ASHA-101',
    name: 'Priya Sharma',
    role: 'Senior ASHA Worker',
    phone: '+91 98765 43210',
    location: 'Sector 15, Noida',
    experience: '8 years',
    rating: 4.8,
    status: 'available',
    avatar: '',
    languages: ['Hindi', 'English'],
    specialties: ['Maternal Health', 'Child Care', 'Diabetes Management'],
    isVerified: true
  },
  {
    id: 'demo-2',
    userId: 'demo-user-2',
    workerId: 'ASHA-102',
    name: 'Sunita Devi',
    role: 'Community Health Worker',
    phone: '+91 87654 32109',
    location: 'Block A, Ghaziabad',
    experience: '5 years',
    rating: 4.6,
    status: 'available',
    avatar: '',
    languages: ['Hindi', 'Urdu'],
    specialties: ['Hypertension', 'General Health', 'Vaccination'],
    isVerified: true
  }
];

const HealthWorkerConnect: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [workers, setWorkers] = useState<DisplayWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveDatabase, setIsLiveDatabase] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState<DisplayWorker | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState('consultation');
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      // 1. Fetch all ASHA profiles from Supabase
      const { data: ashaData, error: ashaError } = await supabase
        .from('asha_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (ashaError) {
        console.error('Error fetching ASHA profiles:', ashaError);
        setWorkers(FALLBACK_WORKERS);
        setIsLiveDatabase(false);
        return;
      }

      if (ashaData && ashaData.length > 0) {
        // 2. Fetch corresponding profiles for basic details
        const userIds = ashaData.map(item => item.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, email')
          .in('user_id', userIds);

        const mappedWorkers: DisplayWorker[] = ashaData.map((asha, index) => {
          const profile = profilesData?.find(p => p.user_id === asha.user_id);
          const specialties = asha.specialization
            ? asha.specialization.split(',').map(s => s.trim())
            : ['General Healthcare', 'Maternal Health'];

          return {
            id: asha.id,
            userId: asha.user_id,
            workerId: asha.worker_id,
            name: profile?.full_name || `ASHA Worker (${asha.worker_id})`,
            role: asha.qualification || 'Certified ASHA Worker',
            phone: profile?.phone || '+91 98765 00000',
            location: asha.location || 'Local PHC',
            experience: `${asha.experience_years || 2} years`,
            rating: 4.8,
            status: 'available',
            avatar: '',
            languages: ['Hindi', 'English'],
            specialties,
            isVerified: asha.is_verified ?? true
          };
        });

        setWorkers(mappedWorkers);
        setIsLiveDatabase(true);
      } else {
        // No live workers in fresh database yet; fallback gracefully
        setWorkers(FALLBACK_WORKERS);
        setIsLiveDatabase(false);
      }
    } catch (err) {
      console.error('Failed to load workers:', err);
      setWorkers(FALLBACK_WORKERS);
      setIsLiveDatabase(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success text-success-foreground';
      case 'busy': return 'bg-warning text-warning-foreground';
      case 'offline': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return t('connect.available') || 'Available';
      case 'busy': return t('connect.busy') || 'Busy';
      case 'offline': return t('connect.offline') || 'Offline';
      default: return status;
    }
  };

  const handleCall = (phone: string, name: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleOpenRequestDialog = (worker: DisplayWorker) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to connect with an ASHA worker.',
        variant: 'destructive'
      });
      return;
    }

    setSelectedWorker(worker);
    setMessage('');
    setRequestType('consultation');
    setMessageDialogOpen(true);
  };

  const handleSendRequest = async () => {
    if (!selectedWorker || !user) return;
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please describe the reason for your consultation request.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Direct insertion into patient_requests table
      const { error } = await supabase
        .from('patient_requests')
        .insert({
          patient_id: user.id,
          asha_worker_id: selectedWorker.userId,
          request_type: requestType,
          description: message.trim(),
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Request Submitted!',
        description: `Your request has been sent to ${selectedWorker.name}. They will review it in their dashboard.`,
      });

      setMessage('');
      setMessageDialogOpen(false);
      setSelectedWorker(null);
    } catch (err: any) {
      console.error('Error submitting patient request:', err);
      toast({
        title: 'Request Failed',
        description: err.message || 'Could not send request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">
              {t('connect.title') || 'Connect with ASHA Workers'}
            </h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={fetchWorkers}
              disabled={loading}
              title="Refresh ASHA directory"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('connect.subtitle') || 'Get health guidance from verified community workers'}
          </p>
          {isLiveDatabase && (
            <Badge variant="outline" className="mt-2 text-xs text-primary border-primary/30">
              <UserCheck className="h-3 w-3 mr-1" /> Live Directory Connected
            </Badge>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading verified health workers...</p>
          </div>
        ) : (
          /* ASHA Workers List */
          <div className="space-y-4">
            {workers.map((worker) => (
              <Card key={worker.id} className="shadow-medical border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <Avatar className="w-16 h-16 border-2 border-primary/20">
                      <AvatarImage src={worker.avatar} alt={worker.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Worker Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-semibold text-foreground text-base leading-tight">
                            {worker.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {worker.role} {worker.workerId && `• ID: ${worker.workerId}`}
                          </p>
                        </div>
                        <Badge className={getStatusColor(worker.status)}>
                          {getStatusText(worker.status)}
                        </Badge>
                      </div>

                      {/* Location & Experience */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground my-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[110px]">{worker.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{worker.experience}</span>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="text-xs font-semibold">{worker.rating}</span>
                        <span className="text-[11px] text-muted-foreground">(Verified)</span>
                      </div>

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {worker.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-[10px] py-0 px-1.5">
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCall(worker.phone, worker.name)}
                          disabled={worker.status === 'offline'}
                          className="flex-1 bg-gradient-primary h-8 text-xs"
                          size="sm"
                        >
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          {t('connect.call') || 'Call'}
                        </Button>
                        <Button
                          onClick={() => handleOpenRequestDialog(worker)}
                          variant="outline"
                          className="flex-1 border-primary text-primary hover:bg-primary/5 h-8 text-xs"
                          size="sm"
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1" />
                          {t('connect.message') || 'Request'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Message / Request Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-primary flex items-center gap-2">
                <Send className="h-5 w-5" />
                Request Consultation with {selectedWorker?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Your request will be delivered directly to the health worker's dashboard.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="request-type" className="text-xs font-medium">Consultation Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger id="request-type" className="h-9 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">General Consultation</SelectItem>
                    <SelectItem value="maternal">Maternal & Child Health</SelectItem>
                    <SelectItem value="diabetes">Diabetes & Glucose Check</SelectItem>
                    <SelectItem value="hypertension">Blood Pressure Review</SelectItem>
                    <SelectItem value="vaccination">Vaccination / Immunization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="request-message" className="text-xs font-medium">Your Message / Symptoms</Label>
                <Textarea
                  id="request-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your symptoms or questions for the ASHA worker..."
                  className="min-h-[110px] text-xs border-input focus:border-primary"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMessageDialogOpen(false)}
                  disabled={submitting}
                  className="flex-1 h-9 text-xs"
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button 
                  onClick={handleSendRequest} 
                  disabled={!message.trim() || submitting}
                  className="flex-1 bg-gradient-primary h-9 text-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Send Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 24/7 Information Card */}
        <Card className="shadow-card border-border/50 bg-accent/30">
          <CardContent className="p-4">
            <div className="text-center">
              <h4 className="font-medium text-foreground mb-1 text-sm">
                24/7 Community Healthcare
              </h4>
              <p className="text-xs text-muted-foreground">
                Our certified ASHA workers provide expert guidance, preventive care, and doorstep support in your local language.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthWorkerConnect;