// El límite de caracteres no evita que alguien escriba una letra por renglón
// para armar un texto artificialmente larguísimo (ej. 500 saltos de línea).
// Esto limita la cantidad de saltos de línea, no los caracteres.
export function capLineBreaks(text, maxLineBreaks) {
  const lines = text.split('\n');
  if (lines.length - 1 <= maxLineBreaks) return text;
  return lines.slice(0, maxLineBreaks + 1).join('\n');
}
