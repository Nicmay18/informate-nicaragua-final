import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * Tries to recover the content of empty articles by fetching a cached version
 * from Google cache (or Wayback) and writing it back to Firestore.
 *
 * The endpoint is meant to be called once (POST) from the admin panel.
 */
export async function POST() {
  try {
    const db = getAdminDb();
    // Get all articles that have empty or very short content
    const snap = await db.collection('noticias').where('contenido', '==', '').get();
    const emptyDocs = snap.docs;
    if (emptyDocs.length === 0) {
      return NextResponse.json({ message: 'No empty articles found' });
    }

    let restored = 0;
    const failures: string[] = [];

    for (const docSnap of emptyDocs) {
      const data = docSnap.data();
      const slug = data.slug || docSnap.id; // fallback to id if slug missing
      const url = `https://nicaraguainformate.com/noticias/${slug}`;
      // Try Google cache first
      const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${url}`;
      let html = '';
      try {
        const res = await fetch(cacheUrl);
        if (res.ok) {
          html = await res.text();
        }
      } catch (_) {}
      // If Google cache fails, try Wayback Machine
      if (!html) {
        const waybackUrl = `https://web.archive.org/web/20260609/${url}`;
        try {
          const res = await fetch(waybackUrl);
          if (res.ok) {
            html = await res.text();
          }
        } catch (_) {}
      }
      if (!html) {
        failures.push(docSnap.id);
        continue;
      }
      // Extract the article body – the site wraps it in <div class="article-body" ...>
      const bodyMatch = html.match(/<div[^>]*class=["']?article-body["']?[^>]*>([\s\S]*?)<\/div>/i);
      const content = bodyMatch ? bodyMatch[1].trim() : '';
      if (!content) {
        failures.push(docSnap.id);
        continue;
      }
      await db.doc(`noticias/${docSnap.id}`).update({ contenido: content });
      restored++;
    }

    return NextResponse.json({ restored, totalEmpty: emptyDocs.length, failures });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
