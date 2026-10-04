# Statement font

`NotoSans.ttf` is the static Noto Sans Regular font from the official [Noto fonts repository](https://github.com/notofonts/noto-fonts/blob/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf). The included `OFL.txt` contains its SIL Open Font License. Keep a static font: the tested variable-font/subsetting combination produced missing glyphs in rendered PDFs despite a valid file structure.

The production Next.js trace includes this font for `/api/finance`. Rendering rejects unsupported characters rather than silently substituting a donor name. CSV retains original UTF-8 text.
