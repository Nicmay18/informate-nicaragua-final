import { NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/db/homepage';
import { evaluate as pipelineV4 } from '@/lib/editorial';
import { getPortadaConfig, savePortadaConfig } from '@/lib/portada/config-service';
import { buildDefaultConfig, noticiaToInput } from '@/lib/portada/helpers';
import type { PortadaCandidatesResponse, PortadaConfig, PortadaItem } from '@/lib/portada/types';

export async function GET(): Promise<NextResponse> {
  try {
    const noticias = await getLatestNews(120);
    const items: PortadaItem[] = [];

    for (const n of noticias) {
      try {
        const resultado = pipelineV4(noticiaToInput(n));
        items.push({ noticia: n, resultado });
      } catch (err) {
        console.error('[portada] fallo analizando', n.slug, err);
      }
    }

    let config = await getPortadaConfig();
    if (!config) {
      config = buildDefaultConfig(items);
      await savePortadaConfig(config);
    }

    const response: PortadaCandidatesResponse = { items, config };
    return NextResponse.json(response);
  } catch (err) {
    console.error('[portada] GET error', err);
    return NextResponse.json({ error: 'Error cargando portada' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const config = body.config as PortadaConfig;

    if (!config || !config.sections) {
      return NextResponse.json({ error: 'Config inválida' }, { status: 400 });
    }

    await savePortadaConfig({ ...config, version: (config.version || 1) + 1 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[portada] POST error', err);
    return NextResponse.json({ error: 'Error guardando portada' }, { status: 500 });
  }
}
