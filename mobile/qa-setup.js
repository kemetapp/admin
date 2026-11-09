// بيكتب dist/qa.html بعد كل export (لأن expo بيمسح dist).
const fs = require('fs');
const path = require('path');

const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KEMET QA</title>
    <style>
      html, body { margin: 0; padding: 0; background: #1b1e16; height: 100%; overflow: hidden; }
      .wrap { height: 100vh; display: grid; place-items: center; }
      iframe { width: 390px; height: 844px; border: 0; background: #fbf6e8; display: block; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <iframe id="app" name="app" src="/" title="KEMET app"></iframe>
    </div>
  </body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'dist', 'qa.html'), html);
console.log('wrote dist/qa.html');
