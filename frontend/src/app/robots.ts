import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/profile/', '/dm/'],
      },
    ],
    sitemap: 'https://boltynetwork.xyz/sitemap.xml',
    host: 'https://boltynetwork.xyz',
  };
}
