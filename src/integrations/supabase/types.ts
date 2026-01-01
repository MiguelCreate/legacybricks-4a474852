export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checklists: {
        Row: {
          created_at: string
          datum: string
          foto_link: string | null
          handtekening: string | null
          huurder_naam: string
          id: string
          items: Json | null
          property_id: string
          type: Database["public"]["Enums"]["checklist_type"]
          voltooid: boolean
        }
        Insert: {
          created_at?: string
          datum: string
          foto_link?: string | null
          handtekening?: string | null
          huurder_naam: string
          id?: string
          items?: Json | null
          property_id: string
          type: Database["public"]["Enums"]["checklist_type"]
          voltooid?: boolean
        }
        Update: {
          created_at?: string
          datum?: string
          foto_link?: string | null
          handtekening?: string | null
          huurder_naam?: string
          id?: string
          items?: Json | null
          property_id?: string
          type?: Database["public"]["Enums"]["checklist_type"]
          voltooid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "checklists_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      comparable_properties: {
        Row: {
          adres: string
          afstand_meter: number | null
          created_at: string
          id: string
          notities: string | null
          oppervlakte_m2: number
          prijs_per_m2: number | null
          property_id: string
          status: string | null
          updated_at: string
          vraagprijs: number
        }
        Insert: {
          adres: string
          afstand_meter?: number | null
          created_at?: string
          id?: string
          notities?: string | null
          oppervlakte_m2: number
          prijs_per_m2?: number | null
          property_id: string
          status?: string | null
          updated_at?: string
          vraagprijs: number
        }
        Update: {
          adres?: string
          afstand_meter?: number | null
          created_at?: string
          id?: string
          notities?: string | null
          oppervlakte_m2?: number
          prijs_per_m2?: number | null
          property_id?: string
          status?: string | null
          updated_at?: string
          vraagprijs?: number
        }
        Relationships: [
          {
            foreignKeyName: "comparable_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          bedrijfsnaam: string
          contactpersoon: string | null
          created_at: string
          email: string | null
          id: string
          notities: string | null
          telefoon: string | null
          type_werkzaamheden: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bedrijfsnaam: string
          contactpersoon?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notities?: string | null
          telefoon?: string | null
          type_werkzaamheden: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bedrijfsnaam?: string
          contactpersoon?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notities?: string | null
          telefoon?: string | null
          type_werkzaamheden?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          document_link: string | null
          einddatum: string
          herinnering_ingesteld: boolean
          id: string
          property_id: string
          startdatum: string
          tenant_id: string | null
          type: Database["public"]["Enums"]["contract_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_link?: string | null
          einddatum: string
          herinnering_ingesteld?: boolean
          id?: string
          property_id: string
          startdatum: string
          tenant_id?: string | null
          type: Database["public"]["Enums"]["contract_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_link?: string | null
          einddatum?: string
          herinnering_ingesteld?: boolean
          id?: string
          property_id?: string
          startdatum?: string
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["contract_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          bedrag: number
          beschrijving: string | null
          categorie: Database["public"]["Enums"]["expense_category"]
          created_at: string
          datum: string
          herhalend: boolean
          id: string
          property_id: string
        }
        Insert: {
          bedrag: number
          beschrijving?: string | null
          categorie: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          datum: string
          herhalend?: boolean
          id?: string
          property_id: string
        }
        Update: {
          bedrag?: number
          beschrijving?: string | null
          categorie?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          datum?: string
          herhalend?: boolean
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      gemeenschappelijk_onderhoud: {
        Row: {
          created_at: string
          element_naam: string
          frequentie_jaren: number | null
          geschatte_kosten: number | null
          id: string
          laatste_onderhoud: string | null
          notities: string | null
          property_id: string
          updated_at: string
          volgend_onderhoud: string | null
        }
        Insert: {
          created_at?: string
          element_naam: string
          frequentie_jaren?: number | null
          geschatte_kosten?: number | null
          id?: string
          laatste_onderhoud?: string | null
          notities?: string | null
          property_id: string
          updated_at?: string
          volgend_onderhoud?: string | null
        }
        Update: {
          created_at?: string
          element_naam?: string
          frequentie_jaren?: number | null
          geschatte_kosten?: number | null
          id?: string
          laatste_onderhoud?: string | null
          notities?: string | null
          property_id?: string
          updated_at?: string
          volgend_onderhoud?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gemeenschappelijk_onderhoud_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      gemeenschappelijke_notulen: {
        Row: {
          beslissing: string
          created_at: string
          datum: string
          id: string
          jouw_aandeel_euro: number | null
          kostenverdeling_percentage: number | null
          property_id: string
          status: Database["public"]["Enums"]["notulen_status"]
          updated_at: string
        }
        Insert: {
          beslissing: string
          created_at?: string
          datum: string
          id?: string
          jouw_aandeel_euro?: number | null
          kostenverdeling_percentage?: number | null
          property_id: string
          status?: Database["public"]["Enums"]["notulen_status"]
          updated_at?: string
        }
        Update: {
          beslissing?: string
          created_at?: string
          datum?: string
          id?: string
          jouw_aandeel_euro?: number | null
          kostenverdeling_percentage?: number | null
          property_id?: string
          status?: Database["public"]["Enums"]["notulen_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gemeenschappelijke_notulen_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          bereikt: boolean
          bron_property_id: string | null
          created_at: string
          doelbedrag: number
          huidig_bedrag: number
          id: string
          naam: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bereikt?: boolean
          bron_property_id?: string | null
          created_at?: string
          doelbedrag: number
          huidig_bedrag?: number
          id?: string
          naam: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bereikt?: boolean
          bron_property_id?: string | null
          created_at?: string
          doelbedrag?: number
          huidig_bedrag?: number
          id?: string
          naam?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_bron_property_id_fkey"
            columns: ["bron_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_settings: {
        Row: {
          created_at: string
          erfopvolging_optie: string | null
          familie_rollen: Json | null
          fiscale_deadlines: Json | null
          id: string
          jaarlijkse_review_datum: string | null
          notities: string | null
          updated_at: string
          user_id: string
          waardenverklaring: string | null
        }
        Insert: {
          created_at?: string
          erfopvolging_optie?: string | null
          familie_rollen?: Json | null
          fiscale_deadlines?: Json | null
          id?: string
          jaarlijkse_review_datum?: string | null
          notities?: string | null
          updated_at?: string
          user_id: string
          waardenverklaring?: string | null
        }
        Update: {
          created_at?: string
          erfopvolging_optie?: string | null
          familie_rollen?: Json | null
          fiscale_deadlines?: Json | null
          id?: string
          jaarlijkse_review_datum?: string | null
          notities?: string | null
          updated_at?: string
          user_id?: string
          waardenverklaring?: string | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          created_at: string
          hoofdsom: number | null
          hypotheek_type: Database["public"]["Enums"]["loan_type"]
          id: string
          looptijd_jaren: number | null
          maandlast: number
          property_id: string
          rente_percentage: number | null
          rente_type: string | null
          restschuld: number | null
          startdatum: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hoofdsom?: number | null
          hypotheek_type?: Database["public"]["Enums"]["loan_type"]
          id?: string
          looptijd_jaren?: number | null
          maandlast: number
          property_id: string
          rente_percentage?: number | null
          rente_type?: string | null
          restschuld?: number | null
          startdatum?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hoofdsom?: number | null
          hypotheek_type?: Database["public"]["Enums"]["loan_type"]
          id?: string
          looptijd_jaren?: number | null
          maandlast?: number
          property_id?: string
          rente_percentage?: number | null
          rente_type?: string | null
          restschuld?: number | null
          startdatum?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          beschrijving: string | null
          celebrated: boolean | null
          created_at: string
          datum: string
          id: string
          property_id: string | null
          titel: string
          type: string
          user_id: string
        }
        Insert: {
          beschrijving?: string | null
          celebrated?: boolean | null
          created_at?: string
          datum: string
          id?: string
          property_id?: string | null
          titel: string
          type: string
          user_id: string
        }
        Update: {
          beschrijving?: string | null
          celebrated?: boolean | null
          created_at?: string
          datum?: string
          id?: string
          property_id?: string | null
          titel?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      noodgevallen_contacten: {
        Row: {
          actie: string
          contact_email: string | null
          contact_naam: string | null
          contact_telefoon: string | null
          created_at: string
          extra_info: string | null
          id: string
          property_id: string
          situatie: string
          updated_at: string
        }
        Insert: {
          actie: string
          contact_email?: string | null
          contact_naam?: string | null
          contact_telefoon?: string | null
          created_at?: string
          extra_info?: string | null
          id?: string
          property_id: string
          situatie: string
          updated_at?: string
        }
        Update: {
          actie?: string
          contact_email?: string | null
          contact_naam?: string | null
          contact_telefoon?: string | null
          created_at?: string
          extra_info?: string | null
          id?: string
          property_id?: string
          situatie?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "noodgevallen_contacten_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          categorie: Database["public"]["Enums"]["note_category"]
          created_at: string
          id: string
          prive: boolean
          property_id: string
          tekst: string
        }
        Insert: {
          categorie?: Database["public"]["Enums"]["note_category"]
          created_at?: string
          id?: string
          prive?: boolean
          property_id: string
          tekst: string
        }
        Update: {
          categorie?: Database["public"]["Enums"]["note_category"]
          created_at?: string
          id?: string
          prive?: boolean
          property_id?: string
          tekst?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          bedrag: number
          created_at: string
          datum: string
          id: string
          property_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          bedrag: number
          created_at?: string
          datum: string
          id?: string
          property_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          bedrag?: number
          created_at?: string
          datum?: string
          id?: string
          property_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aow_maandelijks: number | null
          begeleiding_aan: boolean | null
          beleggingen: number | null
          co_pilot_standaard: boolean | null
          created_at: string
          email: string
          erfgoed_level: number | null
          erfgoed_mantra: string | null
          gewenst_maandinkomen: number | null
          gewenste_pensioenleeftijd: number | null
          huidige_leeftijd: number | null
          id: string
          naam: string
          overige_inkomsten: number | null
          overige_pot_sneeuwbal: number | null
          pensioen_maandelijks: number | null
          salaris_inleg_sneeuwbal: number | null
          spaargeld: number | null
          stilte_modus_aan: boolean | null
          toon_uitleg: boolean | null
          totaal_badges: Json | null
          updated_at: string
          user_id: string
          voorkeur_kpi_modus: string | null
          vrijheidskosten_maand: number | null
        }
        Insert: {
          aow_maandelijks?: number | null
          begeleiding_aan?: boolean | null
          beleggingen?: number | null
          co_pilot_standaard?: boolean | null
          created_at?: string
          email: string
          erfgoed_level?: number | null
          erfgoed_mantra?: string | null
          gewenst_maandinkomen?: number | null
          gewenste_pensioenleeftijd?: number | null
          huidige_leeftijd?: number | null
          id?: string
          naam: string
          overige_inkomsten?: number | null
          overige_pot_sneeuwbal?: number | null
          pensioen_maandelijks?: number | null
          salaris_inleg_sneeuwbal?: number | null
          spaargeld?: number | null
          stilte_modus_aan?: boolean | null
          toon_uitleg?: boolean | null
          totaal_badges?: Json | null
          updated_at?: string
          user_id: string
          voorkeur_kpi_modus?: string | null
          vrijheidskosten_maand?: number | null
        }
        Update: {
          aow_maandelijks?: number | null
          begeleiding_aan?: boolean | null
          beleggingen?: number | null
          co_pilot_standaard?: boolean | null
          created_at?: string
          email?: string
          erfgoed_level?: number | null
          erfgoed_mantra?: string | null
          gewenst_maandinkomen?: number | null
          gewenste_pensioenleeftijd?: number | null
          huidige_leeftijd?: number | null
          id?: string
          naam?: string
          overige_inkomsten?: number | null
          overige_pot_sneeuwbal?: number | null
          pensioen_maandelijks?: number | null
          salaris_inleg_sneeuwbal?: number | null
          spaargeld?: number | null
          stilte_modus_aan?: boolean | null
          toon_uitleg?: boolean | null
          totaal_badges?: Json | null
          updated_at?: string
          user_id?: string
          voorkeur_kpi_modus?: string | null
          vrijheidskosten_maand?: number | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          aankoopdatum: string | null
          aankoopprijs: number
          aantal_units: number
          analyse_status: Database["public"]["Enums"]["analyse_status"] | null
          beheerkosten_percentage: number | null
          bouwkundig_rapport_link: string | null
          condominium_maandelijks: number | null
          created_at: string
          eigen_inleg: number | null
          elektriciteit_contractnummer: string | null
          elektriciteit_leverancier: string | null
          elektriciteit_maandelijks: number | null
          elektriciteit_meternummer: string | null
          energie_certificaat_gebouw_vervaldatum: string | null
          energie_vervaldatum: string | null
          energielabel: Database["public"]["Enums"]["energy_label"] | null
          familie_handleiding: string | null
          foto_url: string | null
          gas_contractnummer: string | null
          gas_leverancier: string | null
          gas_maandelijks: number | null
          gas_meternummer: string | null
          gearchiveerd: boolean | null
          gebouw_verzekering_link: string | null
          gebouw_verzekering_polisnummer: string | null
          gebouw_verzekering_vervaldatum: string | null
          gerelateerd_doel_id: string | null
          gezondheidsscore: number | null
          google_drive_link: string | null
          huurgroei_percentage: number | null
          id: string
          imi_percentage: number | null
          imt_betaald: number | null
          inrichting_kosten: number | null
          is_pinned: boolean | null
          kostenstijging_percentage: number | null
          latitude: number | null
          leegstand_buffer_percentage: number | null
          lift_aanwezig: boolean | null
          lift_beheerder_contact: string | null
          locatie: string
          longitude: number | null
          maandelijkse_huur: number | null
          naam: string
          notaris_kosten: number | null
          onderhoud_jaarlijks: number | null
          oppervlakte_m2: number | null
          persoonlijke_quote: string | null
          renovatie_kosten: number | null
          risico_fiscaal: number | null
          risico_fysiek: number | null
          risico_juridisch: number | null
          risico_markt: number | null
          risico_operationeel: number | null
          st_bezetting_percentage: number | null
          st_gemiddelde_dagprijs: number | null
          status: Database["public"]["Enums"]["property_status"]
          subsidie_bedrag: number | null
          subsidie_naam: string | null
          tijdsframe_analyse:
            | Database["public"]["Enums"]["tijdsframe_analyse"]
            | null
          type_verhuur: string | null
          updated_at: string
          user_id: string
          verzekering_dekking: string | null
          verzekering_jaarlijks: number | null
          verzekering_maatschappij: string | null
          verzekering_polisnummer: string | null
          volledig_adres: string | null
          vve_maandbijdrage: number | null
          vve_reserve_huidig: number | null
          vve_reserve_streef: number | null
          waardegroei_percentage: number | null
          waardering: number | null
          waarom_gekocht: string | null
          water_contractnummer: string | null
          water_leverancier: string | null
          water_maandelijks: number | null
          water_meternummer: string | null
        }
        Insert: {
          aankoopdatum?: string | null
          aankoopprijs: number
          aantal_units?: number
          analyse_status?: Database["public"]["Enums"]["analyse_status"] | null
          beheerkosten_percentage?: number | null
          bouwkundig_rapport_link?: string | null
          condominium_maandelijks?: number | null
          created_at?: string
          eigen_inleg?: number | null
          elektriciteit_contractnummer?: string | null
          elektriciteit_leverancier?: string | null
          elektriciteit_maandelijks?: number | null
          elektriciteit_meternummer?: string | null
          energie_certificaat_gebouw_vervaldatum?: string | null
          energie_vervaldatum?: string | null
          energielabel?: Database["public"]["Enums"]["energy_label"] | null
          familie_handleiding?: string | null
          foto_url?: string | null
          gas_contractnummer?: string | null
          gas_leverancier?: string | null
          gas_maandelijks?: number | null
          gas_meternummer?: string | null
          gearchiveerd?: boolean | null
          gebouw_verzekering_link?: string | null
          gebouw_verzekering_polisnummer?: string | null
          gebouw_verzekering_vervaldatum?: string | null
          gerelateerd_doel_id?: string | null
          gezondheidsscore?: number | null
          google_drive_link?: string | null
          huurgroei_percentage?: number | null
          id?: string
          imi_percentage?: number | null
          imt_betaald?: number | null
          inrichting_kosten?: number | null
          is_pinned?: boolean | null
          kostenstijging_percentage?: number | null
          latitude?: number | null
          leegstand_buffer_percentage?: number | null
          lift_aanwezig?: boolean | null
          lift_beheerder_contact?: string | null
          locatie: string
          longitude?: number | null
          maandelijkse_huur?: number | null
          naam: string
          notaris_kosten?: number | null
          onderhoud_jaarlijks?: number | null
          oppervlakte_m2?: number | null
          persoonlijke_quote?: string | null
          renovatie_kosten?: number | null
          risico_fiscaal?: number | null
          risico_fysiek?: number | null
          risico_juridisch?: number | null
          risico_markt?: number | null
          risico_operationeel?: number | null
          st_bezetting_percentage?: number | null
          st_gemiddelde_dagprijs?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          subsidie_bedrag?: number | null
          subsidie_naam?: string | null
          tijdsframe_analyse?:
            | Database["public"]["Enums"]["tijdsframe_analyse"]
            | null
          type_verhuur?: string | null
          updated_at?: string
          user_id: string
          verzekering_dekking?: string | null
          verzekering_jaarlijks?: number | null
          verzekering_maatschappij?: string | null
          verzekering_polisnummer?: string | null
          volledig_adres?: string | null
          vve_maandbijdrage?: number | null
          vve_reserve_huidig?: number | null
          vve_reserve_streef?: number | null
          waardegroei_percentage?: number | null
          waardering?: number | null
          waarom_gekocht?: string | null
          water_contractnummer?: string | null
          water_leverancier?: string | null
          water_maandelijks?: number | null
          water_meternummer?: string | null
        }
        Update: {
          aankoopdatum?: string | null
          aankoopprijs?: number
          aantal_units?: number
          analyse_status?: Database["public"]["Enums"]["analyse_status"] | null
          beheerkosten_percentage?: number | null
          bouwkundig_rapport_link?: string | null
          condominium_maandelijks?: number | null
          created_at?: string
          eigen_inleg?: number | null
          elektriciteit_contractnummer?: string | null
          elektriciteit_leverancier?: string | null
          elektriciteit_maandelijks?: number | null
          elektriciteit_meternummer?: string | null
          energie_certificaat_gebouw_vervaldatum?: string | null
          energie_vervaldatum?: string | null
          energielabel?: Database["public"]["Enums"]["energy_label"] | null
          familie_handleiding?: string | null
          foto_url?: string | null
          gas_contractnummer?: string | null
          gas_leverancier?: string | null
          gas_maandelijks?: number | null
          gas_meternummer?: string | null
          gearchiveerd?: boolean | null
          gebouw_verzekering_link?: string | null
          gebouw_verzekering_polisnummer?: string | null
          gebouw_verzekering_vervaldatum?: string | null
          gerelateerd_doel_id?: string | null
          gezondheidsscore?: number | null
          google_drive_link?: string | null
          huurgroei_percentage?: number | null
          id?: string
          imi_percentage?: number | null
          imt_betaald?: number | null
          inrichting_kosten?: number | null
          is_pinned?: boolean | null
          kostenstijging_percentage?: number | null
          latitude?: number | null
          leegstand_buffer_percentage?: number | null
          lift_aanwezig?: boolean | null
          lift_beheerder_contact?: string | null
          locatie?: string
          longitude?: number | null
          maandelijkse_huur?: number | null
          naam?: string
          notaris_kosten?: number | null
          onderhoud_jaarlijks?: number | null
          oppervlakte_m2?: number | null
          persoonlijke_quote?: string | null
          renovatie_kosten?: number | null
          risico_fiscaal?: number | null
          risico_fysiek?: number | null
          risico_juridisch?: number | null
          risico_markt?: number | null
          risico_operationeel?: number | null
          st_bezetting_percentage?: number | null
          st_gemiddelde_dagprijs?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          subsidie_bedrag?: number | null
          subsidie_naam?: string | null
          tijdsframe_analyse?:
            | Database["public"]["Enums"]["tijdsframe_analyse"]
            | null
          type_verhuur?: string | null
          updated_at?: string
          user_id?: string
          verzekering_dekking?: string | null
          verzekering_jaarlijks?: number | null
          verzekering_maatschappij?: string | null
          verzekering_polisnummer?: string | null
          volledig_adres?: string | null
          vve_maandbijdrage?: number | null
          vve_reserve_huidig?: number | null
          vve_reserve_streef?: number | null
          waardegroei_percentage?: number | null
          waardering?: number | null
          waarom_gekocht?: string | null
          water_contractnummer?: string | null
          water_leverancier?: string | null
          water_maandelijks?: number | null
          water_meternummer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_gerelateerd_doel_id_fkey"
            columns: ["gerelateerd_doel_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      property_contractors: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          property_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          id?: string
          property_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_contractors_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_features: {
        Row: {
          aanwezig: boolean
          created_at: string
          gepland_onderhoudsjaar: number | null
          id: string
          merk_type: string | null
          naam: string
          notities: string | null
          onderhoudsbehoefte: string | null
          onderhoudsstatus: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          aanwezig?: boolean
          created_at?: string
          gepland_onderhoudsjaar?: number | null
          id?: string
          merk_type?: string | null
          naam: string
          notities?: string | null
          onderhoudsbehoefte?: string | null
          onderhoudsstatus?: string | null
          property_id: string
          updated_at?: string
        }
        Update: {
          aanwezig?: boolean
          created_at?: string
          gepland_onderhoudsjaar?: number | null
          id?: string
          merk_type?: string | null
          naam?: string
          notities?: string | null
          onderhoudsbehoefte?: string | null
          onderhoudsstatus?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_features_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      room_features: {
        Row: {
          created_at: string
          gepland_onderhoudsjaar: number | null
          id: string
          merk_type: string | null
          naam: string
          notities: string | null
          onderhoudsbehoefte: string | null
          onderhoudsstatus: string | null
          room_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gepland_onderhoudsjaar?: number | null
          id?: string
          merk_type?: string | null
          naam: string
          notities?: string | null
          onderhoudsbehoefte?: string | null
          onderhoudsstatus?: string | null
          room_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gepland_onderhoudsjaar?: number | null
          id?: string
          merk_type?: string | null
          naam?: string
          notities?: string | null
          onderhoudsbehoefte?: string | null
          onderhoudsstatus?: string | null
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_features_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          actieve_huurder_id: string | null
          created_at: string
          huurprijs: number
          id: string
          naam: string
          oppervlakte_m2: number | null
          property_id: string
          recibo_verde: boolean
          updated_at: string
        }
        Insert: {
          actieve_huurder_id?: string | null
          created_at?: string
          huurprijs?: number
          id?: string
          naam: string
          oppervlakte_m2?: number | null
          property_id: string
          recibo_verde?: boolean
          updated_at?: string
        }
        Update: {
          actieve_huurder_id?: string | null
          created_at?: string
          huurprijs?: number
          id?: string
          naam?: string
          oppervlakte_m2?: number | null
          property_id?: string
          recibo_verde?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_actieve_huurder_id_fkey"
            columns: ["actieve_huurder_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          actief: boolean
          beoordeling_betrouwbaarheid: number | null
          betaaldag: number
          borg: number | null
          created_at: string
          email: string | null
          huurbedrag: number
          id: string
          naam: string
          notities: string | null
          property_id: string
          room_id: string | null
          telefoon: string | null
          unit_naam: string | null
          unit_nummer: number
          updated_at: string
        }
        Insert: {
          actief?: boolean
          beoordeling_betrouwbaarheid?: number | null
          betaaldag: number
          borg?: number | null
          created_at?: string
          email?: string | null
          huurbedrag: number
          id?: string
          naam: string
          notities?: string | null
          property_id: string
          room_id?: string | null
          telefoon?: string | null
          unit_naam?: string | null
          unit_nummer?: number
          updated_at?: string
        }
        Update: {
          actief?: boolean
          beoordeling_betrouwbaarheid?: number | null
          betaaldag?: number
          borg?: number | null
          created_at?: string
          email?: string | null
          huurbedrag?: number
          id?: string
          naam?: string
          notities?: string | null
          property_id?: string
          room_id?: string | null
          telefoon?: string | null
          unit_naam?: string | null
          unit_nummer?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      analyse_status: "concept" | "potentieel" | "actief"
      checklist_type: "incheck" | "retour"
      contract_type: "langdurig" | "kort" | "airbnb" | "koop"
      energy_label: "A_plus" | "A" | "B" | "C" | "D" | "E" | "F"
      expense_category:
        | "onderhoud"
        | "leegstand"
        | "verzekering"
        | "belasting"
        | "administratie"
        | "energie"
        | "overig"
      loan_type: "eenvoudig" | "gevorderd"
      note_category: "onderhoud" | "energie" | "noodgeval" | "overig"
      notulen_status: "afgerond" | "open" | "uitgesteld"
      property_status: "aankoop" | "renovatie" | "verhuur" | "te_koop"
      tijdsframe_analyse: "5j" | "10j" | "15j" | "30j"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analyse_status: ["concept", "potentieel", "actief"],
      checklist_type: ["incheck", "retour"],
      contract_type: ["langdurig", "kort", "airbnb", "koop"],
      energy_label: ["A_plus", "A", "B", "C", "D", "E", "F"],
      expense_category: [
        "onderhoud",
        "leegstand",
        "verzekering",
        "belasting",
        "administratie",
        "energie",
        "overig",
      ],
      loan_type: ["eenvoudig", "gevorderd"],
      note_category: ["onderhoud", "energie", "noodgeval", "overig"],
      notulen_status: ["afgerond", "open", "uitgesteld"],
      property_status: ["aankoop", "renovatie", "verhuur", "te_koop"],
      tijdsframe_analyse: ["5j", "10j", "15j", "30j"],
    },
  },
} as const
