'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { adsAllowed } from '@/lib/editorial/adsense-safety';

/**
 * Guardia de publicidad para navegación SPA (App Router).
 *
 * Problema que resuelve: una vez que `adsbygoogle.js` está cargado en el
 * documento, una navegación cliente (sin recarga) hacia una página NO
 * monetizable — artículo sensible (`meta[name="adsense-block"]`) o ruta
 * privada (`/admin`, `/login`, …) — no puede "descargar" el script. Las
 * unidades manuales ya están vetadas en render, pero Auto ads vive dentro
 * del script de Google y podría insertar formatos en la nueva página.
 *
 * Estrategia (mientras la ruta actual no sea monetizable):
 * 1. Inyectar CSS que oculta todos los contenedores de anuncios de Google.
 * 2. Eliminar del DOM los nodos publicitarios ya insertados.
 * 3. Un MutationObserver retira cualquier nodo publicitario que Google
 *    añada después (auto ads re-escanea el DOM de forma asíncrona).
 * Al volver a una ruta monetizable se retira el CSS y el observer; el
 * script permanece cargado y Auto ads vuelve a operar con normalidad.
 */

const AD_SELECTORS = [
  'ins.adsbygoogle',
  'iframe[id^="aswift"]',
  'iframe[id^="google_ads"]',
  'div[id^="google_ads_iframe"]',
  '[data-anchor-status]',
].join(',');

const BLOCK_STYLE_ID = 'ni-adsense-route-block';

function isBlockedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const articleSensitive =
    document.querySelector('meta[name="adsense-block"]')?.getAttribute('content') === 'true';
  return !adsAllowed(pathname, articleSensitive);
}

function removeAdNodes(root: ParentNode): void {
  root.querySelectorAll(AD_SELECTORS).forEach((el) => el.remove());
}

export default function AdSenseRouteGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || typeof document === 'undefined') return;

    if (!isBlockedRoute(pathname)) {
      document.getElementById(BLOCK_STYLE_ID)?.remove();
      return;
    }

    // 1) CSS de ocultación inmediata.
    if (!document.getElementById(BLOCK_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = BLOCK_STYLE_ID;
      style.textContent = `${AD_SELECTORS}{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;}`;
      document.head.appendChild(style);
    }

    // 2) Retirar lo que ya esté en el DOM.
    removeAdNodes(document);

    // 3) Observer para inserciones posteriores de Auto ads.
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(AD_SELECTORS)) {
            node.remove();
            return;
          }
          removeAdNodes(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
