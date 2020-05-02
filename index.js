const Got = require('got');
const h = require('hastscript');
const Intercept = require('apr-intercept');
const { getType } = require('mime');
const toHtml = require('hast-util-to-html');
const { selectAll, matches } = require('hast-util-select');
const { format, parse } = require('url');

const OEMBED_PROVIDERS_URL = 'https://oembed.com/providers.json';
const EMPTY_CANVAS =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAEYklEQVR4Xu3UAQkAAAwCwdm/9HI83BLIOdw5AgQIRAQWySkmAQIEzmB5AgIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlAABg+UHCBDICBisTFWCEiBgsPwAAQIZAYOVqUpQAgQMlh8gQCAjYLAyVQlKgIDB8gMECGQEDFamKkEJEDBYfoAAgYyAwcpUJSgBAgbLDxAgkBEwWJmqBCVAwGD5AQIEMgIGK1OVoAQIGCw/QIBARsBgZaoSlACBB1YxAJfjJb2jAAAAAElFTkSuQmCC';

const ATTRS = {
  template: {
    'data-oembed-template': true,
  },
  inline: {
    class: 'remark-oembed-inline',
    'data-oembed': true,
  },
  image: {
    class: 'remark-oembed-photo',
    'data-oembed': true,
  },
  anchor: {
    class: 'remark-oembed-anchor',
    'data-oembed': true,
  },
};

const Script = () => {
  return `
    document.querySelectorAll('div[data-oembed]').forEach((el) => {
      const template = el.querySelector('[data-oembed-template]').content.cloneNode(true);
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
  `;
};

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

  return h('script', { async: true, defer: true }, [__html]);
};

const Img = ({ id, url, title, width, height, dataSrc }) => {
  return h('img', {
    id,
    src: url,
    'data-src': dataSrc,
    title,
    width,
    height,
    ...ATTRS.image,
  });
};

const Anchor = (props, children = []) => {
  const {
    rel = 'noopener noreferrer nofollow',
    target = '_blank',
    ...rest
  } = props;

  return h(
    'a',
    Object.assign(rest, ATTRS.anchor, { rel, target }),
    children.filter(Boolean),
  );
};

const StaticPhotoOembed = ({ emptyUrl, url, href, ...rest }) => {
  const src = emptyUrl || url;
  const isImage = /^image\//.test(getType(href) || '');

  const img = Img({ ...rest, url: src, dataSrc: url });
  const anchor = isImage ? img : Anchor({ href }, [img]);

  if (!emptyUrl) {
    return anchor;
  }

  return anchor;
};

const resolvePreview = ({ isImage, thumbnail, url, emptyUrl }) => {
  if (isImage) {
    return emptyUrl || url;
  }

  if (thumbnail.isImage) {
    const { url, emptyUrl } = thumbnail;
    return emptyUrl || url;
  }

  return '';
};

const Oembed = ({ type, source, ...rest }) => {
  if (type === 'photo' && !source) {
    return StaticPhotoOembed(rest);
  }

  const imgSrc = resolvePreview(rest);
  const img = imgSrc ? Img({ ...rest, url: imgSrc }) : '';
  const anchor = img ? Anchor({ href: rest.href }, [img]) : img;

  return h(
    'div',
    ATTRS.inline,
    [anchor, h('template', ATTRS.template, [source])].filter(Boolean),
  );
};

const transformImage = async (ctx = {}) => {
  const { url, width, height, asyncImg = false } = ctx;

  const isImage = /^image\//.test(getType(url) || '');
  if (!isImage) {
    return {};
  }

  return {
    isImage: true,
    width,
    height,
    emptyUrl: asyncImg ? EMPTY_CANVAS : '',
    url,
  };
};

const processOembed = async (oembed) => {
  const { source, url, syncWidget = false } = oembed;
  const isImage = /^image\//.test(getType(url) || '');

  if (!isImage && !source) {
    return;
  }

  if (syncWidget && source) {
    return h('div', ATTRS.inline, [source]);
  }

  return Oembed({
    ...oembed,
    ...(await transformImage(oembed)),
    thumbnail: await transformImage({
      ...oembed,
      url: oembed.thumbnail_url,
      height: oembed.height || oembed.thumbnail_height,
      width: oembed.width || oembed.thumbnail_width,
    }),
  });
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
};

const processNode = async (node, { providers = [], ...options }) => {
  const child = node.children.slice(0, 1)[0];
  if (!child || !child.url) {
    return node;
  }

  const endpoint = getProviderEndpoint(child.url, providers);
  if (!endpoint) {
    return node;
  }

  const { html, ...rest } = await fetchOembed(endpoint);
  const source = html ? { type: 'raw', value: html } : undefined;
  const oembed = { href: child.url, ...rest, ...options, source };
  const newNode = await processOembed(oembed);
  return newNode ? newNode : node;
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

    const ctx = {
      ...opts,
      providers,
    };

    // https://github.com/syntax-tree/unist-util-map/blob/bb0567f651517b2d521af711d7376475b3d8446a/index.js
    const map = async (tree, iteratee) => {
      const bound = (node) => async (child, index) => {
        return preorder(child, index, node);
      };

      const preorder = async (node, index, parent) => {
        const [, newNode = {}] = await Intercept(iteratee(node, index, parent));
        const { children = [] } = newNode || node;

        return {
          ...node,
          ...newNode,
          children: await Promise.all(children.map(bound(node))),
        };
      };

      return preorder(tree, null, null);
    };

    const newTree = await map(tree, async (node) => {
      const isParagraph = node.type === 'paragraph';
      const hasChildren = Array.isArray(node.children);

      if (!isParagraph || !hasChildren) {
        return node;
      }

      const onlyChild = node.children.length === 1;
      const hasLinkChild = node.children.every(({ type }) => type === 'link');

      if (!onlyChild || !hasLinkChild) {
        return node;
      }

      return processNode(node, ctx);
    });

    const hasOembed = Boolean(selectAll('[data-oembed]', newTree).length);
    if (!hasOembed) {
      return newTree;
    }

    const newSerializedTree = await map(newTree, async (node) => {
      if (!matches('[data-oembed]', node)) {
        return node;
      }

      return {
        type: 'html',
        value: toHtml(node, {
          allowDangerousHtml: true,
        }),
      };
    });

    if (ctx.syncWidget || !hasOembed) {
      return newSerializedTree;
    }

    const { children = [] } = newSerializedTree;
    return Object.assign(newSerializedTree, {
      children: children.concat([
        {
          type: 'html',
          value: toHtml(RequestAnimationFrame({ script: Script() }), {
            allowDangerousHtml: true,
          }),
        },
      ]),
    });
  };
};
