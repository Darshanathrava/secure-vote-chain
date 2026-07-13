import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display text-sm font-semibold">SecureVote</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 SecureVote. Blockchain-secured voting. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground">Privacy</span>
            <span className="cursor-pointer hover:text-foreground">Terms</span>
            <span className="cursor-pointer hover:text-foreground">Audit Logs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
