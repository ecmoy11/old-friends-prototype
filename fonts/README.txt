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

LeStudioNocturne-Standard.woff2  -- the display face in use
------------------------------------------------------------
SUBSET. 32KB, down from the 63KB original, and it renders pixel-identical
(same glyphs, same swashes, same widths -- checked). What was dropped is
the optional OpenType features nothing on the site asks for: swsh, salt,
stylistic sets and so on. The default-firing ones -- kern, liga, clig,
calt, rlig, ccmp, locl, mark, mkmk -- are all still there, which is why
nothing changed visually.

Covers basic Latin, Latin-1, curly quotes, en/em dash, ellipsis, tm and
(R). If copy ever needs a character outside that, re-subset from the
original in Le-Studio-Nocturne-Nostalgic-Set/ rather than editing this.

It is also preloaded from the <head> of every page, so the download
starts in the first bytes of HTML instead of waiting for the CSS to be
parsed and matched to some text.

Bold is NOT published. Nothing on the site sets the script face at weight
700, so it was 70KB of licensed font sitting on a public URL for nothing.
The file is still in this folder and git-ignored -- to use it, un-ignore
it and add the weight-700 @font-face back.

Le Studio Nocturne  (PeachCreme, Creative Market) -- the original purchase
--------------------------------------------------------------------------
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
