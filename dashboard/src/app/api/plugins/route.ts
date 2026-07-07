// dashboard/src/app/api/plugins/route.ts — Wasm Plugin Manager API (Feature 4)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createSignedFleetCommand } from '@/lib/fleetCommandSign';

export const dynamic = 'force-dynamic';

// GET: Yüklü Wasm pluginleri listele
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-user-tenant') || '';

    const plugins = await (prisma as any).wasmPlugin.findMany({
      where: { tenantId },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ plugins, total: plugins.length });
  } catch (err) {
    console.error('Plugin list error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Yeni Wasm plugin yükle (base64 encoded binary veya file path)
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-user-tenant') || '';
    const userRole = request.headers.get('x-user-role') || '';

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, version = '1.0', wasmBase64, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    // Dosyayı plugin dizinine yaz
    const pluginDir = process.env.WASM_PLUGIN_DIR || '/etc/log-guardian/plugins';
    const fileName  = `${tenantId}_${name.replace(/[^a-z0-9_-]/gi, '_')}.wasm`;
    const filePath  = path.join(pluginDir, fileName);

    if (wasmBase64) {
      try {
        await mkdir(pluginDir, { recursive: true });
        const wasmBuf = Buffer.from(wasmBase64, 'base64');
        await writeFile(filePath, wasmBuf);
      } catch (fsErr) {
        console.warn('Plugin file write warning:', fsErr);
        // Dosya yazılamazsa sadece DB'ye kaydet
      }
    }

    // DB'ye kaydet
    const plugin = await (prisma as any).wasmPlugin.create({
      data: {
        tenantId,
        name,
        version,
        filePath,
        active: true,
      },
    });

    // Fleet'e PUSH_WASM_PLUGIN komutu gönder
    await createSignedFleetCommand(prisma, {
      tenantId,
      commandType: 'PUSH_WASM_PLUGIN',
      payload: filePath,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      id: plugin.id,
      name,
      version,
      filePath,
      message: `Wasm plugin '${name}' yüklendi ve filoya dağıtılıyor`,
    });
  } catch (err) {
    console.error('Plugin upload error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Plugin kaldır
export async function DELETE(request: Request) {
  try {
    const tenantId = request.headers.get('x-user-tenant') || '';
    const userRole = request.headers.get('x-user-role') || '';
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('id');

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    if (!pluginId) {
      return NextResponse.json({ error: 'Plugin ID required' }, { status: 400 });
    }

    await (prisma as any).wasmPlugin.updateMany({
      where: { id: pluginId, tenantId },
      data: { active: false },
    });

    return NextResponse.json({ success: true, message: 'Plugin deaktif edildi' });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
