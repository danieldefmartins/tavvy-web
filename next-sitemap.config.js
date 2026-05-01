/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://tavvy.com',
  generateRobotsTxt: false, // we already have one
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/app',
    '/app/**',
    '/api/*',
    '/404',
    '/500',
    '/*/app',
    '/*/app/**',
  ],
  // Only index public-facing pages
  transform: async (config, path) => {
    // Higher priority for key pages
    const highPriority = ['/', '/ecard', '/about-us'];
    const medPriority = ['/privacy', '/terms'];

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: highPriority.includes(path) ? 1.0 : medPriority.includes(path) ? 0.3 : config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
