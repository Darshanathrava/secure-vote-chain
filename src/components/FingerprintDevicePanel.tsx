import { useState } from "react";
import { Fingerprint, Usb, ScanLine, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getDeviceInfo,
  testScan,
  type FingerprintDeviceInfo,
  type FingerprintScan,
} from "@/hooks/useFingerprint";

const Row = ({ label, value }: { label: string; value?: string | number | null }) =>
  value ? (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium break-all text-right">{value}</span>
    </div>
  ) : null;

/** Button that shows the connected fingerprint scanner and a test scan result. */
export default function FingerprintDevicePanel() {
  const [device, setDevice] = useState<FingerprintDeviceInfo | null>(null);
  const [scan, setScan] = useState<FingerprintScan | null>(null);
  const [busy, setBusy] = useState<"device" | "scan" | null>(null);
  const [error, setError] = useState("");

  const checkDevice = async () => {
    setBusy("device");
    setError("");
    setScan(null);
    try {
      setDevice(await getDeviceInfo());
    } catch (e: any) {
      setDevice(null);
      setError(e.message || "Could not read the scanner");
    } finally {
      setBusy(null);
    }
  };

  const runScan = async () => {
    setBusy("scan");
    setError("");
    try {
      if (!device) setDevice(await getDeviceInfo());
      setScan(await testScan());
    } catch (e: any) {
      setScan(null);
      setError(e.message || "Scan failed");
    } finally {
      setBusy(null);
    }
  };

  const ready = device?.status === "READY";

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border p-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={checkDevice} disabled={busy !== null}>
          {busy === "device" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Usb className="h-4 w-4" />}
          Check fingerprint device
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={runScan} disabled={busy !== null}>
          {busy === "scan" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
          Test scan
        </Button>
      </div>

      {error && (
        <div className="flex gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {device && (
        <div className="space-y-1 rounded-md bg-muted/40 p-3">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className={`h-4 w-4 ${ready ? "text-success" : "text-warning"}`} />
            {device.model} — {ready ? "connected and ready" : `status: ${device.status}`}
          </div>
          <Row label="Service" value={device.manager} />
          <Row label="Vendor" value={device.vendor} />
          <Row label="Device ID" value={device.rdsId} />
          <Row label="Version" value={device.rdsVersion} />
          <Row label="Serial no." value={device.serial} />
          <Row label="Local port" value={device.port} />
        </div>
      )}

      {scan && (
        <div className="space-y-2 rounded-md bg-muted/40 p-3">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-10 w-10 text-primary" />
            <div className="text-sm font-medium">Fingerprint captured</div>
          </div>
          {scan.quality !== null && (
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Print quality</span>
                <span className="font-medium">{scan.quality} / 100</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, scan.quality))}%` }} />
              </div>
            </div>
          )}
          <Row label="Minutiae points" value={scan.minutiae} />
          <Row label="Fingers captured" value={scan.fingerCount} />
          <p className="text-[11px] text-muted-foreground">
            The scanner encrypts the print, so the image is not shown and nothing is stored from a test scan.
          </p>
        </div>
      )}
    </div>
  );
}
