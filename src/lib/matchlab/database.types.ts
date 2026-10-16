export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
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
      ml_alert_reads: {
        Row: {
          alert_id: string;
          read_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          alert_id: string;
          read_at?: string;
          user_id: string;
        };
        Update: {
          alert_id?: string;
          read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ml_alert_reads_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "ml_alerts";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_alerts: {
        Row: {
          created_at: string;
          event: string;
          id: string;
          match_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          event: string;
          id?: string;
          match_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          event?: string;
          id?: string;
          match_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ml_alerts_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: true;
            referencedRelation: "ml_matches";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_article_revisions: {
        Row: {
          article_id: string;
          author: string;
          created_at: string;
          draft: NonNullable<Json>;
          id: string;
          published: Json | null;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          article_id: string;
          author: string;
          created_at?: string;
          draft: NonNullable<Json>;
          id?: string;
          published?: Json | null;
          version: number;
        };
        Update: {
          article_id?: string;
          author?: string;
          created_at?: string;
          draft?: NonNullable<Json>;
          id?: string;
          published?: Json | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ml_article_revisions_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "ml_articles";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_articles: {
        Row: {
          draft: NonNullable<Json>;
          id: string;
          published: Json | null;
          slug: string;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          draft: NonNullable<Json>;
          id?: string;
          published?: Json | null;
          slug: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          draft?: NonNullable<Json>;
          id?: string;
          published?: Json | null;
          slug?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      ml_audit: {
        Row: {
          action: string;
          created_at: string;
          details: NonNullable<Json>;
          id: number;
          resource: string;
          resource_id: string | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          created_at?: string;
          details?: NonNullable<Json>;
          id?: never;
          resource: string;
          resource_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: NonNullable<Json>;
          id?: never;
          resource?: string;
          resource_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      ml_categories: {
        Row: {
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          id: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      ml_consents: {
        Row: {
          expires_at: string;
          granted_at: string;
          guardian_name: string;
          id: string;
          player_id: string;
          policy: string;
          purpose: string;
          revoked_at: string | null;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          expires_at: string;
          granted_at: string;
          guardian_name: string;
          id?: string;
          player_id: string;
          policy: string;
          purpose: string;
          revoked_at?: string | null;
          version?: number;
        };
        Update: {
          expires_at?: string;
          granted_at?: string;
          guardian_name?: string;
          id?: string;
          player_id?: string;
          policy?: string;
          purpose?: string;
          revoked_at?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ml_consents_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "ml_players";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_evaluations: {
        Row: {
          common: NonNullable<Json>;
          id: string;
          match_id: string;
          minutes: number | null;
          observation: string;
          player_id: string;
          position: string;
          priorities: string;
          questionnaire_version: string;
          specific: NonNullable<Json>;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          common?: NonNullable<Json>;
          id?: string;
          match_id: string;
          minutes?: number | null;
          observation?: string;
          player_id: string;
          position: string;
          priorities?: string;
          questionnaire_version?: string;
          specific?: NonNullable<Json>;
          version?: number;
        };
        Update: {
          common?: NonNullable<Json>;
          id?: string;
          match_id?: string;
          minutes?: number | null;
          observation?: string;
          player_id?: string;
          position?: string;
          priorities?: string;
          questionnaire_version?: string;
          specific?: NonNullable<Json>;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ml_evaluations_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "ml_matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_evaluations_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "ml_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_evaluations_questionnaire_version_fkey";
            columns: ["questionnaire_version"];
            isOneToOne: false;
            referencedRelation: "ml_questionnaires";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_markers: {
        Row: {
          id: string;
          kind: string;
          match_id: string;
          observation: string;
          player_id: string | null;
          position: string | null;
          seconds: number;
          theme: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          kind: string;
          match_id: string;
          observation?: string;
          player_id?: string | null;
          position?: string | null;
          seconds: number;
          theme?: string;
          version?: number;
        };
        Update: {
          id?: string;
          kind?: string;
          match_id?: string;
          observation?: string;
          player_id?: string | null;
          position?: string | null;
          seconds?: number;
          theme?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ml_markers_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "ml_matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_markers_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "ml_players";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_matches: {
        Row: {
          away_score: number | null;
          category_id: string;
          circumstances: NonNullable<Json>;
          collective: NonNullable<Json>;
          competition: string;
          context: string;
          created_at: string;
          home_score: number | null;
          id: string;
          opponent: string;
          played_on: string;
          season_id: string;
          status: string;
          updated_at: string;
          venue: string;
          version: number;
          video_name: string | null;
        };
        ComputedFields: never;
        Insert: {
          away_score?: number | null;
          category_id: string;
          circumstances?: NonNullable<Json>;
          collective?: NonNullable<Json>;
          competition?: string;
          context?: string;
          created_at?: string;
          home_score?: number | null;
          id?: string;
          opponent: string;
          played_on: string;
          season_id: string;
          status?: string;
          updated_at?: string;
          venue?: string;
          version?: number;
          video_name?: string | null;
        };
        Update: {
          away_score?: number | null;
          category_id?: string;
          circumstances?: NonNullable<Json>;
          collective?: NonNullable<Json>;
          competition?: string;
          context?: string;
          created_at?: string;
          home_score?: number | null;
          id?: string;
          opponent?: string;
          played_on?: string;
          season_id?: string;
          status?: string;
          updated_at?: string;
          venue?: string;
          version?: number;
          video_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ml_matches_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "ml_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_matches_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "ml_seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_media: {
        Row: {
          bytes: number;
          consent_id: string;
          created_at: string;
          id: string;
          mime: string;
          path: string;
          player_id: string;
          purpose: string;
          sha256: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          bytes: number;
          consent_id: string;
          created_at?: string;
          id?: string;
          mime: string;
          path: string;
          player_id: string;
          purpose: string;
          sha256: string;
          version?: number;
        };
        Update: {
          bytes?: number;
          consent_id?: string;
          created_at?: string;
          id?: string;
          mime?: string;
          path?: string;
          player_id?: string;
          purpose?: string;
          sha256?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ml_media_consent_id_fkey";
            columns: ["consent_id"];
            isOneToOne: false;
            referencedRelation: "ml_consents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_media_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "ml_players";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_members: {
        Row: {
          active: boolean;
          permissions: string[];
          role: string;
          user_id: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          permissions?: string[];
          role: string;
          user_id: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          permissions?: string[];
          role?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [];
      };
      ml_memberships: {
        Row: {
          category_id: string;
          id: string;
          jersey: number;
          player_id: string;
          season_id: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          id?: string;
          jersey: number;
          player_id: string;
          season_id: string;
          version?: number;
        };
        Update: {
          category_id?: string;
          id?: string;
          jersey?: number;
          player_id?: string;
          season_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ml_memberships_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "ml_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_memberships_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "ml_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_memberships_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "ml_seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_players: {
        Row: {
          created_at: string;
          full_name: string;
          fundamentals: NonNullable<Json>;
          id: string;
          scouting: string;
          status: string;
          strong_foot: string;
          target_profile: string;
          usual_position: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name: string;
          fundamentals?: NonNullable<Json>;
          id?: string;
          scouting?: string;
          status?: string;
          strong_foot: string;
          target_profile?: string;
          usual_position: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          fundamentals?: NonNullable<Json>;
          id?: string;
          scouting?: string;
          status?: string;
          strong_foot?: string;
          target_profile?: string;
          usual_position?: string;
          version?: number;
        };
        Relationships: [];
      };
      ml_push: {
        Row: {
          created_at: string;
          id: string;
          subscription: NonNullable<Json>;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          subscription: NonNullable<Json>;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          subscription?: NonNullable<Json>;
          user_id?: string;
        };
        Relationships: [];
      };
      ml_questionnaires: {
        Row: {
          content: NonNullable<Json>;
          created_at: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          content: NonNullable<Json>;
          created_at?: string;
          id: string;
        };
        Update: {
          content?: NonNullable<Json>;
          created_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      ml_rate_limits: {
        Row: {
          count: number;
          key: string;
          window_at: string;
        };
        ComputedFields: never;
        Insert: {
          count: number;
          key: string;
          window_at: string;
        };
        Update: {
          count?: number;
          key?: string;
          window_at?: string;
        };
        Relationships: [];
      };
      ml_reports: {
        Row: {
          correction: string;
          created_at: string;
          created_by: string;
          id: string;
          match_id: string;
          revision: number;
          snapshot: NonNullable<Json>;
          source_author: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          correction?: string;
          created_at?: string;
          created_by: string;
          id?: string;
          match_id: string;
          revision: number;
          snapshot: NonNullable<Json>;
          source_author?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          correction?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          match_id?: string;
          revision?: number;
          snapshot?: NonNullable<Json>;
          source_author?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ml_reports_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "ml_matches";
            referencedColumns: ["id"];
          },
        ];
      };
      ml_scopes: {
        Row: {
          category_id: string;
          season_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          season_id: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          season_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ml_scopes_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "ml_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_scopes_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "ml_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_scopes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ml_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      ml_seasons: {
        Row: {
          ends_on: string;
          id: string;
          name: string;
          starts_on: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          ends_on: string;
          id?: string;
          name: string;
          starts_on: string;
          version?: number;
        };
        Update: {
          ends_on?: string;
          id?: string;
          name?: string;
          starts_on?: string;
          version?: number;
        };
        Relationships: [];
      };
      ml_sessions: {
        Row: {
          expires_at: string;
          id: string;
          revoked_at: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          expires_at?: string;
          id: string;
          revoked_at?: string | null;
          user_id: string;
        };
        Update: {
          expires_at?: string;
          id?: string;
          revoked_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ml_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ml_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      ml_settings: {
        Row: {
          consent_policy: string | null;
          id: string;
          retention_days: number | null;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          consent_policy?: string | null;
          id?: string;
          retention_days?: number | null;
          version?: number;
        };
        Update: {
          consent_policy?: string | null;
          id?: string;
          retention_days?: number | null;
          version?: number;
        };
        Relationships: [];
      };
      ml_shares: {
        Row: {
          kind: string;
          resource_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          kind: string;
          resource_id: string;
          user_id: string;
        };
        Update: {
          kind?: string;
          resource_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ml_shares_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "ml_members";
            referencedColumns: ["user_id"];
          },
        ];
      };
      ml_targets: {
        Row: {
          category_id: string;
          fundamentals: NonNullable<Json>;
          id: string;
          notes: string;
          position: string;
          season_id: string;
          title: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          fundamentals?: NonNullable<Json>;
          id?: string;
          notes?: string;
          position: string;
          season_id: string;
          title: string;
          version?: number;
        };
        Update: {
          category_id?: string;
          fundamentals?: NonNullable<Json>;
          id?: string;
          notes?: string;
          position?: string;
          season_id?: string;
          title?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ml_targets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "ml_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ml_targets_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "ml_seasons";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ml_active: { Args: Record<PropertyKey, never>; Returns: boolean };
      ml_admin: {
        Args: { action: string; expected?: number; payload: Json };
        Returns: Json;
      };
      ml_article_save: {
        Args: {
          action: string;
          article: string;
          expected: number;
          payload: Json;
        };
        Returns: Json;
      };
      ml_article_valid: { Args: { doc: Json }; Returns: boolean };
      ml_attach_media: { Args: { payload: Json }; Returns: string };
      ml_create_player: {
        Args: { membership: Json; payload: Json };
        Returns: Json;
      };
      ml_direction: { Args: Record<PropertyKey, never>; Returns: boolean };
      ml_log: { Args: { action: string; details: Json }; Returns: undefined };
      ml_logout: { Args: Record<PropertyKey, never>; Returns: undefined };
      ml_match_access: {
        Args: { m: string; writing?: boolean };
        Returns: boolean;
      };
      ml_permission: { Args: { p: string }; Returns: boolean };
      ml_player_access: {
        Args: { p: string; writing?: boolean };
        Returns: boolean;
      };
      ml_published_articles: {
        Args: Record<PropertyKey, never>;
        Returns: {
          document: Json;
          slug: string;
        }[];
      };
      ml_rate: {
        Args: { k: string; maximum: number; seconds: number };
        Returns: boolean;
      };
      ml_register_session: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      ml_report: {
        Args: {
          correction?: string;
          expected: number;
          match: string;
          validate?: boolean;
        };
        Returns: Json;
      };
      ml_restore: { Args: { data: Json }; Returns: Json };
      ml_revoke_own_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      ml_save: {
        Args: { expected: number; kind: string; payload: Json };
        Returns: Json;
      };
      ml_scope: {
        Args: { c: string; s: string; writing?: boolean };
        Returns: boolean;
      };
      ml_valid_answers: { Args: { a: Json; n: number }; Returns: boolean };
      ml_valid_fundamentals: { Args: { a: Json }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
