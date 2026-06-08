/** Competitive proof PDF is English-only (open-source / data-room standard). */
export const PROOF_PDF_FILENAME = "competitive-proof.pdf";

export function proofPdfApiUrl(raw = true): string {
  return raw
    ? "/api/data-room/competitive-proof.pdf?raw=1"
    : "/api/data-room/competitive-proof.pdf";
}
