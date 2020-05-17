const oembed = require('../');

const test = require('ava');
const { transform } = require('@babel/core');
const { join } = require('path');
const puppeteer = require('puppeteer');
const mdx = require('@mdx-js/mdx');
const { readFile, writeFile } = require('mz/fs');
const prettier = require('prettier');
const virtual = require('@rollup/plugin-virtual');
const rollup = require('rollup');
const React = require('react');
const ReactDOM = require('react-dom/server');
const remark = require('remark');

const { CI = 'false' } = process.env;
const FIXTURES = join(__dirname, 'fixtures');
const OUTPUTS = join(__dirname, 'outputs');

const compileJsx = async (src, options) => {
  const config = await prettier.resolveConfig(__filename);

  const jsx = await mdx(src, {
    commonmark: true,
    gfm: true,
    remarkPlugins: [[oembed, options]],
  });

  const { code } = transform(jsx.replace(/^\/\*\s*?@jsx\s*?mdx\s\*\//, ''), {
    sourceType: 'module',
    presets: [require.resolve('@babel/preset-react')],
  });

  const bundle = await rollup.rollup({
    input: 'main.js',
    treeshake: true,
    plugins: [
      virtual({
        'main.js': "import React from 'react';\n".concat(code),
      }),
      require('rollup-plugin-babel')({
        sourceType: 'module',
        presets: [require.resolve('@babel/preset-react')],
      }),
    ],
  });

  const result = await bundle.generate({
    format: 'iife',
    name: 'Main',
    exports: 'named',
    globals: {
      react: 'React',
    },
  });

  // eslint-disable-next-line no-new-func
  const fn = new Function('React', `${result.output[0].code};\nreturn Main;`);
  const element = React.createElement(fn(React).default);

  return prettier.format(ReactDOM.renderToStaticMarkup(element), {
    ...config,
    parser: 'html',
  });
};

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

test('`jsx` > defaults > all', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'all.md'));
  const output = await compileJsx(markdown, { jsx: true });

  await writeFile(join(OUTPUTS, 'jsx-all.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'jsx-all.png'));

  t.snapshot(output);
});

test('`syncWidget` > all', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'all.md'));
  const output = await compile(markdown, { syncWidget: true });

  await writeFile(join(OUTPUTS, 'sync-widget-all.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'sync-widget-all.png'));

  t.snapshot(output);
});

test('`jsx` > `syncWidget` > all', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'all.md'));
  const output = await compileJsx(markdown, { syncWidget: true, jsx: true });

  await writeFile(join(OUTPUTS, 'jsx-sync-widget-all.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'jsx-sync-widget-all.png'));

  t.snapshot(output);
});

test('`asyncImg` > all', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'all.md'));
  const output = await compile(markdown, { asyncImg: true });

  await writeFile(join(OUTPUTS, 'async-img-all.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'async-img-all.png'));

  t.snapshot(output);
});

test('`jsx` > `asyncImg` > all', async (t) => {
  const markdown = await readFile(join(FIXTURES, 'all.md'));
  const output = await compileJsx(markdown, { asyncImg: true, jsx: true });

  await writeFile(join(OUTPUTS, 'jsx-async-img-all.html'), output);
  await takeScreenshot(output, join(OUTPUTS, 'jsx-async-img-all.png'));

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
