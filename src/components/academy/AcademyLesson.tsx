import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Lightbulb, BookOpen, Calculator, Award, Info } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { type Lesson } from "./academyData";
import confetti from "canvas-confetti";

interface AcademyLessonProps {
  lesson: Lesson;
  onComplete: () => void;
  onBack: () => void;
  isCompleted: boolean;
}

type LessonStep = "intro" | "theory" | "example" | "exercise" | "summary";

export const AcademyLesson = ({ lesson, onComplete, onBack, isCompleted }: AcademyLessonProps) => {
  const [currentStep, setCurrentStep] = useState<LessonStep>("intro");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const steps: LessonStep[] = ["intro", "theory", "example", "exercise", "summary"];
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleCheckAnswer = () => {
    const correctOption = lesson.content.exercise.options.find(o => o.correct);
    const correct = selectedAnswer === correctOption?.value;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  const handleComplete = () => {
    if (!isCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      onComplete();
    } else {
      onBack();
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="p-4 md:p-6 lg:p-8">
          <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Terug naar overzicht
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <lesson.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-1">
                    {lesson.level === "beginner" ? "Beginner" : lesson.level === "gevorderd" ? "Gevorderd" : "Professional"}
                  </Badge>
                  <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
                </div>
              </div>
              <p className="text-muted-foreground">{lesson.description}</p>
            </div>

            {lesson.badge && (
              <div className="hidden md:flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">{lesson.badge.name}</span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Voortgang</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`text-xs ${
                    index <= currentIndex ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step === "intro" && "Intro"}
                  {step === "theory" && "Theorie"}
                  {step === "example" && "Voorbeeld"}
                  {step === "exercise" && "Oefening"}
                  {step === "summary" && "Samenvatting"}
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="px-4 md:px-6 lg:px-8 pb-8">
          {/* Intro Step */}
          {currentStep === "intro" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Introductie
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-lg text-foreground leading-relaxed">{lesson.content.intro}</p>
                
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Wat je gaat leren</span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {lesson.content.keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Theory Step */}
          {currentStep === "theory" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Theorie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lesson.content.theory.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(paragraph) }}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Example Step */}
          {currentStep === "example" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Voorbeeld: {lesson.content.example.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {lesson.content.example.simple && (
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Simpel voorbeeld</span>
                    </div>
                    <p className="text-foreground">{lesson.content.example.simple}</p>
                  </div>
                )}

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="font-medium">Realistisch voorbeeld (Portugal 2025)</span>
                  </div>
                  <div
                    className="text-foreground whitespace-pre-line leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.content.example.realistic) }}
                  />
                </div>

                {lesson.content.example.calculation && (
                  <div className="p-3 bg-accent/50 rounded-lg font-mono text-sm">
                    <span className="text-muted-foreground">Berekening: </span>
                    <span className="text-foreground">{lesson.content.example.calculation}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Exercise Step */}
          {currentStep === "exercise" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Oefening
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg font-medium text-foreground">
                  {lesson.content.exercise.question}
                </p>

                <RadioGroup
                  value={selectedAnswer || ""}
                  onValueChange={setSelectedAnswer}
                  disabled={showResult}
                  className="space-y-3"
                >
                  {lesson.content.exercise.options.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${
                        showResult
                          ? option.correct
                            ? "bg-success/10 border-success"
                            : selectedAnswer === option.value
                              ? "bg-destructive/10 border-destructive"
                              : "border-border"
                          : selectedAnswer === option.value
                            ? "bg-primary/5 border-primary"
                            : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                      {showResult && option.correct && (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      )}
                    </div>
                  ))}
                </RadioGroup>

                {!showResult ? (
                  <Button
                    onClick={handleCheckAnswer}
                    disabled={!selectedAnswer}
                    className="w-full"
                  >
                    Controleer antwoord
                  </Button>
                ) : (
                  <div
                    className={`p-4 rounded-xl ${
                      isCorrect ? "bg-success/10 border border-success/30" : "bg-amber-500/10 border border-amber-500/30"
                    }`}
                  >
                    <p className="font-medium mb-2">
                      {isCorrect ? "✅ Correct!" : "💡 Uitleg:"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.content.exercise.explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary Step */}
          {currentStep === "summary" && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Samenvatting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <h3 className="font-semibold mb-3">Belangrijkste punten:</h3>
                  <ul className="space-y-2">
                    {lesson.content.keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {lesson.badge && (
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                    <span className="text-4xl mb-2 block">{lesson.badge.icon}</span>
                    <p className="font-semibold">Badge te verdienen:</p>
                    <p className="text-amber-600 dark:text-amber-400">{lesson.badge.name}</p>
                  </div>
                )}

                <Button onClick={handleComplete} className="w-full gap-2" size="lg">
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Les al voltooid - Terug naar overzicht
                    </>
                  ) : (
                    <>
                      <Award className="w-5 h-5" />
                      Les voltooien & badge verdienen
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Vorige
            </Button>

            {currentStep !== "summary" && (
              <Button
                onClick={handleNext}
                disabled={currentStep === "exercise" && !showResult}
                className="gap-2"
              >
                Volgende
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
