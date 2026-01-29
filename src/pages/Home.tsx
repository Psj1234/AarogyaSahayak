import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Bell, 
  Users, 
  BookOpen, 
  ArrowRight,
  Heart,
  Shield,
  Smartphone,
  Zap,
  Award,
  CheckCircle
} from 'lucide-react';
import { MedicalCard, MedicalCardContent, MedicalCardDescription, MedicalCardHeader, MedicalCardTitle } from '@/components/ui/medical-card';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/healthcare-hero.jpg';

const Home = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t('home.features.vitals.title'),
      description: t('home.features.vitals.desc'),
      icon: Activity,
      link: '/vitals',
      gradient: 'from-blue-500/15 to-blue-600/5',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30'
    },
    {
      title: t('home.features.reminders.title'),
      description: t('home.features.reminders.desc'),
      icon: Bell,
      link: '/reminders',
      gradient: 'from-amber-500/15 to-amber-600/5',
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30'
    },
    {
      title: t('home.features.connect.title'),
      description: t('home.features.connect.desc'),
      icon: Users,
      link: '/connect',
      gradient: 'from-green-500/15 to-green-600/5',
      iconColor: 'text-green-600',  
      bgColor: 'bg-green-50 dark:bg-green-950/30'
    },
    {
      title: t('home.features.feed.title'),
      description: t('home.features.feed.desc'),
      icon: BookOpen,
      link: '/feed',
      gradient: 'from-purple-500/15 to-purple-600/5',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Quick Access",
      description: "Instant access to your health data"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health data is encrypted and secure"
    },
    {
      icon: Award,
      title: "Expert Approved",
      description: "Validated by healthcare professionals"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const floatAnimation = {
    y: [-5, 5, -5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Enhanced Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden bg-gradient-hero min-h-screen flex items-center"
      >
        {/* Background Image with Enhanced Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Modern healthcare technology with diverse patients and medical professionals collaborating"
            className="w-full h-full object-cover opacity-25"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-hero/85" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-center text-white max-w-5xl mx-auto"
          >
            <motion.div
              animate={floatAnimation}
              className="flex justify-center mb-8"
            >
              <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 shadow-glow">
                <Heart className="h-16 w-16 text-white" aria-hidden="true" />
              </div>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-nunito mb-8 leading-tight">
              <span className="block">{t('home.title')}</span>
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="block text-white/90 text-3xl md:text-4xl mt-4"
              >
                Your Health, Our Priority
              </motion.span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 opacity-95 leading-relaxed max-w-3xl mx-auto font-medium">
              {t('home.subtitle')}
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                asChild 
                variant="premium"
                size="xl" 
                className="group hover-glow"
                aria-label="Get started with Aarogya Spark health management"
              >
                <Link to="/onboarding" className="flex items-center gap-3">
                  {t('home.getStarted')}
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="xl"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                <Link to="/vitals" className="flex items-center gap-3">
                  <Activity className="h-6 w-6" />
                  Track Vitals
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/50 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Enhanced Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-16"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 rounded-3xl p-4 shadow-medical">
                <Shield className="h-10 w-10 text-primary" aria-hidden="true" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-nunito text-foreground mb-6">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive health management tools designed for your wellness journey with cutting-edge technology
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group"
              >
                <MedicalCard className="h-full feature-card hover-glow">
                  <Link to={feature.link} className="block h-full p-8" aria-label={`Navigate to ${feature.title}`}>
                    <MedicalCardHeader className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`rounded-2xl p-4 ${feature.bgColor} border border-border/30 group-hover:scale-110 transition-transform duration-300`}>
                          <feature.icon className={`h-8 w-8 ${feature.iconColor}`} aria-hidden="true" />
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-300" />
                      </div>
                      <MedicalCardTitle className="text-2xl mb-3 group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </MedicalCardTitle>
                      <MedicalCardDescription className="text-lg leading-relaxed text-muted-foreground">
                        {feature.description}
                      </MedicalCardDescription>
                    </MedicalCardHeader>
                  </Link>
                </MedicalCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                className="text-center p-6 hover-scale"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 shadow-medical">
                  <benefit.icon className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Bottom CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="py-20 px-4 bg-gradient-card relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-primary/10 rounded-3xl p-6 shadow-float">
              <Smartphone className="h-12 w-12 text-primary" aria-hidden="true" />
            </div>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold font-nunito text-foreground mb-6">
            Ready to Transform Your Health Journey?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of users who trust Aarogya Spark for their health management needs
          </p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Button 
              asChild 
              variant="premium"
              size="lg" 
              className="group"
              aria-label="Start tracking your vital signs"
            >
              <Link to="/vitals" className="flex items-center gap-3">
                <Activity className="h-5 w-5" />
                {t('vitals.log')}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button 
              asChild 
              variant="outline" 
              size="lg"
              aria-label="Learn more about our features"
            >
              <Link to="/feed" className="flex items-center gap-3">
                <BookOpen className="h-5 w-5" />
                Learn More
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex justify-center items-center gap-8 mt-12 pt-8 border-t border-border/50"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-medium">Secure & Private</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-medium">Expert Approved</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-medium">Always Free</span>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;