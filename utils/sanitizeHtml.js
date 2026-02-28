import DOMPurify from "isomorphic-dompurify";

const DEFAULT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "a",
  "span",
];

const DEFAULT_ALLOWED_ATTR = ["href", "target", "rel", "class"];

export const sanitizeHtml = (unsafeHtml, options = {}) => {
  if (unsafeHtml === null || unsafeHtml === undefined) {
    return "";
  }

  return DOMPurify.sanitize(String(unsafeHtml), {
    ALLOWED_TAGS: options.allowedTags || DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: options.allowedAttributes || DEFAULT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: [/^on/i, "srcset"],
    ...options,
  });
};
