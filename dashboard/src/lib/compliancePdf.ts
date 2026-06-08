import type { ComplianceReport } from "@/lib/complianceReport";
import { SimplePdf, formatReportDate } from "@/lib/pdfBuilder";

const GRAY: [number, number, number] = [0.45, 0.45, 0.45];
const LIGHT: [number, number, number] = [0.96, 0.96, 0.96];
const GREEN: [number, number, number] = [0.12, 0.55, 0.32];
const AMBER: [number, number, number] = [0.85, 0.55, 0.1];

function passRate(report: ComplianceReport): number {
  const es = report.executiveSummary;
  if (es.passRatePct != null) return es.passRatePct;
  const passed = report.securityControls.filter((c) => c.status === "PASSED").length;
  const total = report.securityControls.length || 1;
  return Math.round((passed / total) * 100);
}

function fleetHealthLabel(report: ComplianceReport): string {
  const es = report.executiveSummary;
  if (es.totalAgentsActive === 0) return "N/A (no agents)";
  return `${es.systemHealth} (${es.onlineAgents}/${es.totalAgentsActive} online)`;
}

function drawHeader(pdf: SimplePdf, report: ComplianceReport) {
  const m = 44;
  const { date, time } = formatReportDate(report.reportDate);
  const top = pdf.cursorY();

  pdf.fillRect(m, top - 40, 36, 36, [0, 0, 0]);
  pdf.text(m + 10, top - 16, "LG", { size: 14, bold: true, color: [1, 1, 1] });

  pdf.text(m + 48, top - 18, report.generatedBy || "Log Guardian Compliance Engine", {
    size: 7,
    color: GRAY,
  });
  pdf.text(m + 48, top - 8, "CONFIDENTIAL - INTERNAL USE ONLY", { size: 7, color: GRAY });

  pdf.text(m, top - 60, "SECURITY AUDIT", { size: 22, bold: true });
  pdf.text(m, top - 84, "COMPLIANCE REPORT", { size: 16, color: GRAY });

  const boxW = 148;
  const boxX = 595 - m - boxW;
  pdf.strokeRect(boxX, top - 86, boxW, 68, 1.5);
  pdf.text(boxX + 10, top - 26, "REPORT DATE", { size: 7, bold: true, color: GRAY });
  pdf.text(boxX + 10, top - 42, date, { size: 11, bold: true });
  pdf.text(boxX + 10, top - 56, time, { size: 9, color: GRAY });

  pdf.setY(top - 100);
  pdf.line(m, pdf.cursorY(), 595 - m, pdf.cursorY(), 2);
  pdf.gap(24);
}

function drawScoreSection(pdf: SimplePdf, report: ComplianceReport) {
  const m = 44;
  const rate = passRate(report);
  const passed =
    report.executiveSummary.controlsPassed ??
    report.securityControls.filter((c) => c.status === "PASSED").length;
  const total =
    report.executiveSummary.controlsTotal ?? report.securityControls.length;
  const es = report.executiveSummary;

  pdf.textLine(m, "COMPLIANCE STANDARDS", { size: 9, bold: true, color: GRAY, lineHeight: 14 });
  pdf.gap(8);

  const chipH = 18;
  const chipPad = 6;
  let chipRowY = pdf.cursorY();
  let x = m;
  const maxChipW = 595 - m * 2;
  for (const std of report.standards) {
    const w = Math.min(122, std.length * 5.2 + 14);
    if (x + w > m + maxChipW && x > m) {
      x = m;
      chipRowY -= chipH + chipPad;
    }
    pdf.fillRect(x, chipRowY - chipH + 6, w, chipH, LIGHT);
    pdf.strokeRect(x, chipRowY - chipH + 6, w, chipH, 0.5);
    pdf.text(x + 6, chipRowY - 4, std, { size: 7, bold: true });
    x += w + chipPad;
  }
  pdf.setY(chipRowY - chipH - 20);
  pdf.gap(12);

  const sectionTop = pdf.cursorY();
  const kpiX = m + 278;
  const scoreAnchor = sectionTop;

  pdf.text(m, scoreAnchor, "OVERALL COMPLIANCE SCORE", { size: 8, bold: true, color: GRAY });
  pdf.text(m, scoreAnchor - 36, `${rate}%`, { size: 28, bold: true });
  pdf.text(m, scoreAnchor - 54, `(${passed} of ${total} controls passed)`, {
    size: 9,
    color: GRAY,
  });

  const barBottom = scoreAnchor - 66;
  pdf.fillRect(m, barBottom, 216, 8, [0.85, 0.85, 0.85]);
  pdf.fillRect(m, barBottom, (216 * rate) / 100, 8, [0, 0, 0]);
  const leftBottom = barBottom - 14;

  pdf.text(kpiX, sectionTop, "EXECUTIVE SUMMARY", { size: 9, bold: true, color: GRAY });
  const kpis: [string, string][] = [
    ["System Health", fleetHealthLabel(report)],
    ["Threats Blocked", String(es.totalThreatsMitigated ?? 0)],
    ["Events Analyzed", Number(es.totalEventsProcessed ?? 0).toLocaleString("en-US")],
    ["Peak EPS", String(es.peakEps ?? "-")],
    ["Security Alerts", Number(es.totalAlerts ?? 0).toLocaleString("en-US")],
    ["Mesh IoC Peers", String(es.totalMeshPeers ?? 0)],
  ];

  let kpiBottom = sectionTop;
  for (let i = 0; i < kpis.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = kpiX + col * 128;
    const cy = sectionTop - 18 - row * 34;
    pdf.fillRect(cx, cy - 26, 118, 28, LIGHT);
    pdf.strokeRect(cx, cy - 26, 118, 28, 0.5);
    pdf.text(cx + 5, cy - 10, kpis[i][0].toUpperCase(), { size: 6, bold: true, color: GRAY });
    pdf.text(cx + 5, cy - 22, kpis[i][1].slice(0, 22), { size: 9, bold: true });
    kpiBottom = cy - 30;
  }

  pdf.setY(Math.min(leftBottom, kpiBottom) - 8);
  pdf.gap(6);

  const siemY = pdf.cursorY();
  pdf.fillRect(m, siemY - 14, 595 - m * 2, 18, LIGHT);
  pdf.text(m + 8, siemY - 2, "SIEM Forwarder", { size: 9, bold: true });
  pdf.text(m + 110, siemY - 2, (es.siemStatus || "Active").slice(0, 72), {
    size: 8,
    color: GRAY,
  });
  pdf.setY(siemY - 22);
  pdf.gap(14);
}

function drawControls(pdf: SimplePdf, report: ComplianceReport) {
  const m = 44;
  pdf.textLine(m, "SECURITY CONTROLS ASSESSMENT", { size: 9, bold: true, color: GRAY, lineHeight: 14 });
  pdf.gap(4);
  pdf.line(m, pdf.cursorY(), 595 - m, pdf.cursorY(), 0.5);
  pdf.gap(12);

  for (const ctrl of report.securityControls) {
    pdf.ensure(52);
    const rowTop = pdf.cursorY();
    const statusColor = ctrl.status === "PASSED" ? GREEN : AMBER;

    pdf.fillRect(m + 6, rowTop - 10, 8, 8, statusColor);
    pdf.text(m + 20, rowTop - 2, `[${ctrl.standard}] ${ctrl.id}`, { size: 9, bold: true });
    pdf.text(m + 108, rowTop - 2, ctrl.name.slice(0, 48), { size: 9 });
    pdf.text(595 - m - 52, rowTop - 2, ctrl.status, {
      size: 8,
      bold: true,
      color: statusColor,
    });

    pdf.setY(rowTop - 18);
    pdf.textBlock(m + 20, `Evidence: ${ctrl.evidence}`, {
      size: 8,
      maxWidth: 470,
      lineHeight: 10,
    });
    pdf.gap(2);
    pdf.textBlock(m + 20, ctrl.detail, {
      size: 7,
      color: GRAY,
      maxWidth: 470,
      lineHeight: 9,
    });
    pdf.gap(6);
    pdf.line(m, pdf.cursorY(), 595 - m, pdf.cursorY(), 0.25);
    pdf.gap(12);
  }
}

function drawFleetTable(pdf: SimplePdf, report: ComplianceReport) {
  const m = 44;
  pdf.ensure(80);
  pdf.textLine(m, "FLEET DEPLOYMENT MATRIX", { size: 9, bold: true, color: GRAY, lineHeight: 14 });
  pdf.gap(4);
  pdf.line(m, pdf.cursorY(), 595 - m, pdf.cursorY(), 0.5);
  pdf.gap(10);

  if (!report.nodes.length) {
    pdf.textBlock(m, "No Guardian agents currently reporting to the fleet.", {
      size: 9,
      color: GRAY,
    });
    pdf.gap(16);
    return;
  }

  const cols = ["Node", "Status", "EPS", "RCE", "Tarpit", "Alerts", "Mesh", "Seen"];
  const widths = [90, 52, 40, 36, 44, 44, 40, 52];
  const tableW = widths.reduce((a, b) => a + b, 0);
  let x = m;
  const headY = pdf.cursorY();
  pdf.fillRect(m, headY - 14, tableW, 16, LIGHT);
  for (let i = 0; i < cols.length; i++) {
    pdf.text(x + 4, headY - 2, cols[i], { size: 7, bold: true, color: GRAY });
    x += widths[i];
  }
  pdf.setY(headY - 18);

  for (const node of report.nodes) {
    pdf.ensure(16);
    x = m;
    const rowY = pdf.cursorY();
    const vals = [
      node.id,
      node.status,
      node.eps.toFixed(1),
      String(node.rce_prevented),
      String(node.tarpit_active),
      String(node.alerts),
      String(node.mesh_peers),
      new Date(node.last_seen).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    ];
    for (let i = 0; i < vals.length; i++) {
      pdf.text(x + 4, rowY - 2, vals[i].slice(0, 14), {
        size: 7,
        color: node.status === "Online" ? [0, 0, 0] : GRAY,
      });
      x += widths[i];
    }
    pdf.line(m, rowY - 12, m + tableW, rowY - 12, 0.25);
    pdf.setY(rowY - 16);
  }

  pdf.gap(4);
  const es = report.executiveSummary;
  const totalY = pdf.cursorY();
  const colX = [m, m + widths[0], m + widths[0] + widths[1], m + widths[0] + widths[1] + widths[2]];
  pdf.fillRect(m, totalY - 12, tableW, 14, [0.15, 0.15, 0.15]);
  pdf.text(colX[0] + 4, totalY - 2, "FLEET TOTAL", { size: 7, bold: true, color: [1, 1, 1] });
  pdf.text(colX[1] + 4, totalY - 2, `${es.onlineAgents}/${es.totalAgentsActive}`, {
    size: 7,
    color: [1, 1, 1],
  });
  pdf.text(colX[2] + 4, totalY - 2, String(es.peakEps), { size: 7, color: [1, 1, 1] });
  pdf.setY(totalY - 20);
  pdf.gap(20);
}

function drawAttestation(pdf: SimplePdf) {
  const m = 44;
  pdf.ensure(120);
  const boxTop = pdf.cursorY();

  pdf.textLine(m + 10, "ATTESTATION & CERTIFICATION", {
    size: 9,
    bold: true,
    color: GRAY,
    lineHeight: 14,
  });
  pdf.gap(4);
  pdf.textBlock(
    m + 10,
    "This report was automatically generated by Log Guardian and reflects the security posture " +
      "at generation time. Evidence is derived from live telemetry. For internal audit and authorized personnel only.",
    { size: 8, color: GRAY, maxWidth: 500, lineHeight: 10 },
  );
  pdf.gap(14);

  const sigRowY = pdf.cursorY();
  const roles = ["Security Officer", "Fleet Administrator", "Compliance Reviewer"];
  for (let i = 0; i < roles.length; i++) {
    const x = m + 10 + i * 170;
    pdf.line(x, sigRowY - 2, x + 140, sigRowY - 2, 0.5);
    pdf.text(x, sigRowY - 12, roles[i], { size: 7, color: GRAY });
    pdf.text(x, sigRowY - 22, "Date: _______________", { size: 7, color: GRAY });
  }
  pdf.setY(sigRowY - 34);
  pdf.gap(10);

  pdf.textLine(m + 10, "CONFIDENTIAL - Do not distribute without authorization.", {
    size: 7,
    color: GRAY,
    lineHeight: 10,
  });
  pdf.textLine(m + 10, "Log Guardian Enterprise Security Platform", {
    size: 7,
    color: GRAY,
    lineHeight: 10,
  });

  const boxBottom = pdf.cursorY() - 6;
  const boxHeight = boxTop - boxBottom + 8;
  pdf.strokeRect(m, boxBottom, 595 - m * 2, boxHeight, 1);
  pdf.gap(12);
}

/** Ekrandaki rapor govdesine yakin cok sayfali PDF. */
export function buildCompliancePdf(report: ComplianceReport): Buffer {
  const pdf = new SimplePdf();
  drawHeader(pdf, report);
  drawScoreSection(pdf, report);
  drawControls(pdf, report);
  drawFleetTable(pdf, report);
  drawAttestation(pdf);
  return pdf.build();
}
