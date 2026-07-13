import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getTotalCandidates, getCandidateVotes } from "@/lib/contract";
import api from "@/lib/api";

export default function ResultsPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      // Try backend first
      const res = await api.get("/elections");
      if (res.data?.[0]?.candidates) {
        setCandidates(res.data[0].candidates);
        return;
      }
    } catch {}

    // Fallback: read directly from blockchain
    try {
      const total = await getTotalCandidates();
      const list = [];
      for (let i = 1; i <= total; i++) {
        list.push(await getCandidateVotes(i));
      }
      setCandidates(list);
    } catch (err) {
      console.error("Could not fetch results:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = candidates.reduce((s, c) => s + (c.voteCount || c.votes || 0), 0);
  const chartData = candidates.map((c, i) => ({
    name: c.name?.split(" ").pop() || `C${i+1}`,
    votes: c.voteCount || c.votes || 0,
    color: ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981"][i % 4],
  }));

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Election Results</h1>
      <p className="mt-2 text-muted-foreground">Real-time, blockchain-verified vote tallying</p>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading results from blockchain...</p>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <BarChart3 className="h-5 w-5 text-primary" /> Vote Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalVotes > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(val: number) => val.toLocaleString()} />
                    <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                  No votes yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Candidate Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidates.map((c, i) => {
                const votes = c.voteCount || c.votes || 0;
                const pct = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0";
                const colors = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981"];
                return (
                  <motion.div key={c.id || i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[i % 4] }} />
                        <span className="font-medium">{c.name}</span>
                        {i === 0 && totalVotes > 0 && (
                          <Badge variant="default" className="text-[10px]">Leading</Badge>
                        )}
                      </div>
                      <span className="font-display font-bold">{pct}%</span>
                    </div>
                    <Progress value={Number(pct)} className="mt-1 h-2" />
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {votes.toLocaleString()} votes — {c.party}
                    </p>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}