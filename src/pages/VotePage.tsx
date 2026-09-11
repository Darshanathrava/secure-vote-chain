import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Vote, CheckCircle2, Blocks, Lock, ShieldCheck, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { castVote } from "@/lib/contract";
import api from "@/lib/api";

export default function VotePage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [election, setElection] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [faceCapturing, setFaceCapturing] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const voterId = localStorage.getItem("voterId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchElectionData();
  }, []);

  const fetchElectionData = async () => {
    try {
      const res = await api.get("/elections");
      if (res.data && res.data.length > 0) {
        setElection(res.data[0]);
        setCandidates(res.data[0].candidates || []);
        return;
      }

      const candidatesRes = await api.get("/candidates");
      setCandidates(candidatesRes.data || []);
    } catch {
      try {
        const candidatesRes = await api.get("/candidates");
        setCandidates(candidatesRes.data || []);
      } catch {
        try {
          const { getTotalCandidates, getCandidateVotes } = await import("@/lib/contract");
          const total = await getTotalCandidates();
          const list = [];
          for (let i = 1; i <= total; i++) {
            list.push(await getCandidateVotes(i));
          }
          setCandidates(list);
        } catch {
          toast({ title: "Error", description: "Could not load candidates", variant: "destructive" });
        }
      }
    }
  };

  const startCamera = async () => {
    setFaceCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast({ title: "Camera Error", description: "Could not access camera", variant: "destructive" });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg").split(",")[1];
    setFaceImage(base64);
    // Stop camera
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setFaceCapturing(false);
    toast({ title: "Photo Captured", description: "Face captured successfully" });
  };

  const handleVote = async () => {
    if (!selectedCandidate || !faceImage) return;
    if (!token || !voterId) {
      toast({ title: "Not logged in", description: "Please login first", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Cast vote on blockchain via MetaMask
      const candidateIndex = candidates.findIndex(c =>
        String(c.id) === selectedCandidate || String(c._id) === selectedCandidate
      );
      const hash = await castVote(candidateIndex + 1);

      // 2. Record vote on backend with face verification
      await api.post("/vote/cast", {
        voterId,
        faceImageBase64: faceImage,
        candidateId: candidateIndex + 1,
        transactionHash: hash,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setTxHash(hash);
      setSubmitted(true);
      toast({ title: "Vote Recorded on Blockchain", description: "Your encrypted vote has been confirmed." });
    } catch (err: any) {
      toast({
        title: "Vote Failed",
        description: err?.response?.data?.error || err.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg">
          <Card className="border-success/30">
            <CardContent className="flex flex-col items-center p-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold">Vote Successfully Cast</h2>
              <p className="mt-2 text-muted-foreground">Your vote has been encrypted and permanently recorded on the blockchain.</p>
              <div className="mt-6 w-full space-y-3">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Transaction Hash</p>
                  <p className="mt-1 break-all font-mono text-xs">{txHash}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 text-center">
                    <Blocks className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-xs text-muted-foreground">On-Chain</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 text-center">
                    <Lock className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-xs text-muted-foreground">Encrypted</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 text-center">
                    <ShieldCheck className="mx-auto h-5 w-5 text-success" />
                    <p className="mt-1 text-xs text-muted-foreground">Verified</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <Vote className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-bold">{election?.title || "General Election"}</h1>
            <p className="text-muted-foreground">{election?.description || "Cast your vote securely"}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
          <Lock className="h-4 w-4 text-warning" />
          <span>Your ballot is encrypted end-to-end. Face verification required before voting.</span>
        </div>

        {/* Face Verification Section */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h2 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" /> Face Verification
            </h2>
            {!faceImage ? (
              <>
                {faceCapturing ? (
                  <div className="space-y-3">
                    <video ref={videoRef} autoPlay className="w-full rounded-lg" />
                    <Button onClick={capturePhoto} className="w-full">Capture Photo</Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={startCamera} className="w-full gap-2">
                    <Camera className="h-4 w-4" /> Start Camera for Face Verification
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-success/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm text-success font-medium">Face captured — ready to vote</span>
                <Button variant="ghost" size="sm" onClick={() => setFaceImage(null)}>Retake</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidates */}
        <div className="mt-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Select Your Candidate</h2>
          {candidates.length === 0 && (
            <p className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              No candidates have been added yet. An admin can add them from the Admin dashboard.
            </p>
          )}
          {candidates.map((candidate, i) => (
            <motion.div key={candidate.id || candidate._id || i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCandidate === String(candidate.id || candidate._id)
                    ? "border-primary ring-2 ring-primary/20" : "border-border/50"
                }`}
                onClick={() => setSelectedCandidate(String(candidate.id || candidate._id))}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                    {candidate.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold">{candidate.name}</h3>
                    <p className="text-sm text-primary">{candidate.party}</p>
                  </div>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                    selectedCandidate === String(candidate.id || candidate._id)
                      ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {selectedCandidate === String(candidate.id || candidate._id) && (
                      <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Button
          size="lg" className="mt-8 w-full gap-2"
          disabled={!selectedCandidate || !faceImage || loading}
          onClick={handleVote}
        >
          <Vote className="h-5 w-5" />
          {loading ? "Processing..." : "Cast My Vote on Blockchain"}
        </Button>
      </div>
    </div>
  );
}