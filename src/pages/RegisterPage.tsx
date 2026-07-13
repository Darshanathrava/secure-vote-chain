import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ScanFace, Fingerprint, User, Mail, IdCard, CalendarDays, MapPin, CheckCircle2, ArrowRight, Camera, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type Step = "personal" | "biometric" | "review";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("personal");
  const [formData, setFormData] = useState({
    fullName: "", email: "", idNumber: "",
    dateOfBirth: "", address: "", password: "",
  });
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceCapturing, setFaceCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    setFaceCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast({ title: "Camera Error", description: "Could not access webcam", variant: "destructive" });
      setFaceCapturing(false);
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
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setFaceCapturing(false);
    toast({ title: "Face Captured ✓", description: "Biometric data ready for enrollment." });
  };

  const handleSubmit = async () => {
    if (!faceImage) {
      toast({ title: "Missing face photo", description: "Please capture your face first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        voterId: formData.idNumber,
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        faceImageBase64: faceImage,
        walletAddress: "",
      });
      setRegistered(true);
      toast({ title: "Registration Successful!", description: "Your voter registration is on the blockchain." });
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err?.response?.data?.error || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: "personal", label: "Personal Info" },
    { key: "biometric", label: "Biometric Enrollment" },
    { key: "review", label: "Review & Submit" },
  ];

  if (registered) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-success/30">
              <CardContent className="flex flex-col items-center p-10 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-bold">Registration Complete!</h2>
                <p className="mt-2 text-muted-foreground">
                  Your voter identity has been enrolled with facial recognition and recorded on the blockchain.
                </p>
                <div className="mt-6 w-full rounded-lg border border-border bg-muted/50 p-4 text-left space-y-2">
                  <p className="text-xs text-muted-foreground">Voter ID</p>
                  <p className="font-mono font-bold">{formData.idNumber}</p>
                </div>
                <Button className="mt-6 w-full" onClick={() => window.location.href = "/authenticate"}>
                  Proceed to Login
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Voter Registration</h1>
        <p className="mt-2 text-muted-foreground">Secure, blockchain-backed voter enrollment</p>

        <div className="mt-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                step === s.key ? "bg-primary text-primary-foreground"
                : steps.indexOf(steps.find((x) => x.key === step)!) > i ? "bg-success text-success-foreground"
                : "bg-muted text-muted-foreground"
              }`}>
                {steps.indexOf(steps.find((x) => x.key === step)!) > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className="h-0.5 flex-1 rounded bg-border" />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex">
          {steps.map((s) => <span key={s.key} className="flex-1 text-xs text-muted-foreground">{s.label}</span>)}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }} className="mt-8">

          {step === "personal" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <User className="h-5 w-5 text-primary" /> Personal Information
                </CardTitle>
                <CardDescription>All data is encrypted before storage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Enter your legal full name"
                    value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="your@email.com"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="idNumber">National ID / Voter ID</Label>
                  <Input id="idNumber" placeholder="Enter your national ID"
                    value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Create a strong password"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="address">District / Region</Label>
                    <Input id="address" placeholder="Your voting district"
                      value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>
                <Button className="mt-4 w-full gap-2" onClick={() => setStep("biometric")}
                  disabled={!formData.fullName || !formData.email || !formData.idNumber || !formData.password}>
                  Continue to Biometric Enrollment <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "biometric" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <ScanFace className="h-5 w-5 text-primary" /> Face Recognition Enrollment
                  </CardTitle>
                  <CardDescription>Your face will be encoded using AI and stored securely</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!faceImage ? (
                    <>
                      {faceCapturing ? (
                        <div className="space-y-3">
                          <video ref={videoRef} autoPlay className="w-full rounded-xl border border-primary/30" />
                          <Button onClick={capturePhoto} className="w-full gap-2">
                            <Camera className="h-4 w-4" /> Capture Photo
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex h-52 w-52 items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-primary/5">
                            <ScanFace className="h-16 w-16 text-muted-foreground" />
                          </div>
                          <Button onClick={startCamera} className="w-full gap-2">
                            <Camera className="h-4 w-4" /> Start Camera
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
                        <CheckCircle2 className="h-6 w-6 text-success" />
                        <div>
                          <p className="font-medium text-success">Face Enrolled ✓</p>
                          <p className="text-xs text-muted-foreground">AI encoding ready for storage</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => setFaceImage(null)} className="w-full">Retake Photo</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Fingerprint className="h-5 w-5 text-primary" /> Fingerprint Enrollment
                  </CardTitle>
                  <CardDescription>Hardware sensor required (simulated)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-36 w-36 mx-auto items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5">
                    <CheckCircle2 className="h-14 w-14 text-success" />
                  </div>
                  <p className="mt-4 text-center text-xs text-muted-foreground">Fingerprint simulated for demo purposes</p>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep("personal")} className="flex-1">Back</Button>
                <Button onClick={() => setStep("review")} className="flex-1 gap-2" disabled={!faceImage}>
                  Continue to Review <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "review" && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Review & Submit</CardTitle>
                <CardDescription>Confirm your details before blockchain registration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                  {[
                    { icon: User, label: "Name", value: formData.fullName },
                    { icon: Mail, label: "Email", value: formData.email },
                    { icon: IdCard, label: "Voter ID", value: formData.idNumber },
                    { icon: CalendarDays, label: "Date of Birth", value: formData.dateOfBirth },
                    { icon: MapPin, label: "District", value: formData.address },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{item.label}:</span>
                      <span className="text-sm font-medium">{item.value || "—"}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 rounded-lg border border-success/30 bg-success/5 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  <div>
                    <p className="text-sm font-medium">Face Biometric Enrolled</p>
                    <p className="text-xs text-muted-foreground">128-dimensional AI face encoding ready for secure storage</p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <Lock className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Data will be encrypted</p>
                    <p className="text-xs text-muted-foreground">Password hashed with bcrypt, face encoding stored in MongoDB</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep("biometric")} className="flex-1">Back</Button>
                  <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={loading}>
                    {loading ? "Registering..." : "Submit Registration"}
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}