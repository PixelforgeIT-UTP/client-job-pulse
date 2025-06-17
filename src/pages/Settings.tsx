
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { user, userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Email</span>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Role</span>
              <Badge variant={userProfile?.role === 'admin' ? 'default' : 'secondary'}>
                {userProfile?.role || 'user'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Account Created</span>
              <span className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Additional settings and preferences will be available here in future updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
