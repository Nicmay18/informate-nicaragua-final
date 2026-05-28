export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  photo?: string;
  social?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

export const AUTHORS: Record<string, Author> = {
  'keyling-rivera': {
    slug: 'keyling-rivera',
    name: 'Keyling Elieth Rivera Muñoz',
    role: 'Directora Editorial',
    bio: 'Licenciada en Periodismo. Especializada en cobertura de sucesos, noticias nacionales, deportes e internacionales. Revisa y contrasta la información antes de publicarla para garantizar que sea precisa y confiable. Comprometida con la verdad y la verificación de la información.',
    photo: '/keyling-rivera.jpg',
    social: {
      twitter: 'https://twitter.com/nicinformate',
      facebook: 'https://facebook.com/profile.php?id=61578261125687',
      instagram: 'https://instagram.com/nicaraguainformate',
    },
  },
  'maycol-nicaragua': {
    slug: 'maycol-nicaragua',
    name: 'Maycol Josué Nicaragua Rivas',
    role: 'Director Técnico',
    bio: 'Ingeniero en Sistemas. Se encarga del desarrollo tecnológico, la infraestructura web y todo lo relacionado con que el sitio funcione correctamente. Es el responsable de que la plataforma esté disponible las 24 horas y de la optimización de rendimiento.',
  },
  'jose-lopez': {
    slug: 'jose-lopez',
    name: 'José Luis López Ramírez',
    role: 'Director de Operaciones',
    bio: 'Ingeniero en Sistemas. Coordina la operación diaria, la publicación oportuna de contenido y la organización del equipo. Su trabajo es que todo salga a tiempo y con calidad, asegurando la continuidad del medio.',
  },
};

export function getAuthorBySlug(slug: string): Author | undefined {
  return AUTHORS[slug];
}

export function getAllAuthors(): Author[] {
  return Object.values(AUTHORS);
}
