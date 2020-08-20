# remark-oembed

Converts URLs surrounded by newlines into embeds that are loaded asynchronously.

_For the most part, this code is taken directly from [agentofuser/remark-oembed](https://github.com/agentofuser/remark-oembed) 🙏_

## installation

```bash
yarn add remark-oembed
```

## usage

Say we have the following markdown:

```markdown
This is a youtube video:

https://www.youtube.com/watch?v=aoLhACqJCUg

This is a photo:

https://www.flickr.com/photos/pedrocaetano/27432477888

This another photo:

http://www.23hq.com/mprove/photo/66422006

Check it out 👆
```

And our script looks as follows:

```javascript
const remark = require('remark');

remark()
  .use(require('remark-oembed'))
  .use(require('remark-html'))
  .process(src, (err, file) => console.log(String(file)));
```

Now, running it yields:

```html
<p>This is a youtube video:</p>
<div class="remark-oembed-inline" data-oembed>
  <a
    href="https://www.youtube.com/watch?v=aoLhACqJCUg"
    class="remark-oembed-anchor"
    data-oembed
    rel="noopener noreferrer nofollow"
    target="_blank"
  >
    <img
      src="https://i.ytimg.com/vi/aoLhACqJCUg/hqdefault.jpg"
      title="Há Música na Cidade 2015"
      width="480"
      height="270"
      class="remark-oembed-photo"
      data-oembed
    />
  </a>
  <template data-oembed-template>
    <iframe
      width="480"
      height="270"
      src="https://www.youtube.com/embed/aoLhACqJCUg?feature=oembed"
      frameborder="0"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </template>
</div>
<p>This is a photo:</p>
<div class="remark-oembed-inline" data-oembed>
  <a
    href="https://www.flickr.com/photos/pedrocaetano/27432477888"
    class="remark-oembed-anchor"
    data-oembed
    rel="noopener noreferrer nofollow"
    target="_blank"
  >
    <img
      src="https://live.staticflickr.com/872/27432477888_8236c59e1d_b.jpg"
      title="Leiria by night"
      width="1024"
      height="678"
      class="remark-oembed-photo"
      data-oembed
    />
  </a>
  <template data-oembed-template>
    <a
      data-flickr-embed="true"
      href="https://www.flickr.com/photos/pedrocaetano/27432477888/"
      title="Leiria by night by Pedro Nuno Caetano, on Flickr"
    >
      <img
        src="https://live.staticflickr.com/872/27432477888_8236c59e1d_b.jpg"
        width="1024"
        height="678"
        alt="Leiria by night"
      />
    </a>
    <script
      async
      src="https://embedr.flickr.com/assets/client-code.js"
      charset="utf-8"
    ></script>
  </template>
</div>
<p>This another photo:</p>
<a
  href="http://www.23hq.com/mprove/photo/66422006"
  class="remark-oembed-anchor"
  data-oembed
  rel="noopener noreferrer nofollow"
  target="_blank"
>
  <img
    src="http://www.23hq.com/9484736/66422006_0e82f5775b3b15207f50f5af5a625652_large.jpg"
    data-src="http://www.23hq.com/9484736/66422006_0e82f5775b3b15207f50f5af5a625652_large.jpg"
    title="Hamburg. Uhlenhorst. Das F&#x26;auml;hrhaus (33)"
    width="756"
    height="495"
    class="remark-oembed-photo"
    data-oembed
  />
</a>
<p>Check it out 👆</p>
<script async defer>
  // ...
  document.querySelectorAll('div[data-oembed]').forEach((el) => {
    const template = el
      .querySelector('[data-oembed-template]')
      .content.cloneNode(true);
    el.innerHTML = '';
    el.attachShadow({ mode: 'closed' }).appendChild(template);
  });

  document.querySelectorAll('img[data-oembed][data-src]').forEach((img) => {
    img.setAttribute('src', img.getAttribute('data-src'));
    img.removeAttribute('data-src');
  });

  document.querySelectorAll('[data-oembed]').forEach((el) => {
    el.removeAttribute('data-oembed');
  });
  //...
</script>
```

> Take a look at [how it would look](test/outputs/defaults-all.png) before executing the script, and the unchanged [HTML output](test/outputs/defaults-all.html).

### `syncWidget`

If you don't want to load the widget asynchronously and just default to how it would work in any other plugin, you can use `syncWidget`.

```javascript
remark()
  .use(require('remark-oembed'), { syncWidget: true })
  .use(require('remark-html'))
  .process(src, (err, file) => console.log(String(file)));
```

```html
<div class="remark-oembed-inline" data-oembed>
  <iframe
    width="480"
    height="270"
    src="https://www.youtube.com/embed/aoLhACqJCUg?feature=oembed"
    frameborder="0"
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>
```

As you can see above, it doesn't generate a preview `<img />` neither a `<a />` to the source. Also, it doesn't try to replace the `<img />` and the `<a />` with the `<iframe />`.

> Take a look at [how it would look](test/outputs/sync-widget-all.png) before executing the script, and the unchanged [HTML output](test/outputs/sync-widget-all.html).

### `asyncImg`

Not only with `thumbnails`, but also with `oembed`'s `type === 'photo'`, you can make pictures also load asyncronously by setting `asyncImg`. This is accomplishing by generating an empty `base64` src with the same size as the original image:

```javascript
remark()
  .use(require('remark-oembed'), { asyncImg: true })
  .use(require('remark-html'))
  .process(src, (err, file) => console.log(String(file)));
```

```html
<p>This is a youtube video:</p>
<div class="remark-oembed-inline" data-oembed>
  <a
    href="https://www.youtube.com/watch?v=aoLhACqJCUg"
    class="remark-oembed-anchor"
    data-oembed
    rel="noopener noreferrer nofollow"
    target="_blank"
  >
    <img
      src="data:image/png;base64,iVBOR...QmCC"
      title="Há Música na Cidade 2015"
      width="480"
      height="270"
      class="remark-oembed-photo"
      data-oembed
    />
  </a>
  <template data-oembed-template>
    <iframe
      width="480"
      height="270"
      src="https://www.youtube.com/embed/aoLhACqJCUg?feature=oembed"
      frameborder="0"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </template>
</div>
<p>This is a photo:</p>
<div class="remark-oembed-inline" data-oembed>
  <a
    href="https://www.flickr.com/photos/pedrocaetano/27432477888"
    class="remark-oembed-anchor"
    data-oembed
    rel="noopener noreferrer nofollow"
    target="_blank"
  >
    <img
      src="data:image/png;base64,iVBOR...QmCC"
      title="Leiria by night"
      width="1024"
      height="678"
      class="remark-oembed-photo"
      data-oembed
    />
  </a>
  <template data-oembed-template>
    <a
      data-flickr-embed="true"
      href="https://www.flickr.com/photos/pedrocaetano/27432477888/"
      title="Leiria by night by Pedro Nuno Caetano, on Flickr"
    >
      <img
        src="https://live.staticflickr.com/872/27432477888_8236c59e1d_b.jpg"
        width="1024"
        height="678"
        alt="Leiria by night"
      />
    </a>
    <script
      async
      src="https://embedr.flickr.com/assets/client-code.js"
      charset="utf-8"
    ></script>
  </template>
</div>
<p>This another photo:</p>
<a
  href="http://www.23hq.com/mprove/photo/66422006"
  class="remark-oembed-anchor"
  data-oembed
  rel="noopener noreferrer nofollow"
  target="_blank"
>
  <img
    src="data:image/png;base64,iVBOR...QmCC"
    data-src="http://www.23hq.com/9484736/66422006_0e82f5775b3b15207f50f5af5a625652_large.jpg"
    title="Hamburg. Uhlenhorst. Das F&#x26;auml;hrhaus (33)"
    width="756"
    height="495"
    class="remark-oembed-photo"
    data-oembed
  />
</a>
<p>Check it out 👆</p>
<script async defer>
  // ...
  document.querySelectorAll('div[data-oembed]').forEach((el) => {
    const template = el
      .querySelector('[data-oembed-template]')
      .content.cloneNode(true);
    el.innerHTML = '';
    el.attachShadow({ mode: 'closed' }).appendChild(template);
  });

  document.querySelectorAll('img[data-oembed][data-src]').forEach((img) => {
    img.setAttribute('src', img.getAttribute('data-src'));
    img.removeAttribute('data-src');
  });

  document.querySelectorAll('[data-oembed]').forEach((el) => {
    el.removeAttribute('data-oembed');
  });
  // ...
</script>
```

> Take a look at [how it would look](test/outputs/async-img-all.png) before executing the script, and the unchanged [HTML output](test/outputs/async-img-all.html).

### `jsx`

To use with [@mdx-js/mdx](https://mdxjs.com/advanced/api), set `jsx` as true.

```javascript
const mdx = require('@mdx-js/mdx');

await mdx(src, {
  remarkPlugins: [[require('remark-oembed'), { jsx: true }],
});
```

## license

BSD-3-Clause
