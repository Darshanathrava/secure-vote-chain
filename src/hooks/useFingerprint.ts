import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import api from "@/lib/api";

type FingerprintResult = { verified: boolean };

/**
 * WebAuthn platform authenticator (Windows Hello / Touch ID) helpers.
 */
export function useFingerprint() {
  const enrollFingerprint = async (voterId: string): Promise<FingerprintResult> => {
    const { data: options } = await api.post("/webauthn/register/options", { voterId });
    const attestationResponse = await startRegistration({ optionsJSON: options });
    const { data } = await api.post("/webauthn/register/verify", {
      voterId,
      attestationResponse,
    });
    return { verified: Boolean(data.verified) };
  };

  const verifyFingerprint = async (voterId: string): Promise<FingerprintResult> => {
    const { data: options } = await api.post("/webauthn/authenticate/options", { voterId });
    const assertionResponse = await startAuthentication({ optionsJSON: options });
    const { data } = await api.post("/webauthn/authenticate/verify", {
      voterId,
      assertionResponse,
    });
    return { verified: Boolean(data.verified) };
  };

  return { enrollFingerprint, verifyFingerprint };
}
