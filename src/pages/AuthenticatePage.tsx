import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ScanFace, ShieldCheck, CheckCircle2, Camera, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { connectWallet } from "@/lib/contract";

type AuthState = "idle" | "capturing" | "verifying" | "verified" | "failed";

export default function AuthenticatePage() {
  const [state, setState] = useState<AuthState>("idle");
  const [progress, setProgress] = useState(0);
  const [voterId, setVoterId] = useState("");
  const [password, setPassword] = useState("");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast({ title: "Camera Error", description: "Could not access webcam", variant: "destructive" });
      setCameraActive(false);
    }
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !voterId || !password) {
      toast({ title: "Missing fields", description: "Enter Voter ID and password first", variant: "destructive" });
      return;
    }

    // Capture frame
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg").split(",")[1];
    setFaceImage(base64);

    // Stop camera
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setCameraActive(false);

    // Animate progress
    setState("verifying");
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 90) { clearInterval(interval); p = 90; }
      setProgress(p);
    }, 150);

    try {
      const res = await api.post("/auth/login", {
        voterId,
        password,
        faceImageBase64: base64,
      });

      clearInterval(interval);
      setProgress(100);

      // Save token and voterId
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("voterId", voterId);

      // Connect MetaMask wallet
      if (res.data.walletAddress) {
        localStorage.setItem("walletAddress", res.data.walletAddress);
      } else {
        try {
          const wallet = await connectWallet();
          localStorage.setItem("walletAddress", wallet);
        } catch {
          // MetaMask optional at login
        }
      }

      setSimilarity(res.data.similarity || 0.99);
      setState("verified");
      toast({ title: "Identity Verified ✓", description: "Welcome! You may now cast your vote." });

    } catch (err: any) {
      clearInterval(interval);
      setProgress(0);
      setState("failed");
      toast({
        title: "Authentication Failed",
        description: err?.response?.data?.error || "Face or credentials did not match",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Authentication</h1>
        <p className="mt-2 text-muted-foreground">Multi-factor biometric verification</p>

        <div className="mt-8 space-y-6">

          {/* Credentials */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Lock className="h-5 w-5 text-primary" /> Voter Credentials
                </CardTitle>
                <CardDescription>Enter your registered Voter ID and password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="voterId">Voter ID / National ID</Label>
                  <Input id="voterId" placeholder="Enter your voter ID"
                    value={voterId} onChange={e => setVoterId(e.target.value)}
                    disabled={state === "verifying" || state === "verified"} />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    disabled={state === "verifying" || state === "verified"} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Face Recognition */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={state === "verified" ? "border-success/30" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <ScanFace className="h-5 w-5 text-primary" /> Face Recognition
                </CardTitle>
                <CardDescription>Look directly at the camera for verification</CardDescription>
              </CardHeader>
              <CardContent>
                {state === "idle" && !cameraActive && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-48 w-48 items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-primary/5">
                      <ScanFace className="h-14 w-14 text-muted-foreground" />
                    </div>
                    <Button onClick={startCamera} className="w-full gap-2"
                      disabled={!voterId || !password}>
                      <Camera className="h-4 w-4" /> Start Face Scan
                    </Button>
                    {(!voterId || !password) && (
                      <p className="text-xs text-muted-foreground">Enter credentials above first</p>
                    )}
                  </div>
                )}

                {cameraActive && (
                  <div className="space-y-3">
                    <video ref={videoRef} autoPlay
                      className="w-full rounded-xl border-2 border-primary/30" />
                    <Button onClick={captureAndVerify} size="lg" className="w-full gap-2">
                      <ShieldCheck className="h-5 w-5" /> Verify My Identity
                    </Button>
                  </div>
                )}

                {state === "verifying" && (
                  <div className="space-y-4 text-center">
                    <div className="flex h-48 w-48 mx-auto items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5">
                      <ScanFace className="h-14 w-14 text-primary animate-pulse" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Analyzing facial features...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <p className="text-sm text-muted-foreground">Comparing with registered biometric data...</p>
                  </div>
                )}

                {state === "verified" && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-48 w-48 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle2 className="h-14 w-14 text-success" />
                    </div>
                    <div className="w-full rounded-lg bg-success/10 p-3 text-center">
                      <p className="text-sm font-medium text-success">Face Verified ✓</p>
                      {similarity && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Similarity: {(similarity * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {state === "failed" && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-48 w-48 items-center justify-center rounded-full bg-destructive/10">
                      <ScanFace className="h-14 w-14 text-destructive" />
                    </div>
                    <Button onClick={() => { setState("idle"); setProgress(0); }} className="w-full">
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Success — Proceed to Vote */}
          {state === "verified" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-success/30 bg-success/5">
                <CardContent className="flex flex-col items-center p-6">
                  <ShieldCheck className="h-12 w-12 text-success" />
                  <h3 className="mt-3 font-display text-xl font-bold">Identity Verified</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You are now authorized to cast your vote
                  </p>
                  <Link to="/vote" className="mt-4 w-full">
                    <Button size="lg" className="w-full gap-2">
                      Proceed to Ballot
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}