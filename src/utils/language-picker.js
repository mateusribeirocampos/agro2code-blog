export function translatePathForLanguage(path, code) {
  if (code === 'pt') {
    return path.startsWith('/pt') ? path : `/pt${path === '/' ? '' : path}`;
  }

  return path.startsWith('/pt') ? path.replace(/^\/pt/, '') || '/' : path;
}

function hasBasePrefix(path, base) {
  return Boolean(base) && (path === base || path.startsWith(`${base}/`));
}

export function buildLanguagePickerHref({ base, currentPath, code, translatedPath, translatePath = translatePathForLanguage }) {
  const resolvedPath = translatedPath || translatePath(currentPath, code);

  if (hasBasePrefix(resolvedPath, base)) {
    return resolvedPath;
  }

  return `${base}${resolvedPath}`;
}
