const { chromium } = require('playwright'); const fs = require('fs');
const sheets = {
  furniture: ['desk', 'chair', 'cabinet', 'bed', 'lowTable', 'futon', 'chest', 'mattress', 'bookcase', 'stool', 'armchair', 'windowTable', 'trainSeat', 'berth'],
  props: ['laptopBasic', 'mug', 'notebook', 'lamp', 'plant', 'cushion', 'andon', 'globe', 'telescope', 'rug', 'frame', 'shelf', 'scroll', 'luggageRack', 'birthdayCake'],
};
(async () => { const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
await c.addInitScript(() => { localStorage.setItem('cozyroom-art', 'detail'); localStorage.setItem('cozyroom-save-v2', JSON.stringify({ coins: 5, lastSeen: Date.now(), profileDone: true, decorDone: { studio: true } })); });
const p = await c.newPage(); await p.goto('file:///home/user/my-cozy-room/index.html?hour=14'); await p.waitForTimeout(500);
for (const [name, ids] of Object.entries(sheets)) {
  await p.evaluate(([name, ids]) => {
    document.getElementById('ref')?.remove();
    const wrap = document.createElement('div'); wrap.id = 'ref';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:999;background:#fff;padding:16px;display:grid;grid-template-columns:repeat(5,1fr);gap:12px;align-content:start;font:14px sans-serif;color:#3a3632';
    ids.forEach((id, i) => {
      const f = FURNITURE[id];
      const pv = makePreview(id);
      const s = 3; const o = document.createElement('canvas'); o.width = pv.width * s; o.height = pv.height * s;
      const x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(pv, 0, 0, o.width, o.height);
      o.style.cssText = 'width:' + Math.min(220, o.width / 2) + 'px;image-rendering:pixelated';
      const cell = document.createElement('div'); cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid #eee;border-radius:8px;padding:6px';
      const t = document.createElement('div'); t.textContent = `${i + 1}. ${f.name}`;
      cell.append(o, t); wrap.append(cell);
    });
    document.body.append(wrap);
  }, [name, ids]);
  await p.waitForTimeout(200);
  const h = await p.evaluate(() => document.getElementById('ref').scrollHeight);
  await p.setViewportSize({ width: 1400, height: Math.min(1600, h + 20) });
  await p.screenshot({ path: `/home/user/my-cozy-room/art-src/guide/basic-${name}-ref.png` });
}
await b.close(); })();
