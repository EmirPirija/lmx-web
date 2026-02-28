const SCRIPT_TAG_RE = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const STYLE_TAG_RE = /<style[\s\S]*?>[\s\S]*?<\/style>/gi;
const IFRAME_TAG_RE = /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi;
const OBJECT_TAG_RE = /<object[\s\S]*?>[\s\S]*?<\/object>/gi;
const EMBED_TAG_RE = /<embed[\s\S]*?>[\s\S]*?<\/embed>/gi;
const INLINE_HANDLER_DQ_RE = /\son[a-z]+\s*=\s*"[^"]*"/gi;
const INLINE_HANDLER_SQ_RE = /\son[a-z]+\s*=\s*'[^']*'/gi;
const INLINE_HANDLER_RAW_RE = /\son[a-z]+\s*=\s*[^\s>]+/gi;
const JAVASCRIPT_PROTOCOL_RE = /(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi;
const SRCSET_RE = /\ssrcset\s*=\s*(['"])[\s\S]*?\1/gi;

export const sanitizeHtml = (unsafeHtml) => {
  if (unsafeHtml === null || unsafeHtml === undefined) {
    return "";
  }

  return String(unsafeHtml)
    .replace(SCRIPT_TAG_RE, "")
    .replace(STYLE_TAG_RE, "")
    .replace(IFRAME_TAG_RE, "")
    .replace(OBJECT_TAG_RE, "")
    .replace(EMBED_TAG_RE, "")
    .replace(INLINE_HANDLER_DQ_RE, "")
    .replace(INLINE_HANDLER_SQ_RE, "")
    .replace(INLINE_HANDLER_RAW_RE, "")
    .replace(JAVASCRIPT_PROTOCOL_RE, "")
    .replace(SRCSET_RE, "");
};
