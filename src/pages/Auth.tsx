import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Ongeldig e-mailadres"),
  password: z.string().min(6, "Wachtwoord moet minimaal 6 tekens bevatten"),
});

const signupSchema = loginSchema.extend({
  naam: z.string().min(2, "Naam moet minimaal 2 tekens bevatten"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    naam: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Inloggen mislukt",
              description: "E-mailadres of wachtwoord is onjuist. Probeer het opnieuw.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Fout",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welkom terug!",
            description: "Je bent succesvol ingelogd.",
          });
        }
      } else {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.naam);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Account bestaat al",
              description: "Er is al een account met dit e-mailadres. Probeer in te loggen.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Fout",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account aangemaakt!",
            description: "Welkom bij VastgoedApp. Je kunt nu beginnen.",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-8 shadow-glow">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            VastgoedApp
          </h1>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Beheer je Portugese vastgoedportefeuille met gemak
          </p>
          <div className="space-y-4 text-left">
            {[
              "Dagelijks beheer van huurders en betalingen",
              "Juridische bescherming met inchecklijsten",
              "Strategisch inzicht in rendement",
              "Bouw aan je erfgoed",
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-primary-foreground/90"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-2 h-2 rounded-full bg-primary-foreground/60" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">VastgoedApp</h1>
          </div>

          <div className="bg-card rounded-2xl border shadow-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                {isLogin ? "Welkom terug" : "Account aanmaken"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isLogin
                  ? "Log in om je portefeuille te beheren"
                  : "Start met het beheren van je vastgoed"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="naam">Naam</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="naam"
                      name="naam"
                      type="text"
                      placeholder="Je volledige naam"
                      value={formData.naam}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                  {errors.naam && (
                    <p className="text-sm text-destructive">{errors.naam}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jouw@email.nl"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground h-12"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">Even geduld...</span>
                ) : (
                  <>
                    {isLogin ? "Inloggen" : "Account aanmaken"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {isLogin ? "Nog geen account?" : "Al een account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? "Registreren" : "Inloggen"}
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Door in te loggen ga je akkoord met onze voorwaarden
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
