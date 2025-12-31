import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { YearlyCashflow } from "@/lib/rendementsCalculations";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CashflowTableProps {
  cashflows: YearlyCashflow[];
  timeframe: string;
}

export function CashflowTable({ cashflows, timeframe }: CashflowTableProps) {
  // Show subset of years for better readability
  const displayYears = cashflows.length <= 10 
    ? cashflows 
    : cashflows.filter((_, i) => i === 0 || i === cashflows.length - 1 || (i + 1) % 5 === 0);

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return value < 0 ? `-€${formatted}` : `€${formatted}`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Cashflow Projectie ({timeframe})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Jaar</TableHead>
                <TableHead className="text-right">Bruto Huur</TableHead>
                <TableHead className="text-right">OPEX</TableHead>
                <TableHead className="text-right">NOI</TableHead>
                <TableHead className="text-right">Hypotheek</TableHead>
                <TableHead className="text-right">Netto CF</TableHead>
                <TableHead className="text-right">Cumulatief</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayYears.map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(row.grossRent)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrency(row.opex)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.noi)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrency(row.debtService)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${row.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="inline-flex items-center gap-1">
                      {row.netCashflow >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatCurrency(row.netCashflow)}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${row.cumulativeCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(row.cumulativeCashflow)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {cashflows.length > 10 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Getoond: jaar 1, 5, 10, 15... en laatste jaar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
