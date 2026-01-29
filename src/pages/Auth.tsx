import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Users } from 'lucide-react';

const Auth: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'patient' as 'patient' | 'asha_worker',
    // ASHA worker specific fields
    workerId: '',
    experienceYears: '',
    specialization: '',
    location: '',
    qualification: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Login Successful',
          description: 'Welcome back!'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupData.fullName,
            role: signupData.role,
            phone: signupData.phone
          }
        }
      });

      if (error) {
        toast({
          title: 'Signup Failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        // If ASHA worker, create ASHA profile
        if (signupData.role === 'asha_worker') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('asha_profiles').insert({
              user_id: user.id,
              worker_id: signupData.workerId,
              experience_years: parseInt(signupData.experienceYears) || 0,
              specialization: signupData.specialization,
              location: signupData.location,
              qualification: signupData.qualification
            });
          }
        }

        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-3xl font-bold text-foreground">
              Aarogya Sahayak
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your Health Companion
          </p>
        </div>

        <Card className="shadow-medical border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-primary">
              Welcome
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary text-white"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">I am a:</Label>
                    <Select
                      value={signupData.role}
                      onValueChange={(value: 'patient' | 'asha_worker') => 
                        setSignupData(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 mr-2" />
                            Patient
                          </div>
                        </SelectItem>
                        <SelectItem value="asha_worker">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            ASHA Worker
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={signupData.phone}
                      onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  {signupData.role === 'asha_worker' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="worker-id">Worker ID</Label>
                        <Input
                          id="worker-id"
                          type="text"
                          value={signupData.workerId}
                          onChange={(e) => setSignupData(prev => ({ ...prev, workerId: e.target.value }))}
                          placeholder="ASHA001"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="experience">Experience (Years)</Label>
                          <Input
                            id="experience"
                            type="number"
                            value={signupData.experienceYears}
                            onChange={(e) => setSignupData(prev => ({ ...prev, experienceYears: e.target.value }))}
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            type="text"
                            value={signupData.location}
                            onChange={(e) => setSignupData(prev => ({ ...prev, location: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          type="text"
                          value={signupData.specialization}
                          onChange={(e) => setSignupData(prev => ({ ...prev, specialization: e.target.value }))}
                          placeholder="Maternal Health, Child Care, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="qualification">Qualification</Label>
                        <Input
                          id="qualification"
                          type="text"
                          value={signupData.qualification}
                          onChange={(e) => setSignupData(prev => ({ ...prev, qualification: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary text-white"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;