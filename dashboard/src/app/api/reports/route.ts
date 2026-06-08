import { NextResponse } from 'next/server';
import { fetchComplianceReportForRequest } from '@/lib/fetchComplianceReport';
import { buildFromTelemetry } from '@/lib/complianceReport';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const report = await fetchComplianceReportForRequest(request);
    if (!report.securityControls?.length) {
      return NextResponse.json(buildFromTelemetry([]));
    }
    return NextResponse.json(report);
  } catch (error) {
    console.error('Compliance report error:', error);
    return NextResponse.json(buildFromTelemetry([]));
  }
}
