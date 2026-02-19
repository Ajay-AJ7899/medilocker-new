import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const AdminRoles = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
          Role Management
        </h1>
        <p className="text-sm text-muted-foreground">Assign and manage user roles</p>
      </div>

      <Card className="border-border glass">
        <CardContent className="flex flex-col items-center p-12 text-center">
          <Shield className="mb-4 h-12 w-12 text-primary/40" />
          <p className="text-muted-foreground">
            Role management interface coming soon. Currently roles can be managed through the backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRoles;
