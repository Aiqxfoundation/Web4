import React, { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin, useSignup, useRecoverPassword } from "@workspace/api-client-react";
import { Button, Input, Card, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function Auth({ mode: initialMode }: { mode: 'login' | 'signup' | 'recovery' }) {
  const [mode, setMode] = useState(initialMode);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    username: "", password: "", confirmPassword: "", 
    recoveryQuestion: "", recoveryAnswer: "", newPassword: "", referredBy: ""
  });

  const { mutate: login, isPending: isLoggingIn } = useLogin();
  const { mutate: signup, isPending: isSigningUp } = useSignup();
  const { mutate: recover, isPending: isRecovering } = useRecoverPassword();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ data: { username: form.username, password: form.password } }, {
      onSuccess: (res) => {
        localStorage.setItem('etr_token', res.token);
        queryClient.invalidateQueries();
        setLocation('/dashboard');
      },
      onError: (err: any) => toast.error(err.error || "Login failed")
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    signup({ data: form }, {
      onSuccess: (res) => {
        localStorage.setItem('etr_token', res.token);
        queryClient.invalidateQueries();
        toast.success("Account created successfully!");
        setLocation('/dashboard');
      },
      onError: (err: any) => toast.error(err.error || "Signup failed")
    });
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    recover({ data: { username: form.username, recoveryAnswer: form.recoveryAnswer, newPassword: form.newPassword } }, {
      onSuccess: () => {
        toast.success("Password recovered successfully! Please login.");
        setMode('login');
      },
      onError: (err: any) => toast.error(err.error || "Recovery failed")
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background p-4 overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/logo-icon.png`} 
          alt="" 
          className="w-[600px] h-[600px] object-contain opacity-[0.03] rotate-12" 
        />
      </div>

      <Card className="w-full max-w-md p-8 z-10 border-border shadow-xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-xl font-bold text-foreground">ETR Mining</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' ? 'Login to your ETR mining account' : mode === 'signup' ? 'Create an account to start mining gems' : 'Reset your lost password'}
          </p>
        </div>

        {/* Mode Switcher */}
        {mode !== 'recovery' && (
          <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-6">
            <button
              onClick={() => setMode('login')}
              className={cn(
                "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
                mode === 'login' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
                mode === 'signup' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign Up
            </button>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label>Username</Label>
              <Input name="username" value={form.username} onChange={handleChange} required placeholder="Enter your username" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0">Password</Label>
                <button 
                  type="button" 
                  onClick={() => setMode('recovery')} 
                  className="text-xs text-primary hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <Input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full h-11" disabled={isLoggingIn}>
              {isLoggingIn ? 'Authenticating...' : 'Login'}
            </Button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input name="username" value={form.username} onChange={handleChange} required placeholder="Choose a username" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Password</Label>
                <Input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="••••••••" />
              </div>
              <div>
                <Label>Confirm</Label>
                <Input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required minLength={6} placeholder="••••••••" />
              </div>
            </div>
            <div>
              <Label>Recovery Question</Label>
              <Input name="recoveryQuestion" value={form.recoveryQuestion} onChange={handleChange} required placeholder="e.g. First pet's name" />
            </div>
            <div>
              <Label>Recovery Answer</Label>
              <Input name="recoveryAnswer" value={form.recoveryAnswer} onChange={handleChange} required placeholder="Your answer" />
            </div>
            <div>
              <Label>Referral Code (Optional)</Label>
              <Input name="referredBy" value={form.referredBy} onChange={handleChange} placeholder="Username of referrer" />
            </div>
            <Button type="submit" className="w-full h-11 mt-2" disabled={isSigningUp}>
              {isSigningUp ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        )}

        {mode === 'recovery' && (
          <form onSubmit={handleRecovery} className="space-y-5">
            <div>
              <Label>Username</Label>
              <Input name="username" value={form.username} onChange={handleChange} required placeholder="Enter your username" />
            </div>
            <div>
              <Label>Recovery Answer</Label>
              <Input name="recoveryAnswer" value={form.recoveryAnswer} onChange={handleChange} required placeholder="Enter your answer" />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required minLength={6} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full h-11" disabled={isRecovering}>
              {isRecovering ? 'Resetting...' : 'Reset Password'}
            </Button>
            <div className="text-center text-sm mt-4">
              <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">Back to Login</button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
