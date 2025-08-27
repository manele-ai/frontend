import { useLocation } from 'react-router-dom';
import { getSEOConfig, ORGANIZATION_STRUCTURED_DATA } from '../../data/seo';

/**
 * SEO Manager component using React 19's built-in metadata support
 * Automatically renders appropriate metadata tags based on current route
 */
export function SEOManager() {
  const location = useLocation();

  // Determine current page based on pathname
  const pathname = location.pathname;
  let pageName = 'home';

  // Map routes to page names
  if (pathname === '/') {
    pageName = 'home';
  } else if (pathname === '/generate') {
    pageName = 'generate';
  } else if (pathname === '/exemple') {
    pageName = 'examples';
  } else if (pathname === '/leaderboard') {
    pageName = 'leaderboard';
  } else if (pathname === '/tarife') {
    pageName = 'pricing';
  } else if (pathname === '/profile') {
    pageName = 'profile';
  } else if (pathname === '/privacy-policy') {
    pageName = 'privacy';
  } else if (pathname === '/terms-and-conditions') {
    pageName = 'terms';
  } else if (pathname === '/auth') {
    pageName = 'auth';
  } else if (pathname === '/result') {
    pageName = 'result';
  }

  // Get SEO config for current page
  const seoConfig = getSEOConfig(pageName);

  return (
    <>
      {/* Page Title - React 19 will automatically set document.title */}
      <title>{seoConfig.title}</title>
      
      {/* Meta tags */}
      <meta name="description" content={seoConfig.description} />
      <meta name="keywords" content={seoConfig.keywords} />
      
      {/* Open Graph tags */}
      <meta property="og:title" content={seoConfig.ogTitle || seoConfig.title} />
      <meta property="og:description" content={seoConfig.ogDescription || seoConfig.description} />
      <meta property="og:image" content={seoConfig.ogImage} />
      <meta property="og:url" content={seoConfig.ogUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoConfig.ogTitle || seoConfig.title} />
      <meta name="twitter:description" content={seoConfig.ogDescription || seoConfig.description} />
      <meta name="twitter:image" content={seoConfig.ogImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={seoConfig.ogUrl} />
      
      {/* Structured Data - React 19 will automatically deduplicate and place in head */}
      <script type="application/ld+json">
        {JSON.stringify(seoConfig.structuredData)}
      </script>
      
      {/* Organization Structured Data - always included */}
      <script type="application/ld+json">
        {JSON.stringify(ORGANIZATION_STRUCTURED_DATA)}
      </script>
    </>
  );
}

export default SEOManager;
