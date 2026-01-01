import { useState } from "react";
import { Building2, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VvEOnderhoudsplanner } from "./VvEOnderhoudsplanner";
import { VvEReservepot } from "./VvEReservepot";
import { VvENotulen } from "./VvENotulen";
import { VvEDocumentenkluis } from "./VvEDocumentenkluis";
import { VvENoodplan } from "./VvENoodplan";

interface VvEModuleProps {
  propertyId: string;
  propertyName: string;
  vveReserveStreef: number;
  vveReserveHuidig: number;
  vveMaandbijdrage: number;
  gebouwVerzekeringPolisnummer: string | null;
  gebouwVerzekeringVervaldatum: string | null;
  gebouwVerzekeringLink: string | null;
  bouwkundigRapportLink: string | null;
  energieCertificaatGebouwVervaldatum: string | null;
  onPropertyUpdate: () => void;
}

export const VvEModule = ({
  propertyId,
  propertyName,
  vveReserveStreef,
  vveReserveHuidig,
  vveMaandbijdrage,
  gebouwVerzekeringPolisnummer,
  gebouwVerzekeringVervaldatum,
  gebouwVerzekeringLink,
  bouwkundigRapportLink,
  energieCertificaatGebouwVervaldatum,
  onPropertyUpdate,
}: VvEModuleProps) => {
  const [activeTab, setActiveTab] = useState("onderhoud");

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Mini-VvE Module</strong> — Beheer gemeenschappelijke verantwoordelijkheden zonder officiële VvE. 
          Plan onderhoud, bouw een reservepot op, en houd afspraken met mede-eigenaren bij.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="onderhoud">Onderhoudsplanner</TabsTrigger>
          <TabsTrigger value="reservepot">Reservepot</TabsTrigger>
          <TabsTrigger value="notulen">Notulen & Besluiten</TabsTrigger>
          <TabsTrigger value="documenten">Documenten</TabsTrigger>
          <TabsTrigger value="noodplan" className="text-destructive">❗ Noodplan</TabsTrigger>
        </TabsList>

        <TabsContent value="onderhoud">
          <VvEOnderhoudsplanner propertyId={propertyId} propertyName={propertyName} />
        </TabsContent>

        <TabsContent value="reservepot">
          <VvEReservepot
            propertyId={propertyId}
            propertyName={propertyName}
            streefbedrag={vveReserveStreef}
            huidigBedrag={vveReserveHuidig}
            maandbijdrage={vveMaandbijdrage}
            onUpdate={onPropertyUpdate}
          />
        </TabsContent>

        <TabsContent value="notulen">
          <VvENotulen propertyId={propertyId} propertyName={propertyName} />
        </TabsContent>

        <TabsContent value="documenten">
          <VvEDocumentenkluis
            propertyId={propertyId}
            propertyName={propertyName}
            verzekeringsPolisnummer={gebouwVerzekeringPolisnummer}
            verzekeringsVervaldatum={gebouwVerzekeringVervaldatum}
            verzekeringsLink={gebouwVerzekeringLink}
            bouwkundigRapportLink={bouwkundigRapportLink}
            energieCertificaatVervaldatum={energieCertificaatGebouwVervaldatum}
            onUpdate={onPropertyUpdate}
          />
        </TabsContent>

        <TabsContent value="noodplan">
          <VvENoodplan propertyId={propertyId} propertyName={propertyName} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
