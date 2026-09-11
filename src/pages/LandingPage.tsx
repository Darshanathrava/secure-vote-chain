import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { Shield, Fingerprint, ScanFace, Vote, BarChart3, Lock, ChevronRight, Blocks, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { systemStats } from "@/lib/votingData";

const features = [
  {
    icon: ScanFace,
    title: "Face Recognition",
    description: "MTCNN/FaceNet-powered identity verification with liveness detection to prevent spoofing attacks.",
  },
  {
    icon: Fingerprint,
    title: "Fingerprint Auth",
    description: "WebAuthn/FIDO2 biometric authentication providing a hardware-backed second factor.",
  },
  {
    icon: Blocks,
    title: "Blockchain Ledger",
    description: "Every vote recorded on an immutable Ethereum/Polygon ledger with smart contract validation.",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "AES-256-GCM encryption at rest, TLS 1.3 in transit, and homomorphic encryption for tallying.",
  },
  {
    icon: BarChart3,
    title: "Real-time Results",
    description: "Transparent, verifiable vote tallying powered by auditable smart contracts.",
  },
  {
    icon: Users,
    title: "Scalable Design",
    description: "Microservices architecture handling millions of concurrent voters with horizontal scaling.",
  },
];

const stats = [
  { label: "Registered Voters", value: systemStats.registeredVoters.toLocaleString() },
  { label: "Votes Cast", value: systemStats.totalVotesCast.toLocaleString() },
  { label: "Blockchain Blocks", value: systemStats.blockchainBlocks.toLocaleString() },
  { label: "System Uptime", value: `${systemStats.uptime}%` },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" />
              Blockchain-Secured Voting
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Democracy,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Verified & Immutable
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-  foreground md:text-xl">
              A next-generation online voting platform combining biometric authentication
              with blockchain technology. Every vote is encrypted, verified, and permanently recorded.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/register">
                <Button size="lg" className="gap-2 text-base">
                  <Vote className="h-5 w-5" />
                  Register to Vote
                </Button>
              </Link>
              <Link to="/results">
                <Button size="lg" variant="outline" className="gap-2 text-base">
                  View Live Results
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <p className="font-display text-2xl font-bold text-primary md:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Enterprise-Grade Security
            </h2>
            <p className="mt-3 text-muted-foreground">
              Six layers of protection ensuring every vote counts — once and only once.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <Card className="group h-full border-border/50 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/50 bg-card/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-14 text-center font-display text-3xl font-bold md:text-4xl">
            How It Works
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Register & Verify", desc: "Create your account and complete biometric enrollment — face scan and fingerprint capture." },
              { step: "02", title: "Authenticate & Vote", desc: "Multi-factor biometric verification before accessing your personalized, encrypted ballot." },
              { step: "03", title: "Confirm on Chain", desc: "Your encrypted vote is recorded on the blockchain with a verifiable transaction hash." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-10 text-center"
          >
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Ready to Vote Securely?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Register now and experience the future of verifiable, tamper-proof democracy.
            </p>
            <Link to="/register">
              <Button size="lg" className="mt-8 gap-2">
                Get Started <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
