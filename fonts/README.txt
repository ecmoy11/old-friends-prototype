FONTS
=====

italianno-latin-400.woff2 / italianno-latin-ext-400.woff2
---------------------------------------------------------
The display script the site currently uses, served from here rather than
from Google Fonts. That matters: it is the most visible type on the site,
and going through a third party meant it could quietly fail on a phone and
fall through to whatever the OS calls "cursive" (Snell Roundhand on iOS).
Self-hosted, it cannot fail. Italianno is OFL-1.1, so shipping it here is
allowed. Do not delete these.

Le Studio Nocturne  (PeachCreme, Creative Market) -- optional upgrade
---------------------------------------------------------------------
Licensed, so it is not on any CDN and is not in this repo. To switch to it:

1. Buy it, then convert the .otf to .woff2 with either
     https://cloudconvert.com/otf-to-woff2      (easiest)
     npm i -g ttf2woff2 && ttf2woff2 < file.otf > file.woff2
2. Put LeStudioNocturne-Standard.woff2 in this folder.
3. Paste this into the first <style> block of each page, above the
   Italianno @font-face rules:

   @font-face {
     font-family: 'Le Studio Nocturne';
     src: url('fonts/LeStudioNocturne-Standard.woff2') format('woff2');
     font-weight: 400; font-style: normal; font-display: swap;
   }

Nothing else changes -- 'Le Studio Nocturne' is already first in the
--font-script stack in :root, so it takes over the moment it exists.
Until then that name matches nothing and the browser moves on to
Italianno, which costs nothing.
