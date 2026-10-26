export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      count_sessions: {
        Row: {
          closed_at: string | null;
          code: number;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          org_id: string;
          source_filename: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["session_status"];
          warehouse_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          closed_at?: string | null;
          code: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          org_id: string;
          source_filename?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["session_status"];
          warehouse_id?: string | null;
        };
        Update: {
          closed_at?: string | null;
          code?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          org_id?: string;
          source_filename?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["session_status"];
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "count_sessions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "count_sessions_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      counts: {
        Row: {
          boxes: number;
          condition: Database["public"]["Enums"]["product_condition"];
          counted_by: string | null;
          created_at: string;
          device: string | null;
          expires_on: string | null;
          id: string;
          layers: number;
          org_id: string;
          pallets: number;
          product_id: string;
          session_id: string;
          total: number | null;
          units: number;
          units_per_box: number;
        };
        ComputedFields: never;
        Insert: {
          boxes?: number;
          condition?: Database["public"]["Enums"]["product_condition"];
          counted_by?: string | null;
          created_at?: string;
          device?: string | null;
          expires_on?: string | null;
          id?: string;
          layers?: number;
          org_id: string;
          pallets?: number;
          product_id: string;
          session_id: string;
          total?: never;
          units?: number;
          units_per_box: number;
        };
        Update: {
          boxes?: number;
          condition?: Database["public"]["Enums"]["product_condition"];
          counted_by?: string | null;
          created_at?: string;
          device?: string | null;
          expires_on?: string | null;
          id?: string;
          layers?: number;
          org_id?: string;
          pallets?: number;
          product_id?: string;
          session_id?: string;
          total?: never;
          units?: number;
          units_per_box?: number;
        };
        Relationships: [
          {
            foreignKeyName: "counts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "counts_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "session_product_status";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "counts_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "session_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "counts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "count_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "counts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "session_summary";
            referencedColumns: ["session_id"];
          },
        ];
      };
      invitations: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          invited_by: string | null;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          invited_by?: string | null;
          org_id: string;
          role?: Database["public"]["Enums"]["member_role"];
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          invited_by?: string | null;
          org_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
        };
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          org_id: string;
          role: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          org_id: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          org_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      session_products: {
        Row: {
          description: string;
          id: string;
          org_id: string;
          recount_requested: boolean;
          session_id: string;
          sku: string;
          supplier_id: string;
          system_qty: number;
          unit_cost: number;
          units_per_box: number;
        };
        ComputedFields: never;
        Insert: {
          description: string;
          id?: string;
          org_id: string;
          recount_requested?: boolean;
          session_id: string;
          sku: string;
          supplier_id: string;
          system_qty: number;
          unit_cost: number;
          units_per_box?: number;
        };
        Update: {
          description?: string;
          id?: string;
          org_id?: string;
          recount_requested?: boolean;
          session_id?: string;
          sku?: string;
          supplier_id?: string;
          system_qty?: number;
          unit_cost?: number;
          units_per_box?: number;
        };
        Relationships: [
          {
            foreignKeyName: "session_products_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_products_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "count_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_products_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "session_summary";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "session_products_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          org_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          name: string;
          org_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          org_id: string;
          team_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          org_id: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          org_id?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      team_suppliers: {
        Row: {
          org_id: string;
          session_id: string;
          supplier_id: string;
          team_id: string;
        };
        ComputedFields: never;
        Insert: {
          org_id: string;
          session_id: string;
          supplier_id: string;
          team_id: string;
        };
        Update: {
          org_id?: string;
          session_id?: string;
          supplier_id?: string;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_suppliers_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_suppliers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "count_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_suppliers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "session_summary";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "team_suppliers_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_suppliers_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          code: number;
          id: string;
          name: string;
          org_id: string;
          session_id: string;
        };
        ComputedFields: never;
        Insert: {
          code: number;
          id?: string;
          name: string;
          org_id: string;
          session_id: string;
        };
        Update: {
          code?: number;
          id?: string;
          name?: string;
          org_id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "count_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "session_summary";
            referencedColumns: ["session_id"];
          },
        ];
      };
      warehouses: {
        Row: {
          id: string;
          name: string;
          org_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          name: string;
          org_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          org_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouses_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      session_hourly_counts: {
        Row: {
          events: number | null;
          hour: string | null;
          session_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "counts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "count_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "counts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "session_summary";
            referencedColumns: ["session_id"];
          },
        ];
      };
      session_product_status: {
        Row: {
          count_events: number | null;
          counted_qty: number | null;
          description: string | null;
          difference: number | null;
          difference_value: number | null;
          exposure_value: number | null;
          id: string | null;
          last_counted_at: string | null;
          org_id: string | null;
          recount_requested: boolean | null;
          session_id: string | null;
          sku: string | null;
          status: string | null;
          supplier_id: string | null;
          supplier_name: string | null;
          system_qty: number | null;
          team_id: string | null;
          unit_cost: number | null;
          units_per_box: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "session_products_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_products_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "count_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_products_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "session_summary";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "session_products_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_suppliers_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      session_summary: {
        Row: {
          counted_products: number | null;
          difference_value: number | null;
          matched_products: number | null;
          org_id: string | null;
          over_products: number | null;
          products: number | null;
          session_id: string | null;
          short_products: number | null;
          system_value: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "count_sessions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      supplier_progress: {
        Row: {
          counted_products: number | null;
          difference_value: number | null;
          exposure_value: number | null;
          last_counted_at: string | null;
          over_products: number | null;
          products: number | null;
          session_id: string | null;
          short_products: number | null;
          supplier_id: string | null;
          supplier_name: string | null;
          team_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "session_products_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "count_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_products_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "session_summary";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "session_products_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_suppliers_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      accept_invitations: { Args: Record<PropertyKey, never>; Returns: number };
      can_count: { Args: { target_product: string }; Returns: boolean };
      has_role: {
        Args: { allowed: Database["public"]["Enums"]["member_role"][]; target_org: string };
        Returns: boolean;
      };
      import_session: {
        Args: { filename: string; rows: Json; session_name: string; target_org: string };
        Returns: string;
      };
      is_member: { Args: { target_org: string }; Returns: boolean };
      is_member_of: { Args: { target_org: string; target_user: string }; Returns: boolean };
      session_is_open: { Args: { target_session: string }; Returns: boolean };
    };
    Enums: {
      member_role: "admin" | "supervisor" | "counter";
      product_condition: "bueno" | "averiado" | "vencido";
      session_status: "draft" | "counting" | "closed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      member_role: ["admin", "supervisor", "counter"],
      product_condition: ["bueno", "averiado", "vencido"],
      session_status: ["draft", "counting", "closed"],
    },
  },
} as const;
