const BlurHash = require('blurhash');
const { createCanvas, loadImage } = require('canvas');
const Got = require('got');
const { getType } = require('mime');
const { generate: shortid } = require('shortid');
const { selectAll } = require('unist-util-select');
const { format, parse } = require('url');
const vhtml = require('vhtml');
const htm = require('htm');

const html = htm.bind(vhtml);

const { OEMBED_TEST_ID } = process.env;
const OEMBED_PROVIDERS_URL = 'https://oembed.com/providers.json';

const RequestAnimationFrame = ({ script }) => {
  const __html = `
    const isDocumentReady = () => {
      if (document.readyState !== 'complete') {
        document.addEventListener('readystatechange', isDocumentReady);
        return false;
      }

      requestAnimationFrame(() => {
        ${script};
      });

      return true;
    };

    if (!isDocumentReady()) {
      document.addEventListener('readystatechange', isDocumentReady);
    }
  `;

  return html`<script async defer dangerouslySetInnerHTML=${{ __html }} />`;
};

const Img = ({ id, url, title, dataSrc }) => {
  return html`<img
    id="${id}"
    src="${url}"
    class="remark-oembed-photo"
    title="${title}"
    data-src="${dataSrc}"
  />`;
};

const Anchor = ({ children, ...props }) => {
  const {
    rel = 'noopener noreferrer nofollow',
    target = '_blank',
    ...rest
  } = props;

  return html`<a ...${rest} rel="${rel}" target="${target}">${children}</a>`;
};

const StaticPhotoOembed = ({ hashUrl, emptyUrl, url, href, ...rest }) => {
  const id = OEMBED_TEST_ID || shortid();
  const src = hashUrl || emptyUrl || url;
  const isImage = /^image\//.test(getType(href) || '');

  const img = html`<${Img}
    ...${rest}
    id="${id}"
    url="${src}"
    dataSrc="${url}"
  />`;

  const anchor = isImage ? img : html`<${Anchor} href="${href}">${img}</$a>`;

  if (!hashUrl && !emptyUrl) {
    return anchor;
  }

  const script = `
    const img = document.getElementById('${id}');
    img.setAttribute('src', img.getAttribute('data-src'));
  `;

  return html`<>
    ${anchor}
    <${RequestAnimationFrame} script="${script}" />
  </>`;
};

const resolvePreview = ({ isImage, thumbnail, url, hashUrl, emptyUrl }) => {
  if (isImage) {
    return hashUrl || emptyUrl || url;
  }

  if (thumbnail.isImage) {
    const { url, hashUrl, emptyUrl } = thumbnail;
    return hashUrl || emptyUrl || url;
  }

  return '';
};

const Oembed = ({ type, source: __html, ...rest }) => {
  if (type === 'photo' && !__html) {
    return html`<${StaticPhotoOembed} ...${rest} />`;
  }

  const id = OEMBED_TEST_ID || shortid();
  const imgSrc = resolvePreview(rest);
  const img = imgSrc ? html`<${Img} ...${rest} url="${imgSrc}" />` : '';
  const anchor = img ? html`<${Anchor} href="${rest.href}">${img}</$a>` : img;

  const script = `
    const widget = document.getElementById('${id}-template').content.cloneNode(true);
    const shadow = document.getElementById('${id}').attachShadow({ mode: 'closed' });
    shadow.appendChild(widget);
  `;

  return html`<>
    <div id="${id}" class="remark-oembed-inline">${anchor}</div>
    <template id="${id}-template" dangerouslySetInnerHTML=${{ __html }} />
    <${RequestAnimationFrame} script="${script}" />
  </>`;
};

const getEmptyBase64 = ({ width, height } = {}) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.putImageData(ctx.createImageData(width, height), 0, 0);

  return canvas.toDataURL();
};

const getBlurHashSrc = async ({ url: src, width, height } = {}) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const drawImage = async () => {
    const body = await Got(src, {
      responseType: 'buffer',
      resolveBodyOnly: true,
    });

    const image = await loadImage(body);
    ctx.drawImage(image, 0, 0, width, height);
  };

  const encode = () => {
    const { data } = ctx.getImageData(0, 0, width, height);
    return BlurHash.decode(
      BlurHash.encode(data, width, height, 4, 3),
      width,
      height,
    );
  };

  const toBase64 = (pixels) => {
    const px = ctx.createImageData(width, height);

    px.data.set(pixels);
    ctx.putImageData(px, 0, 0);

    return canvas.toDataURL();
  };

  return toBase64(encode(await drawImage()));
};

const transformImage = async (ctx = {}) => {
  const { url, width, height, useBlurHash = false, asyncImg = false } = ctx;

  const isImage = /^image\//.test(getType(url) || '');
  if (!isImage) {
    return {};
  }

  const oembed = { url, width, height };

  return {
    isImage: true,
    hashUrl: useBlurHash ? await getBlurHashSrc(oembed) : '',
    emptyUrl: asyncImg ? await getEmptyBase64(oembed) : '',
    url,
  };
};

const transformNode = async (node, oembed = {}) => {
  const { source, url, syncWidget = false } = oembed;
  const isImage = /^image\//.test(getType(url) || '');

  if (!isImage && !source) {
    return node;
  }

  delete node.children;

  if (syncWidget && source) {
    node.type = 'html';
    node.value = `<div class="remark-oembed-inline">${source}</div>`;
    return node;
  }

  node.type = 'html';
  node.value = Oembed({
    ...oembed,
    ...(await transformImage(oembed)),
    thumbnail: await transformImage({
      ...oembed,
      url: oembed.thumbnail_url,
      height: oembed.height || oembed.thumbnail_height,
      width: oembed.width || oembed.thumbnail_width,
    }),
  });

  return node;
};

const fetchOembed = async (endpoint) => {
  const href = format(
    Object.assign(parse(endpoint.url), {
      query: {
        format: 'json',
        ...endpoint.query,
      },
    }),
  );

  return Got(href, {
    responseType: 'json',
    resolveBodyOnly: true,
  });
};

const getProviderEndpoint = (linkUrl, providers = []) => {
  for (const provider of providers || []) {
    for (const endpoint of provider.endpoints || []) {
      for (let schema of endpoint.schemes || []) {
        schema = schema.replace('*', '.*');
        const regExp = new RegExp(schema);
        if (regExp.test(linkUrl)) {
          return {
            url: endpoint.url,
            query: {
              url: linkUrl,
              ...endpoint.params,
            },
          };
        }
      }
    }
  }

  return {};
};

const processNode = async (node, { providers = [], ...options }) => {
  const endpoint = getProviderEndpoint(node.url, providers);
  const { html, ...rest } = endpoint.url ? await fetchOembed(endpoint) : {};
  const oembed = { href: node.url, ...rest, ...options, source: html };
  return endpoint.url ? transformNode(node, oembed) : node;
};

const fetchOembedProviders = async () => {
  return Got(OEMBED_PROVIDERS_URL, {
    responseType: 'json',
    resolveBodyOnly: true,
  });
};

module.exports = (opts = {}) => {
  return async (tree) => {
    const providers = await fetchOembedProviders();
    const nodes = selectAll('paragraph link:only-child', tree);

    await Promise.all(
      (Array.isArray(nodes) ? nodes : []).map((node) => {
        try {
          return processNode(node, { ...opts, providers });
        } catch (error) {
          error.url = node.url;
          throw error;
        }
      }),
    );

    return tree;
  };
};
