import type { Noticia } from '@/lib/types';
import type { EditorialBalance, HomeQuality, BrandGuardianVerdict } from './types';
import { HOME_CATEGORY_CAP } from './constants';

/**
 * Brand Guardian — motor dedicado a proteger la identidad de marca.
 * Responde diariamente si la portada representa al medio o lo degrada.
 */
export function buildBrandGuardian(
  _noticias: Noticia[],
  balance: EditorialBalance,
  home: HomeQuality,
): BrandGuardianVerdict {
  const representaMarca = home.score >= 70 && home.violations.length === 0;
  const pareceTabloide = home.dominantCategory === 'Sucesos' && home.dominantShare > HOME_CATEGORY_CAP;
  const sucesosCat = balance.categories.find((c) => c.category === 'Sucesos');
  const excesoSucesos = sucesosCat ? sucesosCat.status === 'excedido' : false;
  const equilibrioEditorial = balance.identityScore >= 70;

  const offBrandSlots = home.brandSlots.filter((s) => !s.onBrand);
  const googleEntenderia = representaMarca && equilibrioEditorial && !pareceTabloide;

  const categoriaDomina = balance.dominant;
  const categoriaDesaparecida = balance.categories
    .filter((c) => c.status === 'deficitario' && c.count === 0)
    .map((c) => c.category)[0] ?? null;
  const categoriaNecesitaCrecer = balance.categories
    .filter((c) => c.status === 'deficitario')
    .sort((a, b) => a.deviation - b.deviation)[0]?.category ?? null;

  const noticiaNoEnHero = offBrandSlots[0]
    ? `Posición ${offBrandSlots[0].position}: "${offBrandSlots[0].title}" (${offBrandSlots[0].category}) no representa la marca.`
    : null;

  const onBrandSlot = home.brandSlots.find((s) => s.onBrand);
  const noticiaMereceHero = onBrandSlot
    ? `"${onBrandSlot.title}" (${onBrandSlot.category}) representa la identidad del medio.`
    : null;

  const problemas: string[] = [];
  if (pareceTabloide) problemas.push('La portada comunica nota roja, no periodismo nacional.');
  if (excesoSucesos) problemas.push('Sucesos domina el archivo y erosiona la identidad.');
  if (!equilibrioEditorial) problemas.push(`Identidad editorial en ${balance.identityScore}/100.`);
  if (offBrandSlots.length > 0) problemas.push(`${offBrandSlots.length} slots en vitina fuera de marca.`);

  const diagnostico = problemas.length === 0
    ? 'La marca está protegida. La portada comunica un medio nacional serio con identidad clara.'
    : `La marca está bajo presión: ${problemas.join(' ')}`;

  return {
    representaMarca,
    pareceTabloide,
    excesoSucesos,
    equilibrioEditorial,
    googleEntenderia,
    categoriaDomina,
    categoriaDesaparecida,
    categoriaNecesitaCrecer,
    noticiaNoEnHero,
    noticiaMereceHero,
    diagnostico,
  };
}
