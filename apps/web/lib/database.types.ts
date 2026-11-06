// Hand-written to match supabase/migrations/0001_init.sql. Keep in sync manually
// (no hosted project to generate `supabase gen types` from yet).
export interface Database {
  public: {
    Tables: {
      payouts: {
        Row: {
          id: string;
          idempotency_key: string;
          device_hash: string;
          recipient_name: string;
          recipient_address: string;
          amount_stroops: string;
          asset: string;
          due_at: string;
          status: string;
          authorization_nonce: string | null;
          authorization_tx_hash: string | null;
          claim_tx_hash: string | null;
          failure_reason: string | null;
          lease_token: string | null;
          lease_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          idempotency_key: string;
          device_hash: string;
          recipient_name: string;
          recipient_address: string;
          amount_stroops: string;
          asset: string;
          due_at: string;
          status?: string;
          authorization_nonce?: string | null;
          authorization_tx_hash?: string | null;
          claim_tx_hash?: string | null;
          failure_reason?: string | null;
          lease_token?: string | null;
          lease_expires_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payouts"]["Insert"]>;
        Relationships: [];
      };
      agent_decisions: {
        Row: {
          id: string;
          payout_id: string;
          action: string;
          reason: string;
          detail: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          payout_id: string;
          action: string;
          reason: string;
          detail?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_decisions"]["Insert"]>;
        Relationships: [];
      };
      funding_requests: {
        Row: {
          id: string;
          payout_id: string | null;
          payment_intent_id: string;
          checkout_url: string | null;
          amount: string;
          asset: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payout_id?: string | null;
          payment_intent_id: string;
          checkout_url?: string | null;
          amount: string;
          asset: string;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["funding_requests"]["Insert"]>;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          source: string;
          event_type: string;
          payload: Record<string, unknown>;
          received_at: string;
        };
        Insert: {
          id: string;
          source: string;
          event_type: string;
          payload: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_events"]["Insert"]>;
        Relationships: [];
      };
      payout_nonce_sequences: {
        Row: { device_hash: string; next_nonce: string };
        Insert: { device_hash: string; next_nonce: string };
        Update: Partial<Database["public"]["Tables"]["payout_nonce_sequences"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_due_payouts: {
        Args: { p_now: string; p_limit?: number; p_lease_seconds?: number };
        Returns: Database["public"]["Tables"]["payouts"]["Row"][];
      };
    };
    Enums: Record<string, never>;
  };
}
