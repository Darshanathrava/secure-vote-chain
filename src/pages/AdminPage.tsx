import { motion } from "framer-motion";
import { Shield, Users, Vote, BarChart3, Blocks, Activity, Settings, FileText, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockElections, mockTransactions, systemStats } from "@/lib/votingData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Election management & system monitoring</p>
        </div>
        <Badge className="gap-1 bg-success/10 text-success border-success/30">
          <Activity className="h-3 w-3" /> System Online
        </Badge>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { icon: Vote, label: "Total Elections", value: systemStats.totalElections, color: "text-primary" },
          { icon: Users, label: "Registered Voters", value: systemStats.registeredVoters.toLocaleString(), color: "text-secondary" },
          { icon: BarChart3, label: "Total Votes Cast", value: systemStats.totalVotesCast.toLocaleString(), color: "text-accent" },
          { icon: Blocks, label: "Blockchain Blocks", value: systemStats.blockchainBlocks.toLocaleString(), color: "text-primary" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                <p className="mt-2 font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="elections" className="mt-8">
        <TabsList>
          <TabsTrigger value="elections">Elections</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="elections" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">All Elections</h2>
            <Button size="sm" className="gap-1"><Settings className="h-4 w-4" /> Create Election</Button>
          </div>
          {mockElections.map((el) => (
            <Card key={el.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-display font-semibold">{el.title}</h3>
                  <p className="text-sm text-muted-foreground">{el.startDate} — {el.endDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-display text-lg font-bold">{el.votesCast.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">of {el.totalVoters.toLocaleString()}</p>
                  </div>
                  <Badge variant={el.status === "active" ? "default" : el.status === "completed" ? "secondary" : "outline"}>
                    {el.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="blockchain" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Blockchain Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTransactions.map((tx) => (
                  <div key={tx.hash} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tx.type === "vote" ? "bg-primary/10 text-primary" : tx.type === "registration" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent"}`}>
                        {tx.type === "vote" ? <Vote className="h-4 w-4" /> : tx.type === "registration" ? <Users className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-mono text-xs">{tx.hash}</p>
                        <p className="text-xs text-muted-foreground">Block #{tx.block.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{tx.type}</Badge>
                      <span className={`text-xs ${tx.status === "confirmed" ? "text-success" : "text-warning"}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Encryption", value: systemStats.encryptionStrength, status: "ok" },
                  { label: "Uptime", value: `${systemStats.uptime}%`, status: "ok" },
                  { label: "Avg Verification Time", value: `${systemStats.averageVerificationTime}s`, status: "ok" },
                  { label: "Active Threats", value: "0 detected", status: "ok" },
                  { label: "Last Security Scan", value: "2 hours ago", status: "ok" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.value}</span>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Security Protocols</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "AES-256-GCM data encryption at rest",
                  "TLS 1.3 transport layer security",
                  "Homomorphic encryption for vote tallying",
                  "WebAuthn/FIDO2 biometric protocol",
                  "Smart contract audit (CertiK verified)",
                  "Rate limiting & DDoS protection",
                ].map((protocol) => (
                  <div key={protocol} className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>{protocol}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
