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
    sitemap: 'https://atlas.market/sitemap.xml',
    host: 'https://atlas.market',
  };
}
