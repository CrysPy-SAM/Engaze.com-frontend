jest.mock("axios", () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),
  put: jest.fn(),
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
}));

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import { PageTitleManager } from '../App';

describe('Technical SEO & Static Crawler Verification', () => {
  const publicDir = path.resolve(__dirname, '../../public');

  describe('sitemap.xml', () => {
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    test('sitemap.xml exists in public directory', () => {
      expect(fs.existsSync(sitemapPath)).toBe(true);
    });

    test('sitemap.xml contains valid XML structure and correct sitemaps namespace', () => {
      const content = fs.readFileSync(sitemapPath, 'utf8');
      expect(content).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(content).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(content).toContain('</urlset>');
    });

    test('sitemap.xml includes public landing and trust pages and strictly excludes /auth', () => {
      const content = fs.readFileSync(sitemapPath, 'utf8');
      expect(content).toContain('<loc>https://www.engaze.date/</loc>');
      expect(content).toContain('<loc>https://www.engaze.date/safety</loc>');
      expect(content).toContain('<loc>https://www.engaze.date/privacy</loc>');
      expect(content).toContain('<loc>https://www.engaze.date/terms</loc>');
      // Utility auth forms have no organic search value and must not be submitted in sitemap
      expect(content).not.toContain('<loc>https://www.engaze.date/auth</loc>');
      expect(content).not.toContain('/auth');
    });

    test('sitemap.xml excludes private, authenticated, dynamic session routes', () => {
      const content = fs.readFileSync(sitemapPath, 'utf8');
      const privateRoutes = [
        '/discovery',
        '/chat',
        '/matches',
        '/profile',
        '/search',
        '/random-video',
        '/random-call',
        '/home',
      ];

      privateRoutes.forEach((route) => {
        expect(content).not.toContain(`<loc>https://www.engaze.date${route}`);
        expect(content).not.toContain(route);
      });
    });

    test('all loc URLs in sitemap use canonical https://www.engaze.date hostname', () => {
      const content = fs.readFileSync(sitemapPath, 'utf8');
      const locMatches = content.match(/<loc>(.*?)<\/loc>/g) || [];
      expect(locMatches.length).toBe(4);

      locMatches.forEach((locTag) => {
        const url = locTag.replace(/<\/?loc>/g, '');
        expect(url.startsWith('https://www.engaze.date')).toBe(true);
      });
    });
  });

  describe('robots.txt', () => {
    const robotsPath = path.join(publicDir, 'robots.txt');

    test('robots.txt exists in public directory', () => {
      expect(fs.existsSync(robotsPath)).toBe(true);
    });

    test('robots.txt specifies User-agent: * and points to canonical sitemap', () => {
      const content = fs.readFileSync(robotsPath, 'utf8');
      expect(content).toContain('User-agent: *');
      expect(content).toContain('Sitemap: https://www.engaze.date/sitemap.xml');
    });

    test('robots.txt allows public routes and assets', () => {
      const content = fs.readFileSync(robotsPath, 'utf8');
      expect(content).toContain('Allow: /');
      expect(content).toContain('Allow: /auth');
      expect(content).toContain('Allow: /static/');
    });

    test('robots.txt disallows private authenticated routes', () => {
      const content = fs.readFileSync(robotsPath, 'utf8');
      const disallowedPaths = [
        'Disallow: /discovery',
        'Disallow: /chat',
        'Disallow: /matches',
        'Disallow: /profile',
        'Disallow: /search',
        'Disallow: /random-video',
        'Disallow: /random-call',
        'Disallow: /home',
      ];

      disallowedPaths.forEach((directive) => {
        expect(content).toContain(directive);
      });
    });
  });

  describe('index.html metadata, canonical tags, and structured data', () => {
    const htmlPath = path.join(publicDir, 'index.html');

    test('index.html contains canonical URL pointing to https://www.engaze.date/', () => {
      const content = fs.readFileSync(htmlPath, 'utf8');
      expect(content).toContain('<link rel="canonical" href="https://www.engaze.date/" />');
    });

    test('index.html contains robots meta tag allowing indexing and link following for root', () => {
      const content = fs.readFileSync(htmlPath, 'utf8');
      expect(content).toContain('<meta name="robots" content="index, follow" />');
    });

    test('index.html contains Open Graph and Twitter metadata with absolute URLs', () => {
      const content = fs.readFileSync(htmlPath, 'utf8');
      expect(content).toContain('<meta property="og:url" content="https://www.engaze.date/" />');
      expect(content).toContain('<meta property="og:image" content="https://www.engaze.date/logo512.png" />');
      expect(content).toContain('<meta name="twitter:url" content="https://www.engaze.date/" />');
      expect(content).toContain('<meta name="twitter:image" content="https://www.engaze.date/logo512.png" />');
    });

    test('index.html contains valid Organization, WebSite, WebApplication, and FAQPage JSON-LD schemas', () => {
      const content = fs.readFileSync(htmlPath, 'utf8');
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(jsonLdMatch).toBeTruthy();

      const parsed = JSON.parse(jsonLdMatch[1]);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(Array.isArray(parsed['@graph'])).toBe(true);

      const org = parsed['@graph'].find((item) => item['@type'] === 'Organization');
      expect(org).toBeTruthy();
      expect(org.name).toBe('Engaze');
      expect(org.contactPoint).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'support@engaze.date' }),
          expect.objectContaining({ email: 'contact@engaze.date' }),
        ])
      );

      const faq = parsed['@graph'].find((item) => item['@type'] === 'FAQPage');
      expect(faq).toBeTruthy();
      expect(Array.isArray(faq.mainEntity)).toBe(true);
      expect(faq.mainEntity.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Dynamic Route SEO & Metadata Protection (PageTitleManager)', () => {
    afterEach(() => {
      document.title = '';
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.parentNode.removeChild(canonical);
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.parentNode.removeChild(robots);
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.parentNode.removeChild(desc);
    });

    test('homepage (/) sets canonical to https://www.engaze.date/ and robots to index, follow', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <PageTitleManager />
        </MemoryRouter>
      );

      expect(document.title).toBe('Engaze — Dating Platform & Live 1-on-1 Video Connections');
      expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe('index, follow');
      expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://www.engaze.date/');
      expect(document.querySelector('meta[name="description"]').getAttribute('content')).toContain('Engaze is a modern dating platform');
    });

    test('privacy policy (/privacy) sets robots to index, follow and canonical to https://www.engaze.date/privacy', () => {
      render(
        <MemoryRouter initialEntries={['/privacy']}>
          <PageTitleManager />
        </MemoryRouter>
      );

      expect(document.title).toBe('Privacy Policy — Engaze');
      expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe('index, follow');
      expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://www.engaze.date/privacy');
      expect(document.querySelector('meta[name="description"]').getAttribute('content')).toContain('Privacy Policy');
    });

    test('terms of service (/terms) sets robots to index, follow and canonical to https://www.engaze.date/terms', () => {
      render(
        <MemoryRouter initialEntries={['/terms']}>
          <PageTitleManager />
        </MemoryRouter>
      );

      expect(document.title).toBe('Terms of Service — Engaze');
      expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe('index, follow');
      expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://www.engaze.date/terms');
      expect(document.querySelector('meta[name="description"]').getAttribute('content')).toContain('Terms of Service');
    });

    test('safety center (/safety) sets robots to index, follow and canonical to https://www.engaze.date/safety', () => {
      render(
        <MemoryRouter initialEntries={['/safety']}>
          <PageTitleManager />
        </MemoryRouter>
      );

      expect(document.title).toBe('Safety Tips & Community Guidelines — Engaze');
      expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe('index, follow');
      expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://www.engaze.date/safety');
      expect(document.querySelector('meta[name="description"]').getAttribute('content')).toContain('dating safety tips');
    });

    test('/auth route sets robots to noindex, follow and isolates canonical', () => {
      render(
        <MemoryRouter initialEntries={['/auth']}>
          <PageTitleManager />
        </MemoryRouter>
      );

      expect(document.title).toBe('Sign In or Join — Engaze');
      expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex, follow');
      expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://www.engaze.date/auth');
      expect(document.querySelector('meta[name="description"]').getAttribute('content')).toContain('Sign in or join Engaze');
    });

    test('authenticated route (/discovery) sets robots to noindex, nofollow and removes homepage canonical', () => {
      const preCanonical = document.createElement('link');
      preCanonical.setAttribute('rel', 'canonical');
      preCanonical.setAttribute('href', 'https://www.engaze.date/');
      document.head.appendChild(preCanonical);

      render(
        <MemoryRouter initialEntries={['/discovery']}>
          <PageTitleManager />
        </MemoryRouter>
      );

      expect(document.title).toBe('Discovery — Engaze');
      expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex, nofollow');
      expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    });

    test('authenticated route (/chat/:id) sets robots to noindex, nofollow and removes canonical', () => {
      render(
        <MemoryRouter initialEntries={['/chat/conv_123']}>
          <PageTitleManager />
        </MemoryRouter>
      );

      expect(document.title).toBe('Messages & Chat — Engaze');
      expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex, nofollow');
      expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    });

    test('unknown / 404 route sets robots to noindex, nofollow and removes canonical', () => {
      render(
        <MemoryRouter initialEntries={['/random-unknown-page']}>
          <PageTitleManager />
        </MemoryRouter>
      );

      expect(document.title).toBe('Page Not Found — Engaze');
      expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex, nofollow');
      expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    });
  });
});
