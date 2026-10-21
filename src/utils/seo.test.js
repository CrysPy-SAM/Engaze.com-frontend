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

    test('sitemap.xml includes only high-value public landing page and strictly excludes /auth', () => {
      const content = fs.readFileSync(sitemapPath, 'utf8');
      expect(content).toContain('<loc>https://www.engaze.date/</loc>');
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
      expect(locMatches.length).toBe(1);

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

  describe('index.html metadata and canonical tags', () => {
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
  });

  describe('Dynamic Route SEO & Metadata Protection (PageTitleManager)', () => {
    afterEach(() => {
      document.title = '';
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.parentNode.removeChild(canonical);
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.parentNode.removeChild(robots);
    });

    test('homepage (/) sets canonical to https://www.engaze.date/ and robots to index, follow', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <PageTitleManager />
        </MemoryRouter>
      );

      expect(document.title).toBe('Engaze — Dating & Live Video Connections');
      expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe('index, follow');
      expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://www.engaze.date/');
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
    });

    test('authenticated route (/discovery) sets robots to noindex, nofollow and removes homepage canonical', () => {
      // Pre-seed canonical to simulate SPA navigation from homepage
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
