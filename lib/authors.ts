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
  /** Áreas temáticas que cubre el autor. */
  coverageAreas?: string[];
  /** Años o trayectoria de experiencia. */
  experience?: string;
}

export const AUTHORS: Record<string, Author> = {
  'keyling-rivera': {
    slug: 'keyling-rivera',
    name: 'Keyling Elieth Rivera Muñoz',
    role: 'Directora Editorial',
    bio: 'Licenciada en Periodismo con mas de 8 anos de experiencia en medios de comunicacion nicaraguenses. Especializada en cobertura de sucesos, noticias nacionales, politica, deportes e informacion internacional. Ha cubierto elecciones municipales, desastres naturales, crisis politicas y eventos deportivos de alto impacto en Nicaragua y Centroamerica. Directora Editorial de Nicaragua Informate desde su fundacion en 2024, donde supervisa la linea editorial, verifica fuentes y garantiza que cada publicacion cumpla con estandares de precision, imparcialidad y etica periodistica. Certificada en Verificacion de Datos por el Centro de Periodismo Digital de la Universidad de Texas en Austin. Miembro activo de la Red de Periodistas de Nicaragua. Su trabajo ha sido citado por medios regionales de Costa Rica, Honduras y El Salvador.',
    photo: '/keyling-rivera.jpg',
    social: {
      facebook: 'https://www.facebook.com/profile.php?id=61578261125687',
    },
    coverageAreas: ['Sucesos', 'Nacionales', 'Política', 'Deportes', 'Internacionales'],
    experience: 'Más de 8 años de periodismo en medios nicaragüenses y certificación en verificación de datos.',
  },
  'maycol-nicaragua': {
    slug: 'maycol-nicaragua',
    name: 'Maycol Josué Nicaragua Rivas',
    role: 'Director Técnico',
    bio: 'Ingeniero en Sistemas. Se encarga del desarrollo tecnológico, la infraestructura web y todo lo relacionado con que el sitio funcione correctamente. Es el responsable de que la plataforma esté disponible las 24 horas y de la optimización de rendimiento.',
    coverageAreas: ['Tecnología', 'Datos', 'Infraestructura digital'],
    experience: 'Ingeniero en sistemas con experiencia en verificación de fuentes digitales, análisis de tendencias y seguridad informática.',
  },
  'jose-lopez': {
    slug: 'jose-lopez',
    name: 'José Luis López Ramírez',
    role: 'Director de Operaciones',
    bio: 'Ingeniero en Sistemas. Coordina la operación diaria, la publicación oportuna de contenido y la organización del equipo. Su trabajo es que todo salga a tiempo y con calidad, asegurando la continuidad del medio.',
    coverageAreas: ['Operaciones editoriales', 'Distribución', 'Redes sociales'],
    experience: 'Coordinación editorial y operativa para medios digitales desde 2024.',
  },
};

export function getAuthorBySlug(slug: string): Author | undefined {
  return AUTHORS[slug];
}

export function getAllAuthors(): Author[] {
  return Object.values(AUTHORS);
}
