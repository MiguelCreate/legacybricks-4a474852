import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { 
  Activity, TrendingUp, Wrench, FileCheck, AlertTriangle, 
  CheckCircle2, XCircle, Home, Zap, Shield, DollarSign
} from "lucide-react";

interface PropertyHealthScoreProps {
  // Property data
  gezondheidsscore?: number;
  energielabel?: string;
  maandelijksHuur?: number;
  aankoopprijs?: number;
  waardering?: number;
  status?: string;
  
  // Risk factors (1-5 scale)
  risicoJuridisch?: number;
  risicoMarkt?: number;
  risicoFiscaal?: number;
  risicoFysiek?: number;
  risicoOperationeel?: number;
  
  // Documents/Compliance
  energieVervaldatum?: string;
  verzekeringsVervaldatum?: string;
  
  // Occupancy
  bezettingspercentage?: number;
  typeVerhuur?: string;
  
  // VvE
  vveReserveHuidig?: number;
  vveReserveStreef?: number;
}

interface HealthCategory {
  name: string;
  score: number;
  maxScore: number;
  icon: typeof Activity;
  status: 'good' | 'warning' | 'danger';
  details: string;
}

export function PropertyHealthScore({
  gezondheidsscore = 5,
  energielabel,
  maandelijksHuur = 0,
  aankoopprijs = 0,
  waardering,
  status,
  risicoJuridisch = 1,
  risicoMarkt = 1,
  risicoFiscaal = 1,
  risicoFysiek = 1,
  risicoOperationeel = 1,
  energieVervaldatum,
  verzekeringsVervaldatum,
  bezettingspercentage,
  typeVerhuur,
  vveReserveHuidig = 0,
  vveReserveStreef = 0,
}: PropertyHealthScoreProps) {
  
  const categories = useMemo<HealthCategory[]>(() => {
    const now = new Date();
    const results: HealthCategory[] = [];
    
    // 1. Financial Health (Yield & Value Growth)
    const yieldPercent = aankoopprijs > 0 ? (maandelijksHuur * 12 / aankoopprijs) * 100 : 0;
    const valueGrowth = waardering && aankoopprijs ? ((waardering - aankoopprijs) / aankoopprijs) * 100 : 0;
    const financialScore = Math.min(10, (yieldPercent > 5 ? 5 : yieldPercent) + (valueGrowth > 10 ? 5 : valueGrowth / 2));
    results.push({
      name: 'Financieel',
      score: Math.round(financialScore * 10) / 10,
      maxScore: 10,
      icon: DollarSign,
      status: financialScore >= 7 ? 'good' : financialScore >= 4 ? 'warning' : 'danger',
      details: `Rendement: ${yieldPercent.toFixed(1)}% | Waardestijging: ${valueGrowth.toFixed(1)}%`,
    });
    
    // 2. Energy Efficiency
    const energyScoreMap: Record<string, number> = {
      'A_plus': 10, 'A': 9, 'B': 7, 'C': 5, 'D': 3, 'E': 2, 'F': 1
    };
    let energyScore = energyScoreMap[energielabel || ''] || 5;
    if (energieVervaldatum) {
      const daysUntil = Math.ceil((new Date(energieVervaldatum).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) energyScore = Math.max(0, energyScore - 5);
      else if (daysUntil < 90) energyScore = Math.max(0, energyScore - 2);
    }
    results.push({
      name: 'Energie',
      score: energyScore,
      maxScore: 10,
      icon: Zap,
      status: energyScore >= 7 ? 'good' : energyScore >= 4 ? 'warning' : 'danger',
      details: `Label: ${energielabel || 'Onbekend'}${energieVervaldatum ? ` | Geldig tot: ${new Date(energieVervaldatum).toLocaleDateString('nl-NL')}` : ''}`,
    });
    
    // 3. Risk Profile (inverted - lower risk = higher score)
    const avgRisk = (risicoJuridisch + risicoMarkt + risicoFiscaal + risicoFysiek + risicoOperationeel) / 5;
    const riskScore = Math.round((5 - avgRisk + 1) * 2); // Convert 1-5 risk to 0-10 score
    results.push({
      name: 'Risicoprofiel',
      score: Math.max(0, Math.min(10, riskScore)),
      maxScore: 10,
      icon: Shield,
      status: riskScore >= 7 ? 'good' : riskScore >= 4 ? 'warning' : 'danger',
      details: `Gem. risico: ${avgRisk.toFixed(1)}/5`,
    });
    
    // 4. Occupancy / Status
    let occupancyScore = 7;
    if (typeVerhuur === 'korte_termijn' && bezettingspercentage !== undefined) {
      occupancyScore = bezettingspercentage / 10;
    } else if (status === 'verhuur') {
      occupancyScore = 10;
    } else if (status === 'renovatie') {
      occupancyScore = 4;
    } else if (status === 'aankoop') {
      occupancyScore = 5;
    } else if (status === 'te_koop') {
      occupancyScore = 3;
    }
    results.push({
      name: 'Bezetting',
      score: Math.round(occupancyScore * 10) / 10,
      maxScore: 10,
      icon: Home,
      status: occupancyScore >= 7 ? 'good' : occupancyScore >= 4 ? 'warning' : 'danger',
      details: typeVerhuur === 'korte_termijn' ? `Bezetting: ${bezettingspercentage || 0}%` : `Status: ${status || 'Onbekend'}`,
    });
    
    // 5. Compliance (Documents)
    let complianceScore = 10;
    const issues: string[] = [];
    
    if (verzekeringsVervaldatum) {
      const daysUntil = Math.ceil((new Date(verzekeringsVervaldatum).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        complianceScore -= 5;
        issues.push('Verzekering verlopen');
      } else if (daysUntil < 30) {
        complianceScore -= 2;
        issues.push('Verzekering verloopt binnenkort');
      }
    }
    
    results.push({
      name: 'Compliance',
      score: Math.max(0, complianceScore),
      maxScore: 10,
      icon: FileCheck,
      status: complianceScore >= 7 ? 'good' : complianceScore >= 4 ? 'warning' : 'danger',
      details: issues.length > 0 ? issues.join(', ') : 'Alle documenten in orde',
    });
    
    // 6. VvE Reserve
    if (vveReserveStreef > 0) {
      const reservePercent = (vveReserveHuidig / vveReserveStreef) * 100;
      const vveScore = Math.min(10, reservePercent / 10);
      results.push({
        name: 'VvE Reserve',
        score: Math.round(vveScore * 10) / 10,
        maxScore: 10,
        icon: Wrench,
        status: vveScore >= 7 ? 'good' : vveScore >= 4 ? 'warning' : 'danger',
        details: `€${vveReserveHuidig.toLocaleString()} van €${vveReserveStreef.toLocaleString()} (${reservePercent.toFixed(0)}%)`,
      });
    }
    
    return results;
  }, [
    gezondheidsscore, energielabel, maandelijksHuur, aankoopprijs, waardering, status,
    risicoJuridisch, risicoMarkt, risicoFiscaal, risicoFysiek, risicoOperationeel,
    energieVervaldatum, verzekeringsVervaldatum, bezettingspercentage, typeVerhuur,
    vveReserveHuidig, vveReserveStreef
  ]);

  const overallScore = useMemo(() => {
    if (categories.length === 0) return 0;
    const total = categories.reduce((sum, cat) => sum + cat.score, 0);
    return Math.round((total / categories.length) * 10) / 10;
  }, [categories]);

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-success';
    if (score >= 4) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (status: 'good' | 'warning' | 'danger') => {
    if (status === 'good') return 'bg-success';
    if (status === 'warning') return 'bg-warning';
    return 'bg-destructive';
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'danger') => {
    if (status === 'good') return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-warning" />;
    return <XCircle className="w-4 h-4 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Gezondheidsscore
              <InfoTooltip
                title="Pand Gezondheidsscore"
                content="Een samengestelde score op basis van financiële prestaties, energie-efficiëntie, risicoprofiel, bezetting, compliance en reserves."
              />
            </CardTitle>
            <CardDescription>
              Uitgebreide analyse van de gezondheid van uw pand
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <div className="text-sm text-muted-foreground">van 10</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Totale Gezondheid</span>
            <span className="font-medium">{(overallScore * 10).toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                overallScore >= 7 ? 'bg-success' : overallScore >= 4 ? 'bg-warning' : 'bg-destructive'
              }`}
              style={{ width: `${overallScore * 10}%` }}
            />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{category.name}</span>
                    {getStatusIcon(category.status)}
                  </div>
                  <span className={`font-bold ${getScoreColor(category.score)}`}>
                    {category.score}/{category.maxScore}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getProgressColor(category.status)}`}
                    style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{category.details}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Status Badges */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {categories.filter(c => c.status !== 'good').map((category) => (
            <Badge 
              key={category.name}
              variant={category.status === 'danger' ? 'destructive' : 'warning'}
              className="gap-1"
            >
              {category.status === 'danger' ? (
                <XCircle className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {category.name}
            </Badge>
          ))}
          {categories.every(c => c.status === 'good') && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Alles in orde
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
