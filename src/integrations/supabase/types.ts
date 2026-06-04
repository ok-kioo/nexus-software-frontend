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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerta_historico: {
        Row: {
          actor_id: string | null
          alerta_id: string
          created_at: string
          evento: string
          id: string
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          alerta_id: string
          created_at?: string
          evento: string
          id?: string
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          alerta_id?: string
          created_at?: string
          evento?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "alerta_historico_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas: {
        Row: {
          created_at: string
          descricao: string
          entidade: string
          entidade_id: string | null
          first_seen_at: string
          id: string
          last_seen_at: string
          metricas: Json
          plano_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tipo: string
          titulo: string
          unidade: string | null
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          entidade: string
          entidade_id?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metricas?: Json
          plano_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string
          tipo: string
          titulo: string
          unidade?: string | null
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          entidade?: string
          entidade_id?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metricas?: Json
          plano_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tipo?: string
          titulo?: string
          unidade?: string | null
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      alunos: {
        Row: {
          created_at: string
          data_nascimento: string | null
          documento: string
          email: string | null
          id: string
          nome_aluno: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          documento: string
          email?: string | null
          id?: string
          nome_aluno: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          documento?: string
          email?: string | null
          id?: string
          nome_aluno?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          acao: string
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          entidade: string
          id: string
          registro_id: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          entidade: string
          id?: string
          registro_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          entidade?: string
          id?: string
          registro_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      avisos: {
        Row: {
          autor_id: string
          corpo: string
          created_at: string
          fixado: boolean
          id: string
          publico_alvo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          corpo: string
          created_at?: string
          fixado?: boolean
          id?: string
          publico_alvo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          corpo?: string
          created_at?: string
          fixado?: boolean
          id?: string
          publico_alvo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      avisos_leituras: {
        Row: {
          aviso_id: string
          id: string
          lido_em: string
          user_id: string
        }
        Insert: {
          aviso_id: string
          id?: string
          lido_em?: string
          user_id: string
        }
        Update: {
          aviso_id?: string
          id?: string
          lido_em?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_leituras_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos_aluno: {
        Row: {
          aluno_id: string
          autor_id: string
          created_at: string
          descricao: string
          id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          autor_id: string
          created_at?: string
          descricao: string
          id?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          autor_id?: string
          created_at?: string
          descricao?: string
          id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contatos_aluno_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          carga_horaria: number | null
          categoria: string
          created_at: string
          id: string
          nome_curso: string
          status: string
          updated_at: string
        }
        Insert: {
          carga_horaria?: number | null
          categoria: string
          created_at?: string
          id?: string
          nome_curso: string
          status?: string
          updated_at?: string
        }
        Update: {
          carga_horaria?: number | null
          categoria?: string
          created_at?: string
          id?: string
          nome_curso?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      eventos_calendario: {
        Row: {
          created_at: string
          criado_por: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          tipo: string
          titulo: string
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          tipo?: string
          titulo: string
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          tipo?: string
          titulo?: string
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_calendario_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencia: {
        Row: {
          created_at: string
          data: string
          id: string
          matricula_id: string
          observacao: string | null
          presente: boolean
          registrado_por: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          matricula_id: string
          observacao?: string | null
          presente: boolean
          registrado_por?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          matricula_id?: string
          observacao?: string | null
          presente?: boolean
          registrado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          created_at: string
          current_step: string | null
          error_message: string | null
          file_name: string
          file_size_bytes: number
          finished_at: string | null
          id: string
          inserted_count: number
          processed_chunks: number
          processed_rows: number
          progress_pct: number
          result_summary: Json | null
          selected_entities: string[] | null
          skipped_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["import_job_status"]
          storage_path: string
          total_chunks: number | null
          total_rows: number | null
          updated_at: string
          user_id: string
          validation_errors: Json | null
        }
        Insert: {
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          file_name: string
          file_size_bytes: number
          finished_at?: string | null
          id?: string
          inserted_count?: number
          processed_chunks?: number
          processed_rows?: number
          progress_pct?: number
          result_summary?: Json | null
          selected_entities?: string[] | null
          skipped_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_job_status"]
          storage_path: string
          total_chunks?: number | null
          total_rows?: number | null
          updated_at?: string
          user_id: string
          validation_errors?: Json | null
        }
        Update: {
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          file_name?: string
          file_size_bytes?: number
          finished_at?: string | null
          id?: string
          inserted_count?: number
          processed_chunks?: number
          processed_rows?: number
          progress_pct?: number
          result_summary?: Json | null
          selected_entities?: string[] | null
          skipped_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["import_job_status"]
          storage_path?: string
          total_chunks?: number | null
          total_rows?: number | null
          updated_at?: string
          user_id?: string
          validation_errors?: Json | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          is_test: boolean
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          turma_ids: string[]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          is_test?: boolean
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          turma_ids?: string[]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          is_test?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          turma_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      matriculas: {
        Row: {
          aluno_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          numero_matricula: string
          status: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          numero_matricula: string
          status?: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          numero_matricula?: string
          status?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas: {
        Row: {
          created_at: string
          id: string
          matricula_id: string
          nota_1: number | null
          nota_2: number | null
          nota_3: number | null
          nota_4: number | null
          observacao: string | null
          registrado_por: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          matricula_id: string
          nota_1?: number | null
          nota_2?: number | null
          nota_3?: number | null
          nota_4?: number | null
          observacao?: string | null
          registrado_por?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          matricula_id?: string
          nota_1?: number | null
          nota_2?: number | null
          nota_3?: number | null
          nota_4?: number | null
          observacao?: string | null
          registrado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: true
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_acao: {
        Row: {
          aluno_id: string
          concluido_em: string | null
          created_at: string
          criado_por: string
          descricao: string
          id: string
          origem_alerta: string | null
          prazo: string | null
          prioridade: string
          responsavel_id: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          concluido_em?: string | null
          created_at?: string
          criado_por: string
          descricao: string
          id?: string
          origem_alerta?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          concluido_em?: string | null
          created_at?: string
          criado_por?: string
          descricao?: string
          id?: string
          origem_alerta?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_acao_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      turma_professores: {
        Row: {
          created_at: string
          id: string
          professor_id: string
          turma_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          professor_id: string
          turma_id: string
        }
        Update: {
          created_at?: string
          id?: string
          professor_id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_professores_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          capacidade: number
          created_at: string
          curso_id: string
          id: string
          nome_turma: string
          periodo: string | null
          status: string
          turno: string | null
          unidade_id: string
          updated_at: string
        }
        Insert: {
          capacidade?: number
          created_at?: string
          curso_id: string
          id?: string
          nome_turma: string
          periodo?: string | null
          status?: string
          turno?: string | null
          unidade_id: string
          updated_at?: string
        }
        Update: {
          capacidade?: number
          created_at?: string
          curso_id?: string
          id?: string
          nome_turma?: string
          periodo?: string | null
          status?: string
          turno?: string | null
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          cidade: string
          created_at: string
          estado: string
          id: string
          nome_unidade: string
          status: string
          updated_at: string
        }
        Insert: {
          cidade: string
          created_at?: string
          estado: string
          id?: string
          nome_unidade: string
          status?: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          created_at?: string
          estado?: string
          id?: string
          nome_unidade?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { _token: string; _user_id: string }
        Returns: Json
      }
      can_assign_role: {
        Args: {
          _assigner: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      delete_test_invites: { Args: never; Returns: number }
      get_invite_by_token: {
        Args: { _token: string }
        Returns: {
          email: string
          expires_at: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_initial_import_required: { Args: never; Returns: boolean }
      is_professor_of_turma: {
        Args: { _turma_id: string; _user_id: string }
        Returns: boolean
      }
      promote_to_admin: { Args: { _email: string }; Returns: Json }
    }
    Enums: {
      app_role: "administrador" | "gestor" | "professor"
      import_job_status:
        | "queued"
        | "parsing"
        | "validating"
        | "persisting"
        | "completed"
        | "failed"
        | "cancelled"
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
      app_role: ["administrador", "gestor", "professor"],
      import_job_status: [
        "queued",
        "parsing",
        "validating",
        "persisting",
        "completed",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
