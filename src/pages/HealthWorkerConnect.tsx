import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, MessageCircle, MapPin, Star, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ASHAWorker {
  id: string;
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
}

const HealthWorkerConnect: React.FC = () => {
  const { t } = useTranslation();
  const [selectedWorker, setSelectedWorker] = useState<ASHAWorker | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Mock ASHA workers data
  const ashaWorkers: ASHAWorker[] = [
    {
      id: '1',
      name: 'Priya Sharma',
      role: 'Senior ASHA Worker',
      phone: '+91 98765 43210',
      location: 'Sector 15, Noida',
      experience: '8 years',
      rating: 4.8,
      status: 'available',
      avatar: '/api/placeholder/150/150',
      languages: ['Hindi', 'English'],
      specialties: ['Maternal Health', 'Child Care', 'Diabetes Management']
    },
    {
      id: '2',
      name: 'Sunita Devi',
      role: 'Community Health Worker',
      phone: '+91 87654 32109',
      location: 'Block A, Ghaziabad',
      experience: '5 years',
      rating: 4.6,
      status: 'busy',
      avatar: '/api/placeholder/150/150',
      languages: ['Hindi', 'Urdu'],
      specialties: ['Hypertension', 'General Health', 'Vaccination']
    },
    {
      id: '3',
      name: 'Meera Singh',
      role: 'ASHA Facilitator',
      phone: '+91 76543 21098',
      location: 'Village Khoda, Greater Noida',
      experience: '12 years',
      rating: 4.9,
      status: 'available',
      avatar: '/api/placeholder/150/150',
      languages: ['Hindi', 'English', 'Punjabi'],
      specialties: ['Family Planning', 'Nutrition', 'Mental Health']
    },
    {
      id: '4',
      name: 'Kavita Kumari',
      role: 'Health Assistant',
      phone: '+91 65432 10987',
      location: 'Indirapuram, Ghaziabad',
      experience: '3 years',
      rating: 4.4,
      status: 'offline',
      avatar: '/api/placeholder/150/150',
      languages: ['Hindi'],
      specialties: ['Basic Health Check', 'Medicine Distribution']
    }
  ];

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
      case 'available': return t('connect.available');
      case 'busy': return t('connect.busy');
      case 'offline': return t('connect.offline');
      default: return status;
    }
  };

  const handleCall = (phone: string, name: string) => {
    // Create tel: link for calling
    window.location.href = `tel:${phone}`;
    
    // TODO: Track call analytics
    console.log(`Calling ${name} at ${phone}`);
  };

  const handleMessage = (worker: ASHAWorker) => {
    setSelectedWorker(worker);
    setMessageDialogOpen(true);
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedWorker) return;
    
    // TODO: Implement actual messaging system
    console.log(`Sending message to ${selectedWorker.name}: ${message}`);
    
    // For demo, just show success
    alert(`Message sent to ${selectedWorker.name}!`);
    setMessage('');
    setMessageDialogOpen(false);
    setSelectedWorker(null);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('connect.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('connect.subtitle')}
          </p>
        </div>

        {/* ASHA Workers List */}
        <div className="space-y-4">
          {ashaWorkers.map((worker) => (
            <Card key={worker.id} className="shadow-medical border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={worker.avatar} alt={worker.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {worker.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  {/* Worker Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {worker.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {worker.role}
                        </p>
                      </div>
                      <Badge className={getStatusColor(worker.status)}>
                        {getStatusText(worker.status)}
                      </Badge>
                    </div>

                    {/* Location & Experience */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{worker.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{worker.experience}</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm font-medium">{worker.rating}</span>
                      <span className="text-sm text-muted-foreground">rating</span>
                    </div>

                    {/* Languages */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {worker.languages.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {worker.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCall(worker.phone, worker.name)}
                        disabled={worker.status === 'offline'}
                        className="flex-1 bg-gradient-primary"
                        size="sm"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {t('connect.call')}
                      </Button>
                      <Button
                        onClick={() => handleMessage(worker)}
                        disabled={worker.status === 'offline'}
                        variant="outline"
                        className="flex-1 border-primary text-primary hover:bg-primary/5"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {t('connect.message')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Message Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-primary">
                Send Message to {selectedWorker?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-accent/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {/* TODO: Implement real-time messaging */}
                  This is a demo message interface. In production, this would connect to a real messaging system.
                </p>
              </div>
              
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[100px] border-input focus:border-primary"
              />
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMessageDialogOpen(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  onClick={sendMessage} 
                  disabled={!message.trim()}
                  className="flex-1 bg-gradient-primary"
                >
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Information Card */}
        <Card className="shadow-card border-border/50 bg-accent/30">
          <CardContent className="p-4">
            <div className="text-center">
              <h4 className="font-medium text-foreground mb-2">
                24/7 Health Support
              </h4>
              <p className="text-sm text-muted-foreground">
                Our certified ASHA workers are here to provide you with expert health guidance and support in your preferred language.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthWorkerConnect;