import { useState, useEffect } from "react";
import { GraduationCap, Trophy, Star, CheckCircle2, Lock, ChevronRight, BookOpen, Calculator, TrendingUp, Award, Sparkles, Info, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AcademyLesson } from "@/components/academy/AcademyLesson";
import { AcademyProgress } from "@/components/academy/AcademyProgress";
import { AcademyBadges } from "@/components/academy/AcademyBadges";
import { lessons, type Lesson, type LessonLevel } from "@/components/academy/academyData";

const Academy = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeLevel, setActiveLevel] = useState<LessonLevel>("beginner");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("totaal_badges")
        .eq("user_id", user?.id)
        .single();

      if (profile?.totaal_badges) {
        const badges = profile.totaal_badges as { academy_completed?: string[], academy_badges?: string[] };
        setCompletedLessons(badges.academy_completed || []);
        setEarnedBadges(badges.academy_badges || []);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (newCompleted: string[], newBadges: string[]) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("totaal_badges")
        .eq("user_id", user?.id)
        .single();

      const currentBadges = (profile?.totaal_badges as object) || {};
      
      await supabase
        .from("profiles")
        .update({
          totaal_badges: {
            ...currentBadges,
            academy_completed: newCompleted,
            academy_badges: newBadges,
          }
        })
        .eq("user_id", user?.id);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleCompleteLesson = (lessonId: string) => {
    if (completedLessons.includes(lessonId)) return;

    const newCompleted = [...completedLessons, lessonId];
    setCompletedLessons(newCompleted);

    // Check for new badges
    const newBadges = [...earnedBadges];
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (lesson?.badge && !earnedBadges.includes(lesson.badge.id)) {
      newBadges.push(lesson.badge.id);
      setEarnedBadges(newBadges);
      toast({
        title: "🏆 Badge Verdiend!",
        description: lesson.badge.name,
      });
    }

    // Level completion badges
    const levelLessons = lessons.filter(l => l.level === lesson?.level);
    const completedInLevel = levelLessons.filter(l => newCompleted.includes(l.id));
    
    if (completedInLevel.length === levelLessons.length) {
      const levelBadgeId = `level_${lesson?.level}_complete`;
      if (!newBadges.includes(levelBadgeId)) {
        newBadges.push(levelBadgeId);
        setEarnedBadges(newBadges);
        toast({
          title: "🎉 Level Voltooid!",
          description: `Je hebt alle ${lesson?.level === "beginner" ? "Beginner" : lesson?.level === "gevorderd" ? "Gevorderde" : "Professional"} lessen afgerond!`,
        });
      }
    }

    saveProgress(newCompleted, newBadges);
    setSelectedLesson(null);
  };

  const getProgress = () => {
    const total = lessons.length;
    const completed = completedLessons.length;
    return Math.round((completed / total) * 100);
  };

  const getLevelProgress = (level: LessonLevel) => {
    const levelLessons = lessons.filter(l => l.level === level);
    const completed = levelLessons.filter(l => completedLessons.includes(l.id));
    return Math.round((completed.length / levelLessons.length) * 100);
  };

  const isLessonUnlocked = (lesson: Lesson) => {
    if (lesson.level === "beginner") return true;
    
    const levelOrder: LessonLevel[] = ["beginner", "gevorderd", "professional"];
    const currentLevelIndex = levelOrder.indexOf(lesson.level);
    const previousLevel = levelOrder[currentLevelIndex - 1];
    
    if (!previousLevel) return true;
    
    const previousLevelLessons = lessons.filter(l => l.level === previousLevel);
    const completedPrevious = previousLevelLessons.filter(l => completedLessons.includes(l.id));
    
    return completedPrevious.length >= Math.ceil(previousLevelLessons.length * 0.5);
  };

  const levelConfig = {
    beginner: {
      label: "Beginner",
      icon: BookOpen,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    gevorderd: {
      label: "Gevorderd",
      icon: Calculator,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    professional: {
      label: "Professional",
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    },
  };

  if (selectedLesson) {
    return (
      <AcademyLesson
        lesson={selectedLesson}
        onComplete={() => handleCompleteLesson(selectedLesson.id)}
        onBack={() => setSelectedLesson(null)}
        isCompleted={completedLessons.includes(selectedLesson.id)}
      />
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Vastgoed Academy
                </h1>
                <InfoTooltip
                  title="Vastgoed Academy"
                  content="Leer vastgoedinvestering in Portugal met realistische voorbeelden uit 2025. Gebaseerd op data van INE, Idealista en Bank of Portugal."
                />
              </div>
              <p className="text-muted-foreground mt-1">
                Van beginner naar professional in vastgoedinvestering
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">{earnedBadges.length} badges</span>
              </div>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="w-3 h-3" />
                {getProgress()}% voltooid
              </Badge>
            </div>
          </div>

          {/* Overall Progress */}
          <AcademyProgress 
            progress={getProgress()} 
            completedLessons={completedLessons.length}
            totalLessons={lessons.length}
          />
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {/* Badges Section */}
          <AcademyBadges 
            earnedBadges={earnedBadges} 
            completedLessons={completedLessons}
          />

          {/* Level Tabs */}
          <Tabs value={activeLevel} onValueChange={(v) => setActiveLevel(v as LessonLevel)} className="mt-8">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {(["beginner", "gevorderd", "professional"] as LessonLevel[]).map((level) => {
                const config = levelConfig[level];
                const Icon = config.icon;
                const progress = getLevelProgress(level);
                
                return (
                  <TabsTrigger 
                    key={level} 
                    value={level}
                    className="flex items-center gap-2 data-[state=active]:bg-primary/10"
                  >
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="hidden sm:inline">{config.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {progress}%
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(["beginner", "gevorderd", "professional"] as LessonLevel[]).map((level) => (
              <TabsContent key={level} value={level}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lessons
                    .filter((lesson) => lesson.level === level)
                    .map((lesson, index) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      const isUnlocked = isLessonUnlocked(lesson);
                      const config = levelConfig[level];

                      return (
                        <Card
                          key={lesson.id}
                          className={`relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-glow ${
                            isCompleted 
                              ? "border-success/30 bg-success/5" 
                              : isUnlocked 
                                ? `${config.borderColor} hover:border-primary/50` 
                                : "opacity-60 cursor-not-allowed"
                          }`}
                          onClick={() => isUnlocked && setSelectedLesson(lesson)}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {isCompleted && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle2 className="w-6 h-6 text-success" />
                            </div>
                          )}
                          
                          {!isUnlocked && (
                            <div className="absolute top-3 right-3">
                              <Lock className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}

                          <CardHeader className="pb-2">
                            <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center mb-3`}>
                              <lesson.icon className={`w-6 h-6 ${config.color}`} />
                            </div>
                            <CardTitle className="text-lg">{lesson.title}</CardTitle>
                            <CardDescription>{lesson.description}</CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {lesson.duration} min
                                </Badge>
                                {lesson.badge && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Award className="w-3 h-3" />
                                    {lesson.badge.name}
                                  </Badge>
                                )}
                              </div>
                              {isUnlocked && !isCompleted && (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Data Sources */}
          <Card className="mt-8 bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Bronnen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Alle cijfers zijn gebaseerd op openbare data uit 2025: INE (Instituto Nacional de Estatística), 
                PORDATA, Idealista huurprijzen (mei 2025), Bank of Portugal (rente 2025) en Portugese belastingwetgeving 
                (IMT, IMI, IRS 2025).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Academy;
