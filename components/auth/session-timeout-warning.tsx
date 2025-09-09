"use client";

import { useState, useEffect } from "react";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SessionTimeoutWarningProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onLogout: () => void;
  timeoutDuration?: number; // in seconds
  warningDuration?: number; // in seconds
}

export function SessionTimeoutWarning({
  isOpen,
  onExtendSession,
  onLogout,
  timeoutDuration = 300, // 5 minutes default
  warningDuration = 60, // 1 minute warning default
}: SessionTimeoutWarningProps) {
  const [timeLeft, setTimeLeft] = useState(warningDuration);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(warningDuration);
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        const newProgress = (newTime / warningDuration) * 100;
        setProgress(Math.max(0, newProgress));

        if (newTime <= 0) {
          onLogout();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, warningDuration, onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExtendSession = () => {
    onExtendSession();
    setTimeLeft(warningDuration);
    setProgress(100);
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Your session will expire in{" "}
              <span className="font-mono font-semibold text-orange-600">
                {formatTime(timeLeft)}
              </span>
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Time remaining</span>
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <p className="text-sm text-muted-foreground">
              To continue your session, click "Stay Logged In". Otherwise,
              you'll be automatically logged out for security.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout Now
            </Button>
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button onClick={handleExtendSession}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Stay Logged In
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
