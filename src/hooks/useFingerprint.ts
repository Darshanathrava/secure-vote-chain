import api from "@/lib/api";

type FingerprintResult = { verified: boolean };

const PORT_FROM = 11100;
const PORT_TO = 11120;
let rdBase: string | null = null;

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
    const res = await fetch(`${base}/rd/capture`, {
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

  const verifyFingerprint = async (voterId: string): Promise<FingerprintResult> => {
    const pidXml = await captureFinger();
    const { data } = await api.post("/fingerprint/verify", { voterId, pidXml });
    return { verified: Boolean(data.verified) };
  };

  return { enrollFingerprint, verifyFingerprint };
}
