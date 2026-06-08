import { NextResponse } from 'next/server';
import { fetchComplianceReportForRequest } from '@/lib/fetchComplianceReport';
import { buildCompliancePdf } from '@/lib/compliancePdf';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const report = await fetchComplianceReportForRequest(request);

    if (format === 'json') {
      const body = JSON.stringify(report, null, 2);
      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="compliance-report.json"',
        },
      });
    }

    if (format === 'pdf') {
      const pdf = await buildCompliancePdf(report);
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="compliance-report.pdf"',
        },
      });
    }

    return NextResponse.json({ error: 'format must be json or pdf' }, { status: 400 });
  } catch (error) {
    console.error('Compliance export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
