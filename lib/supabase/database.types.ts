
export type Database = {
  public: {
    Tables: {
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          status: string;
          source: string | null;
          consented_at: string | null;
          confirmed_at: string | null;
          unsubscribed_at: string | null;
          confirmation_token_hash: string | null;
          confirmation_token_expires_at: string | null;
          unsubscribe_token_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          status?: string;
          source?: string | null;
          consented_at?: string | null;
          confirmed_at?: string | null;
          unsubscribed_at?: string | null;
          confirmation_token_hash?: string | null;
          confirmation_token_expires_at?: string | null;
          unsubscribe_token_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          status?: string;
          source?: string | null;
          consented_at?: string | null;
          confirmed_at?: string | null;
          unsubscribed_at?: string | null;
          confirmation_token_hash?: string | null;
          confirmation_token_expires_at?: string | null;
          unsubscribe_token_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      newsletter_campaigns: {
        Row: {
          id: string;
          subject: string;
          title: string;
          content: string;
          status: string;
          resend_broadcast_id: string | null;
          scheduled_at: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject: string;
          title: string;
          content: string;
          status?: string;
          resend_broadcast_id?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject?: string;
          title?: string;
          content?: string;
          status?: string;
          resend_broadcast_id?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
