import React from "react";
import { Link } from "wouter";
import { Pickaxe } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-0" />
      <div className="z-10 text-center space-y-6">
        <Pickaxe size={80} className="mx-auto text-primary opacity-50" />
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Page not found. Let's get you back to your dashboard.
        </p>
        <Link href="/dashboard" className="inline-block mt-4">
          <Button size="lg" className="w-48">Return to Base</Button>
        </Link>
      </div>
    </div>
  );
}
