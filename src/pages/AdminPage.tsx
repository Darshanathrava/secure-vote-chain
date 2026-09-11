import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, Vote, BarChart3, Blocks, Activity,
  LogOut, Plus, Trash2, Edit2, MapPin, CheckCircle2, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  // Candidate form
  const [newCandidate, setNewCandidate] = useState({ name: "", party: "", region: "National", blockchainCandidateId: "" });
  const [editingCandidate, setEditingCandidate] = useState<any>(null);

  // Region form
  const [newRegion, setNewRegion] = useState({ name: "", code: "", description: "" });

  const { toast } = useToast();

  const adminToken = () => localStorage.getItem("adminToken");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${adminToken()}` }
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) { setIsLoggedIn(true); fetchAll(); }
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, candidatesRes, regionsRes] = await Promise.all([
        api.get("/admin/stats", authHeaders()),
        api.get("/admin/candidates", authHeaders()),
        api.get("/admin/regions", authHeaders()),
      ]);
      setStats(statsRes.data);
      setCandidates(candidatesRes.data);
      setRegions(regionsRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await api.post("/admin/login", { username, password });
      localStorage.setItem("adminToken", res.data.token);
      setIsLoggedIn(true);
      toast({ title: "Welcome, Admin!", description: "Logged in successfully." });
      fetchAll();
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err?.response?.data?.error || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsLoggedIn(false);
    setStats(null);
    setCandidates([]);
    setRegions([]);
  };

  // ── CANDIDATES ──
  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.party) {
      toast({ title: "Missing fields", description: "Name and party are required", variant: "destructive" });
      return;
    }
    try {
      await api.post("/admin/candidates", newCandidate, authHeaders());
      setNewCandidate({ name: "", party: "", region: "National", blockchainCandidateId: "" });
      fetchAll();
      toast({ title: "Candidate Added ✓" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error, variant: "destructive" });
    }
  };

  const handleUpdateCandidate = async () => {
    if (!editingCandidate) return;
    try {
      await api.put(`/admin/candidates/${editingCandidate._id}`, editingCandidate, authHeaders());
      setEditingCandidate(null);
      fetchAll();
      toast({ title: "Candidate Updated ✓" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error, variant: "destructive" });
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    try {
      await api.delete(`/admin/candidates/${id}`, authHeaders());
      fetchAll();
      toast({ title: "Candidate Deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error, variant: "destructive" });
    }
  };

  // ── REGIONS ──
  const handleAddRegion = async () => {
    if (!newRegion.name || !newRegion.code) {
      toast({ title: "Missing fields", description: "Name and code are required", variant: "destructive" });
      return;
    }
    try {
      await api.post("/admin/regions", newRegion, authHeaders());
      setNewRegion({ name: "", code: "", description: "" });
      fetchAll();
      toast({ title: "Region Added ✓" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error, variant: "destructive" });
    }
  };

  const handleDeleteRegion = async (id: string) => {
    if (!confirm("Delete this region?")) return;
    try {
      await api.delete(`/admin/regions/${id}`, authHeaders());
      fetchAll();
      toast({ title: "Region Deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error, variant: "destructive" });
    }
  };

  // ── LOGIN SCREEN ──
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4 font-display text-2xl">Admin Access</CardTitle>
                <p className="text-sm text-muted-foreground">Restricted area — authorized personnel only</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="adminUser">Username</Label>
                  <Input id="adminUser" placeholder="Enter admin username"
                    value={username} onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <div>
                  <Label htmlFor="adminPass">Password</Label>
                  <Input id="adminPass" type="password" placeholder="Enter admin password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <Button className="w-full gap-2" onClick={handleLogin} disabled={loginLoading}>
                  <Shield className="h-4 w-4" />
                  {loginLoading ? "Authenticating..." : "Login to Admin Panel"}
                </Button>

                <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">First time setup?</p>
                  <p>Run this in your terminal to create the admin account:</p>
                  <code className="mt-1 block font-mono text-xs">
                    curl -X POST http://localhost:1322/api/admin/setup -H "Content-Type: application/json" -d "{`{\"username\":\"admin\",\"password\":\"admin123\"}`}"
                  </code>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── ADMIN DASHBOARD ──
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Election management & system monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="gap-1 bg-success/10 text-success border-success/30">
            <Activity className="h-3 w-3" /> System Online
          </Badge>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { icon: Users, label: "Registered Voters", value: stats.voters, color: "text-primary" },
            { icon: Vote, label: "Votes Cast", value: stats.votedCount, color: "text-secondary" },
            { icon: BarChart3, label: "Candidates", value: stats.candidates, color: "text-accent" },
            { icon: MapPin, label: "Regions", value: stats.regions, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}>
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
      )}

      <Tabs defaultValue="candidates" className="mt-8">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="regions">Voting Regions</TabsTrigger>
          <TabsTrigger value="voters">Voters</TabsTrigger>
        </TabsList>

        {/* ── CANDIDATES TAB ── */}
        <TabsContent value="candidates" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Add New Candidate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingCandidate ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-primary">Editing: {editingCandidate.name}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input value={editingCandidate.name}
                        onChange={e => setEditingCandidate({ ...editingCandidate, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Party</Label>
                      <Input value={editingCandidate.party}
                        onChange={e => setEditingCandidate({ ...editingCandidate, party: e.target.value })} />
                    </div>
                    <div>
                      <Label>Region</Label>
                      <Input value={editingCandidate.region}
                        onChange={e => setEditingCandidate({ ...editingCandidate, region: e.target.value })} />
                    </div>
                    <div>
                      <Label>Blockchain ID</Label>
                      <Input type="number" value={editingCandidate.blockchainCandidateId}
                        onChange={e => setEditingCandidate({ ...editingCandidate, blockchainCandidateId: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateCandidate} className="gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingCandidate(null)} className="gap-2">
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Candidate Name</Label>
                    <Input placeholder="Full name" value={newCandidate.name}
                      onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Party</Label>
                    <Input placeholder="Political party" value={newCandidate.party}
                      onChange={e => setNewCandidate({ ...newCandidate, party: e.target.value })} />
                  </div>
                  <div>
                    <Label>Region</Label>
                    <Input placeholder="National" value={newCandidate.region}
                      onChange={e => setNewCandidate({ ...newCandidate, region: e.target.value })} />
                  </div>
                  <div>
                    <Label>Blockchain Candidate ID</Label>
                    <Input type="number" placeholder="e.g. 1" value={newCandidate.blockchainCandidateId}
                      onChange={e => setNewCandidate({ ...newCandidate, blockchainCandidateId: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Button onClick={handleAddCandidate} className="gap-2">
                      <Plus className="h-4 w-4" /> Add Candidate
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {candidates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No candidates yet. Add one above.</p>
            ) : candidates.map((c) => (
              <Card key={c._id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {c.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-primary">{c.party}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {c.region} — Blockchain ID: {c.blockchainCandidateId || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingCandidate(c)} className="gap-1">
                      <Edit2 className="h-3 w-3" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCandidate(c._id)} className="gap-1">
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── REGIONS TAB ── */}
        <TabsContent value="regions" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Add Voting Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Region Name</Label>
                  <Input placeholder="e.g. Karnataka" value={newRegion.name}
                    onChange={e => setNewRegion({ ...newRegion, name: e.target.value })} />
                </div>
                <div>
                  <Label>Region Code</Label>
                  <Input placeholder="e.g. KA" value={newRegion.code}
                    onChange={e => setNewRegion({ ...newRegion, code: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input placeholder="Optional description" value={newRegion.description}
                    onChange={e => setNewRegion({ ...newRegion, description: e.target.value })} />
                </div>
                <div className="col-span-3">
                  <Button onClick={handleAddRegion} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Region
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            {regions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 col-span-2">No regions yet. Add one above.</p>
            ) : regions.map((r) => (
              <Card key={r._id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.code} {r.description && `— ${r.description}`}</p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteRegion(r._id)} className="gap-1">
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── VOTERS TAB ── */}
        <TabsContent value="voters" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Voter Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="font-display text-2xl font-bold text-primary">{stats.voters}</p>
                      <p className="text-xs text-muted-foreground">Total Registered</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="font-display text-2xl font-bold text-success">{stats.votedCount}</p>
                      <p className="text-xs text-muted-foreground">Voted</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="font-display text-2xl font-bold text-warning">
                        {stats.voters - stats.votedCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Yet to Vote</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <p className="text-sm font-medium">Turnout Rate</p>
                    <div className="mt-2 h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${stats.voters > 0 ? (stats.votedCount / stats.voters * 100) : 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stats.voters > 0 ? ((stats.votedCount / stats.voters) * 100).toFixed(1) : 0}% participation
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}