import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DPC HANURA Tanjungpinang – Portal Internal',
    short_name: 'Hanura TPI',
    description: 'Sistem komunikasi dan manajemen data internal DPC & PAC HANURA Tanjungpinang',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#d4af37',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable',
      }
    ],
  };
}
