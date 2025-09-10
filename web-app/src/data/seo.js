/**
 * SEO Configuration for Manele IO
 * Centralized metadata configuration for all pages
 */

export const SEO_CONFIG = {
  // Default/Home page metadata
  home: {
    title: 'Manele IO 🎵 | Generează Manele Personalizate cu AI Online',
    description: 'Descoperă Manele IO – prima aplicație din România unde poți genera manele personalizate cu AI. Creează melodii în stiluri variate: de pahar, jale, trapanele, lăutărești și multe altele. Rapid!',
    keywords: 'manele, manele AI, manele personalizate, generează manele online, trapanele, muzică românească, AI muzică, melodii personalizate, versuri AI, muzică, creație muzicală online',
    ogTitle: 'Manele IO – Generează Manele Personalizate cu AI',
    ogDescription: 'Creează manele unice cu AI, rapid. Alege stilul preferat – de pahar, jale, trapanele – și ascultă melodia în câteva secunde!',
    ogImage: '/photos/HeroSectionHomePage.jpeg',
    ogUrl: 'https://manele.io',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Manele IO',
      description: 'Platformă românească pentru generarea de muzică personalizată cu AI: manele, trapanele, muzică de petrecere și versuri unice.',
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
    title: 'Generează Manele Online cu AI | Trapanele, Jale, lautaresti și Altele - Manele IO',
    description: 'Creează manele personalizate cu AI în diferite stiluri: de pahar, jale, lăutărești, trapanele, orientale sau populare. Alege stilul și ascultă melodia ta unică!',
    keywords: 'manele, manele AI, generează manele online, trapanele, manele de pahar, manele de jale, manele orientale, muzică românească, generare muzică AI, melodii personalizate, versuri manele AI',
    ogTitle: 'Generează Muzică Personalizată cu AI - Manele IO',
    ogDescription: 'Alege un stil muzical – trapanele, de pahar, jale, lăutărești – și creează-ți manele personalizate cu AI. Experiență unică, rapidă și creativă!',
    ogImage: '/photos/Generare.png',
    ogUrl: 'https://manele.io/generate',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Manele IO Generator',
      description: 'Aplicație online pentru generarea de manele personalizate cu AI: trapanele, de pahar, jale, lăutărești, populare și orientale.',
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web Browser'
    }
  },

  // Leaderboard page metadata
  leaderboard: {
    title: 'Top Maneliști AI 🎤 | Clasament Generări Muzică - Manele IO',
    description: 'Descoperă clasamentul utilizatorilor care au generat cele mai multe manele cu AI. Vezi cine domină topul și ascultă cele mai populare creații muzicale!',
    keywords: 'top manele, maneliști AI, clasament manele, top utilizatori manele IO, manele populare, generări muzică AI, ranking manele, muzică românească AI',
    ogTitle: 'Topul Maneliștilor AI - Manele IO',
    ogDescription: 'Intră pe Manele IO și vezi clasamentul celor mai activi utilizatori și topul manelelor generate cu AI.',
    ogImage: '/photos/Topul.png',
    ogUrl: 'https://manele.io/leaderboard',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Topul Maneliștilor AI - Manele IO',
      description: 'Clasamentul utilizatorilor și al manelelor generate cu AI pe platforma Manele IO'
    }
  },

  // Pricing page metadata
  pricing: {
    title: 'Tarife și Abonamente | Generare Manele cu AI - Manele IO',
    description: 'Alege planul perfect pentru generarea de muzică. Abonamente flexibile cu diferite limite de generări. Începe acum!',
    keywords: 'tarife, abonamente, prețuri, planuri, generări muzică, costuri',
    ogTitle: 'Tarife și Abonamente | Generare Manele cu AI - Manele IO',
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
    title: 'Profil Utilizator | Istoric Generări & Setări Cont - Manele IO',
    description: 'Accesează profilul tău pe Manele IO: vezi istoricul melodiilor generate cu AI, gestionează contul și personalizează-ți preferințele muzicale.',
    keywords: 'profil utilizator manele IO, cont manele AI, setări profil, istoric generări muzică, preferințe muzicale, manele personalizate',
    ogTitle: 'Profilul Meu - Manele IO',
    ogDescription: 'Gestionează profilul tău, istoricul melodiilor generate și preferințele muzicale pe Manele IO.',
    ogImage: '/photos/user.png',
    ogUrl: 'https://manele.io/profile',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: 'Profil Utilizator - Manele IO',
      description: 'Pagina de profil pentru utilizatorii Manele IO: cont, istoric generări și setări personalizate'
    }
  },

  // Privacy Policy page metadata
  privacy: {
    title: 'Politica de Confidențialitate & GDPR - Manele IO',
    description: 'Află cum Manele IO colectează, utilizează și protejează datele tale personale. Politica de confidențialitate este aliniată cu reglementările GDPR.',
    keywords: 'politica de confidențialitate manele IO, confidențialitate date, GDPR România, protecția datelor personale, securitate online',
    ogTitle: 'Politica de Confidențialitate - Manele IO',
    ogDescription: 'Citește politica de confidențialitate și modul în care protejăm datele tale conform GDPR.',
    ogImage: '/photos/HeroSectionHomePage.jpeg',
    ogUrl: 'https://manele.io/privacy-policy',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Politica de Confidențialitate & GDPR - Manele IO',
      description: 'Informații complete despre politica de confidențialitate și protecția datelor personale pe platforma Manele IO'
    }
  },

  // Terms and Conditions page metadata
  terms: {
    title: 'Termeni și Condiții de Utilizare - Manele IO',
    description: 'Citește termenii și condițiile platformei Manele IO: reguli de utilizare, obligațiile utilizatorilor și informații legale privind serviciile oferite.',
    keywords: 'termeni și condiții manele IO, reguli platformă, contract utilizator, obligații utilizatori, condiții legale, termeni de utilizare',
    ogTitle: 'Termeni și Condiții - Manele IO',
    ogDescription: 'Vezi termenii și condițiile de utilizare a platformei Manele IO și regulile pentru utilizatori.',
    ogImage: '/photos/HeroSectionHomePage.jpeg',
    ogUrl: 'https://manele.io/terms-and-conditions',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Termeni și Condiții - Manele IO',
      description: 'Document oficial cu termenii și condițiile de utilizare a platformei Manele IO'
    }
  },

  // Auth page metadata
  auth: {
    title: 'Autentificare & Creare Cont - Manele IO',
    description: 'Conectează-te la contul tău sau creează unul nou pentru a genera manele personalizate cu AI. Gestionează profilul, istoricul și preferințele tale muzicale.',
    keywords: 'autentificare manele IO, login manele IO, creare cont, înregistrare utilizator, conectare platformă muzică AI, cont utilizator manele',
    ogTitle: 'Autentificare & Înregistrare - Manele IO',
    ogDescription: 'Intră în contul tău sau creează unul nou pentru a începe să generezi manele personalizate cu AI.',
    ogImage: '/photos/HeroSectionHomePage.jpeg',
    ogUrl: 'https://manele.io/auth',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Autentificare & Creare Cont - Manele IO',
      description: 'Pagina de login și înregistrare pentru utilizatorii platformei Manele IO'
    }
  },

  // Result page metadata
  result: {
    title: 'Rezultat Generare Manelă AI | Ascultă & Descarcă Melodia - Manele IO',
    description: 'Ascultă rezultatul generării tale cu AI pe Manele IO. Vezi melodia completă, descarcă fișierul și salvează-ți manelele personalizate pe dispozitivul tău.',
    keywords: 'rezultat manele AI, melodie generată, descarcă manele AI, ascultă manele personalizate, muzică AI, melodii create online',
    ogTitle: 'Rezultatul Generării Tale - Manele IO',
    ogDescription: 'Ascultă și descarcă melodia generată cu AI pe platforma Manele IO.',
    ogImage: '/photos/Generare.png',
    ogUrl: 'https://manele.io/result',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: 'Manea Generată cu AI',
      description: 'Rezultatul final al unei manele personalizate generate cu inteligență artificială pe Manele IO',
      inLanguage: 'ro',
      byArtist: {
        '@type': 'Person',
        name: 'AI Generator'
      }
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
