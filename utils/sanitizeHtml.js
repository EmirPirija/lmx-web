import DOMPurify from "isomorphic-dompurify";

const SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "link",
    "meta",
    "form",
    "input",
    "button",
  ],
  FORBID_ATTR: ["style"],
};

export const sanitizeHtml = (unsafeHtml) => {
  if (unsafeHtml === null || unsafeHtml === undefined) {
    return "";
  }

  return DOMPurify.sanitize(String(unsafeHtml), SANITIZE_CONFIG);
};
