import React from "react";
import { toast } from "sonner";
import { Card, Button, Badge, StatCard } from "@/components/ui";
import { useGetMyReferrals } from "@workspace/api-client-react";
import { formatGems } from "@/lib/utils";
import { Users, Copy, Network, Share2, Gem } from "lucide-react";
import { format } from "date-fns";

export default function Referral() {
  const { data: refData, isLoading } = useGetMyReferrals();

  const handleCopy = () => {
    if (!refData) return;
    const link = `${window.location.origin}/signup?ref=${refData.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  if (isLoading) return <div className="p-8 text-primary">Loading network...</div>;
  if (!refData) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Referral Program</h1>
        <p className="text-muted-foreground mt-1">Build your network and earn commissions from your referrals' mining activity.</p>
      </header>

      <Card className="p-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Your Referral Link</h2>
              <p className="text-sm text-muted-foreground">Share this link to invite new members to your syndicate.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="flex-1 bg-secondary/50 border border-border px-4 py-3 rounded-lg font-mono text-sm text-primary break-all flex items-center">
              {window.location.origin}/signup?ref={refData.referralCode}
            </div>
            <Button onClick={handleCopy} className="shrink-0">
              <Copy className="mr-2" size={18}/> Copy Link
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Level 1 Referrals" 
          value={refData.level1.length} 
          subtitle="Earn 15% commission"
          icon={<Users size={20} />}
        />
        <StatCard 
          title="Level 2 Referrals" 
          value={refData.level2.length} 
          subtitle="Earn 5% commission"
          icon={<Network size={20} />}
        />
        <StatCard 
          title="Total Rewards" 
          value={formatGems(refData.totalRewardGems)} 
          subtitle="Gems earned"
          icon={<Gem size={20} />}
          color="text-primary"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users size={20} className="text-primary" /> Level 1
            </h2>
            <Badge variant="success">15% Reward</Badge>
          </div>
          <div className="p-0 flex-1">
            {!refData.level1.length ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground text-sm">No direct referrals yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {refData.level1.map(u => (
                  <div key={u.username} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                    <div>
                      <p className="font-semibold text-foreground">{u.username}</p>
                      <p className="text-xs text-muted-foreground">Joined {format(new Date(u.joinedAt), 'MMM d, yyyy')}</p>
                    </div>
                    <Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Network size={20} className="text-accent" /> Level 2
            </h2>
            <Badge variant="info">5% Reward</Badge>
          </div>
          <div className="p-0 flex-1">
            {!refData.level2.length ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground text-sm">No secondary referrals yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {refData.level2.map(u => (
                  <div key={u.username} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                    <div>
                      <p className="font-semibold text-foreground">{u.username}</p>
                      <p className="text-xs text-muted-foreground">Joined {format(new Date(u.joinedAt), 'MMM d, yyyy')}</p>
                    </div>
                    <Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
