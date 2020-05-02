const oembed = require('../');

const { join } = require('path');
const puppeteer = require('puppeteer');
const { readFile, writeFile } = require('mz/fs');
const prettier = require('prettier');
const remark = require('remark');
const test = require('ava');

const { CI = 'false' } = process.env;
const FIXTURES = join(__dirname, 'fixtures');
const OUTPUTS = join(__dirname, 'outputs');

const compile = async (src, options) => {
  const config = await prettier.resolveConfig(__filename);

  const handleResult = (resolve, reject) => {
    return (err, file) => {
      return err
        ? reject(err)
        : resolve(prettier.format(String(file), { ...config, parser: 'html' }));
    };
  };

  return new Promise((resolve, reject) => {
    return remark()
      .use(oembed, options)
      .use(require('remark-html'))
      .process(src, handleResult(resolve, reject));
  });
};

const takeScreenshot = async (html, path) => {
  if (JSON.parse(CI)) {
    return;
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setJavaScriptEnabled(false);
  await page.setContent(html, { waitUntil: 'networkidle2' });
  await page.screenshot({ path, fullPage: true });

  await browser.close();
};

test('defaults > providers', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'providers.md'));
  const output = await compile(markdown);

  await writeFile(join(OUTPUTS, 'defaults-providers.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'defaults-providers.png'));

  t.snapshot(output);
});

test('`syncWidget` > providers', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'providers.md'));
  const output = await compile(markdown, { syncWidget: true });

  await writeFile(join(OUTPUTS, 'sync-widget-providers.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'sync-widget-providers.png'));

  t.snapshot(output);
});

test('`asyncImg` > providers', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'providers.md'));
  const output = await compile(markdown, { asyncImg: true });

  await writeFile(join(OUTPUTS, 'async-img-providers.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'async-img-providers.png'));

  t.snapshot(output);
});

test('defaults > all', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'all.md'));
  const output = await compile(markdown);

  await writeFile(join(OUTPUTS, 'defaults-all.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'defaults-all.png'));

  t.snapshot(output);
});

test('`syncWidget` > all', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'all.md'));
  const output = await compile(markdown, { syncWidget: true });

  await writeFile(join(OUTPUTS, 'sync-widget-all.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'sync-widget-all.png'));

  t.snapshot(output);
});

test('`asyncImg` > all', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'all.md'));
  const output = await compile(markdown, { asyncImg: true });

  await writeFile(join(OUTPUTS, 'async-img-all.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'async-img-all.png'));

  t.snapshot(output);
});

test('defaults > html oembed', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'rich-oembed.md'));
  const output = await compile(markdown);

  await writeFile(join(OUTPUTS, 'defaults-rich-oembed.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'defaults-rich-oembed.png'));

  t.snapshot(output);
});

test('`syncWidget` > html oembed', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'rich-oembed.md'));
  const output = await compile(markdown, { syncWidget: true });

  await writeFile(join(OUTPUTS, 'sync-widget-rich-oembed.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'sync-widget-rich-oembed.png'));

  t.snapshot(output);
});

test('`asyncImg` > html oembed', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'rich-oembed.md'));
  const output = await compile(markdown, { asyncImg: true });

  await writeFile(join(OUTPUTS, 'async-img-rich-oembed.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'async-img-rich-oembed.png'));

  t.snapshot(output);
});

test('defaults > photo rich oembed', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'photo-oembed.md'));
  const output = await compile(markdown);

  await writeFile(join(OUTPUTS, 'defaults-photo-oembed.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'defaults-photo-oembed.png'));

  t.snapshot(output);
});

test('`syncWidget` > photo rich oembed', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'photo-oembed.md'));
  const output = await compile(markdown, { syncWidget: true });

  await writeFile(join(OUTPUTS, 'sync-widget-photo-oembed.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'sync-widget-photo-oembed.png'));

  t.snapshot(output);
});

test('`asyncImg` > photo rich oembed', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'photo-oembed.md'));
  const output = await compile(markdown, { asyncImg: true });

  await writeFile(join(OUTPUTS, 'async-img-photo-oembed.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'async-img-photo-oembed.png'));

  t.snapshot(output);
});

test('defaults > photo flat oembed', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'flat-oembed.md'));
  const output = await compile(markdown);

  await writeFile(join(OUTPUTS, 'defaults-flat-oembed.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'defaults-flat-oembed.png'));

  t.snapshot(output);
});

test('`syncWidget` > photo flat oembed', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'flat-oembed.md'));
  const output = await compile(markdown, { syncWidget: true });

  await writeFile(join(OUTPUTS, 'sync-widget-flat-oembed.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'sync-widget-flat-oembed.png'));

  t.snapshot(output);
});

test('`asyncImg` > photo flat oembed', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'flat-oembed.md'));
  const output = await compile(markdown, { asyncImg: true });

  await writeFile(join(OUTPUTS, 'async-img-flat-oembed.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'async-img-flat-oembed.png'));

  t.snapshot(output);
});
