/**
 * SEO Configuration for Manele IO
 * Centralized metadata configuration for all pages
 */

export const SEO_CONFIG = {
  // Default/Home page metadata
  home: {
    title: 'Manele IO - Generează Muzică Personalizată cu AI',
    description: 'Creează manele personalizate cu AI. Începe să creezi acum!',
    keywords: 'manele, generează manele, generate manele, generează, generate, muzică românească, AI, generare muzică, versuri personalizate, melodii, muzică personalizată, România',
    ogTitle: 'Manele IO - Generează Muzică Personalizată cu AI',
    ogDescription: 'Creează manele personalizate cu AI. Începe să creezi acum!',
    ogImage: '/photos/HeroSectionHomePage.jpeg',
    ogUrl: 'https://manele.io',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Manele IO',
      description: 'Platformă pentru generarea de muzică personalizată cu AI',
      url: 'https://manele.io',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://manele.io/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    }
  },

  // Generate page metadata
  generate: {
    title: 'Generează Muzică - Manele IO',
    description: 'Alege stilul muzical și generează muzică personalizată cu AI. Stiluri disponibile: manele livem de pahar, jale, lautărești, opulentă, orientală, muzică populară, trapanele.',
    keywords: 'manele, generează manele, generate manele, generează, generate, muzică românească, AI, generare muzică, versuri personalizate, melodii, muzică personalizată, România, generează muzică, AI muzică, stiluri muzicale, manele personalizate, versuri AI, melodii AI',
    ogTitle: 'Generează Muzică Personalizată - Manele IO',
    ogDescription: 'Alege stilul muzical și generează muzică personalizată cu AI. Multiple stiluri disponibile.',
    ogImage: '/photos/Generare.png',
    ogUrl: 'https://manele.io/generate',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Manele IO Generator',
      description: 'Aplicație pentru generarea de muzică personalizată cu AI',
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web Browser'
    }
  },

  // Leaderboard page metadata
  leaderboard: {
    title: 'Topul Utilizatorilor - Manele IO',
    description: 'Vezi topul utilizatorilor cu cele mai multe generări de muzică. Competiție și clasament pentru creatorii de muzică.',
    keywords: 'manele, top utilizatori, clasament, competiție, generări muzică, ranking, muzică',
    ogTitle: 'Topul Utilizatorilor - Manele IO',
    ogDescription: 'Vezi topul utilizatorilor cu cele mai multe generări de muzică.',
    ogImage: '/photos/Topul.png',
    ogUrl: 'https://manele.io/leaderboard',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Topul Utilizatorilor Manele IO',
      description: 'Clasamentul utilizatorilor cu cele mai multe generări de muzică'
    }
  },

  // Pricing page metadata
  pricing: {
    title: 'Tarife și Abonamente - Manele IO',
    description: 'Alege planul perfect pentru generarea de muzică. Abonamente flexibile cu diferite limite de generări. Începe gratuit!',
    keywords: 'tarife, abonamente, prețuri, planuri, generări muzică, costuri',
    ogTitle: 'Tarife și Abonamente - Manele IO',
    ogDescription: 'Alege planul perfect pentru generarea de muzică cu abonamente flexibile.',
    ogImage: '/photos/Petrecere.jpeg',
    ogUrl: 'https://manele.io/tarife',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Tarife și Abonamente Manele IO',
      description: 'Informații despre tarifele și abonamentele disponibile'
    }
  },

  // Profile page metadata
  profile: {
    title: 'Profil Utilizator - Manele IO',
    description: 'Gestionează profilul tău, vezi istoricul generărilor și setează preferințele pentru generarea de muzică.',
    keywords: 'profil utilizator, cont, setări, istoric generări, preferințe',
    ogTitle: 'Profil Utilizator - Manele IO',
    ogDescription: 'Gestionează profilul tău și preferințele pentru generarea de muzică.',
    ogImage: '/photos/user.png',
    ogUrl: 'https://manele.io/profile',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: 'Profil Utilizator Manele IO',
      description: 'Pagina de profil pentru utilizatorii platformei'
    }
  },

  // Privacy Policy page metadata
  privacy: {
    title: 'Politica de Confidențialitate - Manele IO',
    description: 'Politica de confidențialitate și protecția datelor personale. Informații despre cum folosim și protejăm datele tale.',
    keywords: 'confidențialitate, protecția datelor, GDPR, politica confidențialitate, date personale',
    ogTitle: 'Politica de Confidențialitate - Manele IO',
    ogDescription: 'Politica de confidențialitate și protecția datelor personale.',
    ogImage: '/photos/HeroSectionHomePage.jpeg',
    ogUrl: 'https://manele.io/privacy-policy',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Politica de Confidențialitate Manele IO',
      description: 'Politica de confidențialitate a platformei Manele IO'
    }
  },

  // Terms and Conditions page metadata
  terms: {
    title: 'Termeni și Condiții - Manele IO',
    description: 'Termenii și condițiile de utilizare a platformei Manele IO. Regulile și obligațiile pentru utilizatori.',
    keywords: 'termeni condiții, reguli utilizare, obligații utilizatori, contract, platformă',
    ogTitle: 'Termeni și Condiții - Manele IO',
    ogDescription: 'Termenii și condițiile de utilizare a platformei Manele IO.',
    ogImage: '/photos/HeroSectionHomePage.jpeg',
    ogUrl: 'https://manele.io/terms-and-conditions',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Termeni și Condiții Manele IO',
      description: 'Termenii și condițiile de utilizare a platformei Manele IO'
    }
  },

  // Auth page metadata
  auth: {
    title: 'Autentificare - Manele IO',
    description: 'Conectează-te sau creează un cont pentru a începe să generezi muzică personalizată cu AI.',
    keywords: 'autentificare, login, înregistrare, cont utilizator, conectare',
    ogTitle: 'Autentificare - Manele IO',
    ogDescription: 'Conectează-te sau creează un cont pentru a începe să generezi muzică.',
    ogImage: '/photos/HeroSectionHomePage.jpeg',
    ogUrl: 'https://manele.io/auth',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Autentificare Manele IO',
      description: 'Pagina de autentificare și înregistrare'
    }
  },

  // Result page metadata
  result: {
    title: 'Rezultatul Generării - Manele IO',
    description: 'Vezi și descarcă muzica generată cu AI. Ascultă rezultatul final și salvează-l pe dispozitivul tău.',
    keywords: 'rezultat generare, muzică generată, descarcă muzică, ascultă muzică, AI rezultat',
    ogTitle: 'Rezultatul Generării - Manele IO',
    ogDescription: 'Vezi și descarcă muzica generată cu AI.',
    ogImage: '/photos/Generare.png',
    ogUrl: 'https://manele.io/result',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: 'Muzică Generată cu AI',
      description: 'Rezultatul generării de muzică cu tehnologia AI'
    }
  }
};

/**
 * Get SEO config for a specific page
 * @param {string} pageName - The name of the page
 * @returns {object} SEO configuration object
 */
export function getSEOConfig(pageName) {
  return SEO_CONFIG[pageName] || SEO_CONFIG.home;
}

/**
 * Get structured data for organization
 */
export const ORGANIZATION_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Manele IO',
  description: 'Platformă pentru generarea de muzică personalizată cu AI',
  url: 'https://manele.io',
  logo: {
    '@type': 'ImageObject',
    url: 'https://manele.io/icons/_LOGO_ICON.svg',
    width: 1000,
    height: 1000,
    caption: 'Manele IO Logo'
  },
  image: {
    '@type': 'ImageObject',
    url: 'https://manele.io/icons/_LOGO_ICON.svg',
    width: 1000,
    height: 1000
  },
  sameAs: [
    // Add your social media URLs here when available
    'https://www.tiktok.com/@manele.io',
    'https://www.instagram.com/manele.io',
  ]
};

/**
 * Get structured data for music styles
 */
export function getMusicStyleStructuredData(styleName, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: `Muzică ${styleName}`,
    description: description,
    genre: styleName,
    recordingOf: {
      '@type': 'MusicComposition',
      name: `Compoziție ${styleName}`,
      composer: {
        '@type': 'Person',
        name: 'AI Generator'
      }
    }
  };
}
