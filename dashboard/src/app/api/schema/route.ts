// dashboard/src/app/api/schema/route.ts — OpenAPI Schema Firewall API (Feature 1)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET: Aktif şemayı döndür
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-user-tenant') || '';
    
    const schema = await (prisma as any).schemaRegistry.findFirst({
      where: { tenantId, active: true },
      orderBy: { uploadedAt: 'desc' },
    });

    if (!schema) {
      return NextResponse.json({ loaded: false, message: 'No active schema' });
    }

    return NextResponse.json({
      loaded: true,
      id: schema.id,
      name: schema.name,
      version: schema.version,
      uploadedAt: schema.uploadedAt,
      // JSON içeriğini parse ederek endpoint sayısını hesapla
      endpointCount: (() => {
        try {
          const parsed = JSON.parse(schema.jsonContent);
          return Object.keys(parsed?.paths || {}).length;
        } catch { return 0; }
      })(),
    });
  } catch (err) {
    console.error('Schema GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: OpenAPI JSON şemasını yükle
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-user-tenant') || '';
    const userRole = request.headers.get('x-user-role') || '';

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, version = '1.0', jsonContent } = body;

    if (!name || !jsonContent) {
      return NextResponse.json({ error: 'name and jsonContent required' }, { status: 400 });
    }

    // JSON doğrulama
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!parsed.openapi && !parsed.swagger) {
      return NextResponse.json({ error: 'Not a valid OpenAPI schema (missing openapi/swagger field)' }, { status: 400 });
    }

    const pathCount = Object.keys((parsed as any)?.paths || {}).length;

    // Eski aktif şemaları deaktif et
    await (prisma as any).schemaRegistry.updateMany({
      where: { tenantId, active: true },
      data: { active: false },
    });

    // Yeni şemayı kaydet
    const schema = await (prisma as any).schemaRegistry.create({
      data: { tenantId, name, version, jsonContent, active: true },
    });

    // Fiziksel dosyayı /etc/log-guardian/ veya local dir'e yaz
    // (C daemon PUSH_SCHEMA komutuyla bu dosyayı yükleyecek)
    try {
      const schemaDir = process.env.SCHEMA_DIR || './schemas';
      await mkdir(schemaDir, { recursive: true });
      const filePath = path.join(schemaDir, `${tenantId}_openapi.json`);
      await writeFile(filePath, jsonContent, 'utf8');

      // Fleet'e PUSH_SCHEMA komutu gönder
      await (prisma as any).agentCommand.create({
        data: {
          tenantId,
          commandType: 'PUSH_SCHEMA',
          payload: filePath,
          status: 'pending',
        },
      });
    } catch (fsErr) {
      console.error('Schema file write error:', fsErr);
      // DB kaydı başarılıysa devam et
    }

    return NextResponse.json({
      success: true,
      id: schema.id,
      name,
      version,
      pathCount,
      message: `Schema yüklendi: ${pathCount} endpoint tanımlandı`,
    });
  } catch (err) {
    console.error('Schema POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Şemayı deaktif et
export async function DELETE(request: Request) {
  try {
    const tenantId = request.headers.get('x-user-tenant') || '';
    const userRole = request.headers.get('x-user-role') || '';

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    await (prisma as any).schemaRegistry.updateMany({
      where: { tenantId, active: true },
      data: { active: false },
    });

    return NextResponse.json({ success: true, message: 'Schema deaktif edildi' });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
