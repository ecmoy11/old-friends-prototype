Le Studio Nocturne — PeachCreme (Creative Market), licensed font.
It is not on any CDN, so it has to be committed here.

Drop these files in this folder and the site picks them up automatically:

  LeStudioNocturne-Standard.woff2   (required)
  LeStudioNocturne-Bold.woff2       (optional, used at font-weight 700)

You will get .otf from Creative Market. Convert with either:
  - https://cloudconvert.com/otf-to-woff2   (easiest)
  - or:  npm i -g ttf2woff2 && ttf2woff2 < file.otf > file.woff2

Keeping the .otf here as well is fine — the @font-face lists it as a
fallback source. Until a file exists, the page renders in Italianno.
