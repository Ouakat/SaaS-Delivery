"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNetworkStore } from "@/lib/stores/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@demo-tenant.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const { login, isLoading } = useNetworkStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = await login(email, password);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-center">Network Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demo-tenant.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 text-sm text-muted-foreground text-center">
            <p>Demo credentials are pre-filled</p>
            <p>Tenant: demo-tenant</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
