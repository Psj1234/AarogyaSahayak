import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Volume2, Heart, Utensils, Dumbbell, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Mock health content data - in production this would be dynamic based on user profile and language
  const healthContent: HealthContent[] = [
    {
      id: '1',
      title: i18n.language === 'hi' ? 'मधुमेह के लिए स्वस्थ आहार' : 'Healthy Diet for Diabetes',
      content: i18n.language === 'hi' 
        ? 'मधुमेह को नियंत्रित करने के लिए संतुलित आहार बहुत महत्वपूर्ण है। पूरे अनाज, दुबला प्रोटीन, और फाइबर युक्त सब्जियों को शामिल करें। चीनी और प्रसंस्कृत खाद्य पदार्थों से बचें।'
        : 'A balanced diet is crucial for managing diabetes. Include whole grains, lean proteins, and fiber-rich vegetables. Avoid sugary and processed foods. Monitor portion sizes and eat at regular intervals.',
      category: 'diet',
      duration: '3:45',
      tags: ['Diabetes', 'Nutrition', 'Blood Sugar'],
      readTime: '2 min',
      audioUrl: '/demo-audio-diet.mp3' // Demo audio file
    },
    {
      id: '2',
      title: i18n.language === 'hi' ? 'उच्च रक्तचाप के लिए व्यायाम' : 'Exercise for High Blood Pressure',
      content: i18n.language === 'hi'
        ? 'नियमित व्यायाम रक्तचाप को कम करने में मदद करता है। दिन में 30 मिनट का तेज चलना, तैराकी, या साइक्लिंग करें। धीरे-धीरे शुरू करें और अपनी सीमा के अनुसार बढ़ाएं।'
        : 'Regular exercise helps lower blood pressure. Aim for 30 minutes of brisk walking, swimming, or cycling daily. Start slowly and gradually increase intensity based on your fitness level.',
      category: 'exercise',
      duration: '4:20',
      tags: ['Hypertension', 'Cardio', 'Fitness'],
      readTime: '3 min',
      audioUrl: '/demo-audio-exercise.mp3'
    },
    {
      id: '3',
      title: i18n.language === 'hi' ? 'दवाइयों को समय पर लेने के फायदे' : 'Benefits of Taking Medications on Time',
      content: i18n.language === 'hi'
        ? 'दवाइयों को निर्धारित समय पर लेना बहुत महत्वपूर्ण है। यह दवा की प्रभावशीलता बनाए रखता है और दुष्प्रभावों को कम करता है। रिमाइंडर सेट करें और दवा कैलेंडर का उपयोग करें।'
        : 'Taking medications at prescribed times is crucial for effectiveness. It maintains proper drug levels in your body and reduces side effects. Set reminders and use a medication calendar.',
      category: 'tips',
      duration: '2:30',
      tags: ['Medication', 'Adherence', 'Health Management'],
      readTime: '2 min',
      audioUrl: '/demo-audio-tips.mp3'
    },
    {
      id: '4',
      title: i18n.language === 'hi' ? 'हाइड्रेशन का महत्व' : 'Importance of Staying Hydrated',
      content: i18n.language === 'hi'
        ? 'पर्याप्त पानी पीना स्वास्थ्य के लिए आवश्यक है। यह शरीर के तापमान को नियंत्रित करता है, जोड़ों को चिकना रखता है, और पोषक तत्वों को पहुंचाने में मदद करता है।'
        : 'Adequate water intake is essential for health. It regulates body temperature, lubricates joints, and helps transport nutrients. Aim for 8-10 glasses daily.',
      category: 'tips',
      duration: '3:15',
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

  const handleAudioPlayPause = (contentId: string, audioUrl?: string) => {
    if (!audioUrl) {
      // Demo: Show that audio would play here
      alert(`${t('feed.playAudio')} - ${t('common.loading')}...`);
      return;
    }

    // In a real implementation, this would handle actual audio playback
    if (playingAudio === contentId) {
      setPlayingAudio(null);
      console.log(`Pausing audio for content ${contentId}`);
    } else {
      setPlayingAudio(contentId);
      console.log(`Playing audio for content ${contentId}: ${audioUrl}`);
      
      // Demo: Auto-pause after 3 seconds
      setTimeout(() => {
        setPlayingAudio(null);
      }, 3000);
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
                {t(`feed.categories.${content.category}`)}
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
          {content.audioUrl && (
            <div className="flex items-center justify-between bg-accent/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Audio Version</span>
                {content.duration && (
                  <span className="text-xs text-muted-foreground">
                    {content.duration}
                  </span>
                )}
              </div>
              
              <Button
                size="sm"
                onClick={() => handleAudioPlayPause(content.id, content.audioUrl)}
                className="bg-primary/10 text-primary hover:bg-primary/20"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    {t('feed.pauseAudio')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    {t('feed.playAudio')}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-secondary px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('feed.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('feed.subtitle')}
          </p>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="diet" className="text-xs">
              {t('feed.categories.diet').split(' ')[0]}
            </TabsTrigger>
            <TabsTrigger value="exercise" className="text-xs">
              {t('feed.categories.exercise').split(' ')[0]}
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">
              {t('feed.categories.tips').split(' ')[1] || 'Tips'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 mt-6">
            {healthContent.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </TabsContent>
          
          <TabsContent value="diet" className="space-y-4 mt-6">
            {filterContentByCategory('diet').map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </TabsContent>
          
          <TabsContent value="exercise" className="space-y-4 mt-6">
            {filterContentByCategory('exercise').map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-4 mt-6">
            {filterContentByCategory('tips').map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </TabsContent>
        </Tabs>

        {/* Audio Demo Note */}
        <Card className="shadow-card border-border/50 bg-accent/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Volume2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Audio Content
                </h4>
                <p className="text-sm text-muted-foreground">
                  {/* TODO: Implement real audio file loading and playback */}
                  Audio versions of health content will be available with proper audio file integration. This demo shows the interface design.
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