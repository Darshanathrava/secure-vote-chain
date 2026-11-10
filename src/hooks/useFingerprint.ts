import api from "@/lib/api";

type FingerprintResult = { verified: boolean };

const PORT_FROM = 11100;
const PORT_TO = 11120;
let rdBase: string | null = null;
let rdPaths = { capture: "/rd/capture", info: "/rd/info" };

export type FingerprintDeviceInfo = {
  status: string;       // READY / NOTREADY
  manager: string;      // device manager name
  model: string;        // e.g. MFS110
  vendor: string;       // dpId
  rdsId: string;
  rdsVersion: string;
  serial: string;
  port: number;
};

export type FingerprintScan = {
  quality: number | null;   // 0-100 from the scanner
  minutiae: number | null;  // number of points found
  fingerCount: number | null;
};

const attr = (xml: string, tag: string, name: string) =>
  xml.match(new RegExp(`<${tag}\\b[^>]*\\b${name}="([^"]*)"`))?.[1] ?? "";

/** Find the Mantra RD Service running on the voter's own PC. */
async function findRd(): Promise<string> {
  if (rdBase) return rdBase;
  for (let port = PORT_FROM; port <= PORT_TO; port++) {
    const base = `http://127.0.0.1:${port}`;
    try {
      const res = await fetch(base, {
        method: "RDSERVICE",
        signal: AbortSignal.timeout(1500),
      });
      const xml = await res.text();
      if (xml.includes("RDService")) {
        const cap = xml.match(/<Interface[^>]*id="CAPTURE"[^>]*path="([^"]*)"/)?.[1];
        const inf = xml.match(/<Interface[^>]*id="DEVICEINFO"[^>]*path="([^"]*)"/)?.[1];
        rdPaths = { capture: cap || "/rd/capture", info: inf || "/rd/info" };
        rdBase = base;
        return base;
      }
    } catch {
      /* try next port */
    }
  }
  throw new Error(
    "Fingerprint scanner not found. Start the Mantra RD Service, plug in the MFS110 and use Chrome or Edge."
  );
}

/** Capture one finger; returns the encrypted PID XML block from the scanner. */
export async function captureFinger(): Promise<string> {
  const base = await findRd();
  const pidOptions = `<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts fCount="1" fType="2" iCount="0" pCount="0" format="0"
        pidVer="2.0" timeout="15000" otp="" wadh="" posh="UNKNOWN" env="P"/>
</PidOptions>`;
  let xml: string;
  try {
    const res = await fetch(`${base}${rdPaths.capture}`, {
      method: "CAPTURE",
      headers: { "Content-Type": "text/xml" },
      body: pidOptions,
    });
    xml = await res.text();
  } catch {
    rdBase = null;
    throw new Error("Could not reach the fingerprint scanner. Check the RD Service and try again.");
  }
  if (!/errCode="0"/.test(xml)) {
    const info = xml.match(/errInfo="([^"]*)"/)?.[1];
    throw new Error(info ? `Capture failed: ${info}` : "Fingerprint capture failed");
  }
  return xml;
}

/** Read the connected scanner's name and details from the RD Service. */
export async function getDeviceInfo(): Promise<FingerprintDeviceInfo> {
  const base = await findRd();
  const rd = await fetch(base, { method: "RDSERVICE" }).then((r) => r.text());
  const status = attr(rd, "RDService", "status") || "UNKNOWN";
  const manager = attr(rd, "RDService", "info");
  let info = "";
  try {
    info = await fetch(`${base}${rdPaths.info}`, { method: "DEVICEINFO" }).then((r) => r.text());
  } catch {
    /* some versions only answer when a device is ready */
  }
  const serial = info.match(/<Param[^>]*name="srno"[^>]*value="([^"]*)"/)?.[1] ?? "";
  return {
    status,
    manager,
    model: attr(info, "DeviceInfo", "mi") || "Mantra MFS110",
    vendor: attr(info, "DeviceInfo", "dpId"),
    rdsId: attr(info, "DeviceInfo", "rdsId"),
    rdsVersion: attr(info, "DeviceInfo", "rdsVer"),
    serial,
    port: Number(new URL(base).port),
  };
}

/** Capture a finger and return both the PID block and its quality details. */
export async function captureWithDetails(): Promise<{ pidXml: string; scan: FingerprintScan }> {
  const pidXml = await captureFinger();
  const num = (n: string) => {
    const v = attr(pidXml, "Resp", n);
    return v === "" ? null : Number(v);
  };
  return {
    pidXml,
    scan: { quality: num("qScore"), minutiae: num("nmPoints"), fingerCount: num("fCount") },
  };
}

/** Test scan: capture a finger and report its quality. Nothing is saved. */
export async function testScan(): Promise<FingerprintScan> {
  return (await captureWithDetails()).scan;
}

/**
 * Mantra MFS110 (RD Service) helpers.
 * The PID block is encrypted, so the server checks that a fresh, successful
 * capture came from a registered device; it cannot match two prints.
 */
export function useFingerprint() {
  const enrollFingerprint = async (voterId: string): Promise<FingerprintResult> => {
    const pidXml = await captureFinger();
    const { data } = await api.post("/fingerprint/enroll", { voterId, pidXml });
    return { verified: Boolean(data.verified) };
  };

  /** Enroll using a capture the voter already took (Register page). */
  const enrollWithCapture = async (voterId: string, pidXml: string): Promise<FingerprintResult> => {
    const { data } = await api.post("/fingerprint/enroll", { voterId, pidXml });
    return { verified: Boolean(data.verified) };
  };

  const verifyFingerprint = async (voterId: string): Promise<FingerprintResult> => {
    const pidXml = await captureFinger();
    const { data } = await api.post("/fingerprint/verify", { voterId, pidXml });
    return { verified: Boolean(data.verified) };
  };

  return { enrollFingerprint, enrollWithCapture, verifyFingerprint };
}
