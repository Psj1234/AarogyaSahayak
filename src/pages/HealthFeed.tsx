import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Volume2, Heart, Utensils, Dumbbell, Info, VolumeX, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface HealthContent {
  id: string;
  title: string;
  content: string;
  category: 'diet' | 'exercise' | 'tips';
  audioUrl?: string;
  duration?: string;
  image?: string;
  tags: string[];
  readTime: string;
}

const HealthFeed: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playbackType, setPlaybackType] = useState<'stream' | 'speech' | null>(null);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop any active audio / speech playback
  const stopAllPlayback = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingAudio(null);
    setPlaybackType(null);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, []);

  // Health content data localized
  const healthContent: HealthContent[] = [
    {
      id: '1',
      title: i18n.language === 'hi' ? 'मधुमेह के लिए स्वस्थ आहार' : 'Healthy Diet for Diabetes',
      content: i18n.language === 'hi' 
        ? 'मधुमेह को नियंत्रित करने के लिए संतुलित आहार बहुत महत्वपूर्ण है। साबुत अनाज, दालें, और हरी पत्तेदार सब्जियां शामिल करें। मीठी चीजों और तले हुए भोजन से बचें। समय पर भोजन करें।'
        : 'A balanced diet is crucial for managing diabetes. Include whole grains, lean proteins, and fiber-rich vegetables. Avoid sugary and processed foods. Monitor portion sizes and eat at regular intervals.',
      category: 'diet',
      duration: '1:45',
      tags: ['Diabetes', 'Nutrition', 'Blood Sugar'],
      readTime: '2 min',
      audioUrl: '/demo-audio-diet.mp3'
    },
    {
      id: '2',
      title: i18n.language === 'hi' ? 'उच्च रक्तचाप के लिए व्यायाम' : 'Exercise for High Blood Pressure',
      content: i18n.language === 'hi'
        ? 'नियमित व्यायाम रक्तचाप को सामान्य रखने में मदद करता है। दिन में 30 मिनट तेज गति से चलें, योग करें या प्राणायाम करें। अधिक तनाव से बचें और पर्याप्त नींद लें।'
        : 'Regular exercise helps lower blood pressure. Aim for 30 minutes of brisk walking, swimming, or cycling daily. Start slowly and gradually increase intensity based on your fitness level.',
      category: 'exercise',
      duration: '2:10',
      tags: ['Hypertension', 'Cardio', 'Fitness'],
      readTime: '3 min',
      audioUrl: '/demo-audio-exercise.mp3'
    },
    {
      id: '3',
      title: i18n.language === 'hi' ? 'दवाइयों को समय पर लेने के फायदे' : 'Benefits of Taking Medications on Time',
      content: i18n.language === 'hi'
        ? 'दवाइयों को डॉक्टर के परामर्श अनुसार सही समय पर लेना आवश्यक है। इससे रक्तचाप और शुगर का स्तर स्थिर रहता है। अपने मोबाइल में रिमाइंडर लगाएं ताकि खुराक न छूटे।'
        : 'Taking medications at prescribed times is crucial for effectiveness. It maintains proper drug levels in your body and reduces side effects. Set reminders and use a medication calendar.',
      category: 'tips',
      duration: '1:30',
      tags: ['Medication', 'Adherence', 'Health Management'],
      readTime: '2 min',
      audioUrl: '/demo-audio-tips.mp3'
    },
    {
      id: '4',
      title: i18n.language === 'hi' ? 'हाइड्रेशन और पानी का महत्व' : 'Importance of Staying Hydrated',
      content: i18n.language === 'hi'
        ? 'पर्याप्त पानी पीना शरीर के तापमान को नियंत्रित करता है, पाचन क्रिया सुधारता है और गुर्दों को स्वस्थ रखता है। प्रतिदिन 8 से 10 गिलास पानी अवश्य पिएं।'
        : 'Adequate water intake is essential for health. It regulates body temperature, lubricates joints, and helps transport nutrients. Aim for 8-10 glasses daily.',
      category: 'tips',
      duration: '1:20',
      tags: ['Hydration', 'Wellness', 'Daily Health'],
      readTime: '2 min'
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'diet': return Utensils;
      case 'exercise': return Dumbbell;
      case 'tips': return Info;
      default: return Heart;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'diet': return 'text-primary bg-primary/10';
      case 'exercise': return 'text-success bg-success/10';
      case 'tips': return 'text-warning bg-warning/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  // Robust Text-to-Speech fallback using Web Speech API
  const playWithSpeechSynthesis = (item: HealthContent) => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: 'Audio Unavailable',
        description: 'Text-to-speech is not supported by your browser.',
        variant: 'destructive'
      });
      setPlayingAudio(null);
      return;
    }

    window.speechSynthesis.cancel();

    const fullText = `${item.title}. ${item.content}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    speechUtteranceRef.current = utterance;

    // Set voice language according to current language
    utterance.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setPlayingAudio(item.id);
      setPlaybackType('speech');
    };

    utterance.onend = () => {
      setPlayingAudio(null);
      setPlaybackType(null);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setPlayingAudio(null);
      setPlaybackType(null);
    };

    window.speechSynthesis.speak(utterance);
    toast({
      title: 'Voice Assistant Playing',
      description: `Reading aloud "${item.title}" in ${i18n.language === 'hi' ? 'Hindi' : 'English'}.`
    });
  };

  // Unified Play/Pause Handler (Audio stream with speech fallback)
  const handleAudioPlayPause = (item: HealthContent) => {
    // If clicking on currently playing item, toggle pause/stop
    if (playingAudio === item.id) {
      stopAllPlayback();
      return;
    }

    // Stop whatever else was playing
    stopAllPlayback();

    // If an audio file URL is specified, attempt standard streaming playback
    if (item.audioUrl) {
      const audio = new Audio(item.audioUrl);
      activeAudioRef.current = audio;

      audio.onplay = () => {
        setPlayingAudio(item.id);
        setPlaybackType('stream');
      };

      audio.onended = () => {
        setPlayingAudio(null);
        setPlaybackType(null);
        activeAudioRef.current = null;
      };

      // Graceful fallback to Speech Synthesis if audio file is missing or 404
      audio.onerror = () => {
        console.log(`Media file '${item.audioUrl}' not found. Falling back to native speech synthesis.`);
        activeAudioRef.current = null;
        playWithSpeechSynthesis(item);
      };

      audio.play().catch(() => {
        // Autoplay restrictions or missing source: fallback to Speech Synthesis
        activeAudioRef.current = null;
        playWithSpeechSynthesis(item);
      });
    } else {
      // No audio file specified: read aloud directly via Speech Synthesis
      playWithSpeechSynthesis(item);
    }
  };

  const filterContentByCategory = (category: string) => {
    return healthContent.filter(content => content.category === category);
  };

  const ContentCard: React.FC<{ content: HealthContent }> = ({ content }) => {
    const CategoryIcon = getCategoryIcon(content.category);
    const isPlaying = playingAudio === content.id;

    return (
      <Card className="shadow-card border-border/50 hover:shadow-medical transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(content.category)}`}>
                <CategoryIcon className="h-4 w-4" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {t(`feed.categories.${content.category}`) || content.category}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {content.readTime}
            </div>
          </div>
          <CardTitle className="text-lg leading-tight">
            {content.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {content.content}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {content.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          {/* Audio Controls */}
          <div className="flex items-center justify-between bg-accent/40 rounded-lg p-3 border border-border/40">
            <div className="flex items-center gap-2">
              <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <div>
                <span className="text-xs font-semibold block text-foreground">
                  {isPlaying 
                    ? (playbackType === 'speech' ? 'Reading Aloud...' : 'Playing Audio...') 
                    : 'Listen to Article'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {content.duration || 'Audio narration'}
                </span>
              </div>
            </div>
            
            <Button
              size="sm"
              onClick={() => handleAudioPlayPause(content)}
              className={isPlaying 
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 h-8 text-xs' 
                : 'bg-primary/10 text-primary hover:bg-primary/20 h-8 text-xs'
              }
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 mr-1" />
                  {t('feed.pauseAudio') || 'Pause'}
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1" />
                  {t('feed.playAudio') || 'Listen'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {t('feed.title') || 'Health Education & Feed'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('feed.subtitle') || 'Daily health tips and verified guidance for rural wellness'}
          </p>
        </div>

        {/* Global Playing Banner */}
        {playingAudio && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-5 w-5 text-primary animate-bounce" />
              <div>
                <p className="text-xs font-semibold text-primary">Now Playing Audio Narration</p>
                <p className="text-[11px] text-muted-foreground">
                  {playbackType === 'speech' ? 'Native Text-to-Speech active' : 'Media stream active'}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={stopAllPlayback} 
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <VolumeX className="h-4 w-4 mr-1" />
              Stop
            </Button>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="diet" className="text-xs">
              {t('feed.categories.diet')?.split(' ')[0] || 'Diet'}
            </TabsTrigger>
            <TabsTrigger value="exercise" className="text-xs">
              {t('feed.categories.exercise')?.split(' ')[0] || 'Exercise'}
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">
              {t('feed.categories.tips')?.split(' ')[1] || 'Tips'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 mt-4">
            {healthContent.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </TabsContent>
          
          <TabsContent value="diet" className="space-y-4 mt-4">
            {filterContentByCategory('diet').map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </TabsContent>
          
          <TabsContent value="exercise" className="space-y-4 mt-4">
            {filterContentByCategory('exercise').map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-4 mt-4">
            {filterContentByCategory('tips').map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </TabsContent>
        </Tabs>

        {/* Audio Feature Note */}
        <Card className="shadow-card border-border/50 bg-accent/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1 text-sm">
                  Voice Accessibility Support
                </h4>
                <p className="text-xs text-muted-foreground">
                  All articles support real-time audio playback in Hindi and English. If you have trouble reading, simply tap "Listen" on any health article.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthFeed;