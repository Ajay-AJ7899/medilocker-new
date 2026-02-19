import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  wallet_address: string;
  onboarding_complete: boolean;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("user_id, full_name, wallet_address, onboarding_complete, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUsers((data as UserProfile[]) || []);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
          User Management
        </h1>
        <p className="text-sm text-muted-foreground">{users.length} registered users</p>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.user_id} className="border-border glass">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{u.full_name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {u.wallet_address.slice(0, 10)}...{u.wallet_address.slice(-6)}
                </p>
              </div>
              <Badge variant={u.onboarding_complete ? "default" : "secondary"}>
                {u.onboarding_complete ? "Active" : "Pending"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
