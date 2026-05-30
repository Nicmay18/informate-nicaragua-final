/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://nicaraguainformate.com',
  generateRobotsTxt: false, // ya lo hicimos manualmente
  exclude: ['/buscar', '/admin', '/login', '/api/*'],
  changefreq: 'daily',
  priority: 0.7,
  additionalPaths: async () => {
    return [];
  },
};
