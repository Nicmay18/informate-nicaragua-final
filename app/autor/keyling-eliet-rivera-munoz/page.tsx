import { permanentRedirect } from 'next/navigation';

// Perfil duplicado: el canónico vive en /autor/keyling-rivera (ruta dinámica).
// Se redirige 301 para consolidar señales SEO y evitar contenido duplicado.
export default function AutorKeylingLegacyPage() {
  permanentRedirect('/autor/keyling-rivera');
}
