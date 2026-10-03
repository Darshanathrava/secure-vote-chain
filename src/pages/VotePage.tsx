import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Vote, CheckCircle2, Lock, ShieldCheck, Camera, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFingerprint } from "@/hooks/useFingerprint";
import api from "@/lib/api";

type VoteStep = "face" | "fingerprint" | "ballot";

export default function VotePage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [election, setElection] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [step, setStep] = useState<VoteStep>("face");
  const [faceCapturing, setFaceCapturing] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);
  const [fingerprintVerified, setFingerprintVerified] = useState(false);
  const [fingerprintSkipped, setFingerprintSkipped] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { verifyFingerprint } = useFingerprint();

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
        toast({ title: "Error", description: "Could not load candidates", variant: "destructive" });
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
      setFaceCapturing(false);
    }
  };

  const captureAndVerifyFace = async () => {
    if (!videoRef.current) return;
    if (!voterId || !token) {
      toast({ title: "Not logged in", description: "Please login first", variant: "destructive" });
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg").split(",")[1];
    setFaceImage(base64);

    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
    setFaceCapturing(false);

    setVerifyingFace(true);
    try {
      await api.post(
        "/vote/verify-face",
        { voterId, faceImageBase64: base64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFaceVerified(true);
      setStep("fingerprint");
      toast({ title: "Face Verified", description: "Proceed to fingerprint verification." });
    } catch (err: any) {
      setFaceImage(null);
      setFaceVerified(false);
      toast({
        title: "Face Verification Failed",
        description: err?.response?.data?.error || "Face did not match",
        variant: "destructive",
      });
    } finally {
      setVerifyingFace(false);
    }
  };

  const handleFingerprint = async () => {
    if (!voterId) {
      toast({ title: "Not logged in", description: "Please login first", variant: "destructive" });
      return;
    }
    setFpLoading(true);
    try {
      const result = await verifyFingerprint(voterId);
      if (!result.verified) throw new Error("Fingerprint not verified");
      setFingerprintVerified(true);
      setFingerprintSkipped(false);
      setStep("ballot");
      toast({ title: "Fingerprint Verified", description: "You may now cast your vote." });
    } catch (err: any) {
      toast({
        title: "Fingerprint Failed",
        description: err?.response?.data?.error || err.message || "Verification failed",
        variant: "destructive",
      });
    } finally {
      setFpLoading(false);
    }
  };

  const skipFingerprint = () => {
    if (!faceVerified) return;
    setFingerprintVerified(true);
    setFingerprintSkipped(true);
    setStep("ballot");
    toast({
      title: "Fingerprint skipped",
      description: "Continuing with face verification only.",
    });
  };

  const handleVote = async () => {
    if (!selectedCandidate || !faceImage) return;
    if (!token || !voterId) {
      toast({ title: "Not logged in", description: "Please login first", variant: "destructive" });
      return;
    }
    if (!faceVerified || !fingerprintVerified) {
      toast({
        title: "Verification incomplete",
        description: "Complete face and fingerprint steps first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        "/vote/cast",
        {
          voterId,
          faceImageBase64: faceImage,
          candidateId: selectedCandidate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTxHash(res.data.transactionHash);
      setSubmitted(true);
      toast({ title: "Vote Recorded", description: "Your vote has been securely recorded." });
    } catch (err: any) {
      toast({
        title: "Vote Failed",
        description: err?.response?.data?.error || err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFace = () => {
    setFaceImage(null);
    setFaceVerified(false);
    setFingerprintVerified(false);
    setFingerprintSkipped(false);
    setStep("face");
    setSelectedCandidate(null);
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
              <p className="mt-2 text-muted-foreground">
                Your vote has been verified and recorded securely.
              </p>
              <div className="mt-6 w-full space-y-3">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Transaction Hash</p>
                  <p className="mt-1 break-all font-mono text-xs">{txHash}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 text-center">
                    <ShieldCheck className="mx-auto h-5 w-5 text-success" />
                    <p className="mt-1 text-xs text-muted-foreground">Biometric</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 text-center">
                    <Lock className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-xs text-muted-foreground">One Vote</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 text-center">
                    <CheckCircle2 className="mx-auto h-5 w-5 text-success" />
                    <p className="mt-1 text-xs text-muted-foreground">Confirmed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const ballotUnlocked = faceVerified && fingerprintVerified;

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
          <span>Face verification required. Fingerprint is optional if you have no sensor.</span>
        </div>

        {/* Progress steps */}
        <div className="mt-6 flex gap-2 text-xs font-medium">
          {[
            { key: "face", label: "1. Face" },
            { key: "fingerprint", label: "2. Fingerprint" },
            { key: "ballot", label: "3. Vote" },
          ].map((s) => (
            <div
              key={s.key}
              className={`flex-1 rounded-lg border px-3 py-2 text-center ${
                step === s.key
                  ? "border-primary bg-primary/10 text-primary"
                  : (s.key === "face" && faceVerified) ||
                      (s.key === "fingerprint" && fingerprintVerified) ||
                      (s.key === "ballot" && ballotUnlocked)
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border text-muted-foreground"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Step 1 — Face */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
              <Camera className="h-5 w-5 text-primary" /> Face Verification
            </h2>
            {!faceVerified ? (
              <>
                {faceCapturing ? (
                  <div className="space-y-3">
                    <video ref={videoRef} autoPlay className="w-full rounded-lg" />
                    <Button onClick={captureAndVerifyFace} className="w-full" disabled={verifyingFace}>
                      {verifyingFace ? "Verifying..." : "Capture & Verify Face"}
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={startCamera} className="w-full gap-2" disabled={verifyingFace}>
                    <Camera className="h-4 w-4" /> Start Camera for Face Verification
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-success/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-success">Face verified</span>
                <Button variant="ghost" size="sm" onClick={resetFace}>
                  Retake
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2 — Fingerprint */}
        <Card className={`mt-4 ${!faceVerified ? "opacity-50" : ""}`}>
          <CardContent className="p-4">
            <h2 className="mb-3 flex items-center gap-2 font-display font-semibold">
              <Fingerprint className="h-5 w-5 text-primary" /> Fingerprint Verification
            </h2>
            {!fingerprintVerified ? (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleFingerprint}
                  className="w-full gap-2"
                  disabled={!faceVerified || fpLoading}
                >
                  <Fingerprint className="h-4 w-4" />
                  {fpLoading ? "Waiting for Windows Hello / Touch ID..." : "Verify Fingerprint"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">or</p>
                <Button
                  variant="ghost"
                  onClick={skipFingerprint}
                  className="w-full"
                  disabled={!faceVerified || fpLoading}
                >
                  Continue without fingerprint
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-success/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-success">
                  {fingerprintSkipped ? "Fingerprint skipped" : "Fingerprint verified"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3 — Ballot */}
        <div className={`mt-6 space-y-4 ${!ballotUnlocked ? "pointer-events-none opacity-40" : ""}`}>
          <h2 className="font-display text-lg font-semibold">Select Your Candidate</h2>
          {!ballotUnlocked && (
            <p className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              Complete face verification, then fingerprint or skip, to unlock the ballot.
            </p>
          )}
          {ballotUnlocked && candidates.length === 0 && (
            <p className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              No candidates have been added yet. An admin can add them from the Admin dashboard.
            </p>
          )}
          {candidates.map((candidate, i) => {
            const id = String(candidate._id || candidate.id);
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCandidate === id ? "border-primary ring-2 ring-primary/20" : "border-border/50"
                  }`}
                  onClick={() => ballotUnlocked && setSelectedCandidate(id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                      {candidate.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold">{candidate.name}</h3>
                      <p className="text-sm text-primary">{candidate.party}</p>
                    </div>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                        selectedCandidate === id ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedCandidate === id && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Button
          size="lg"
          className="mt-8 w-full gap-2"
          disabled={!selectedCandidate || !ballotUnlocked || loading}
          onClick={handleVote}
        >
          <Vote className="h-5 w-5" />
          {loading ? "Recording vote..." : "Cast Vote"}
        </Button>
      </div>
    </div>
  );
}
