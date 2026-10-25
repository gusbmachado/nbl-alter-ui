// Paths match public/img/README.md; the supplied JPEGs are already color-treated.
const bindings: Record<string, string> = {
  brown: 'tora', wine: 'profetas', green: 'escritos', blue: 'novo-testamento-grego',
};
export function coverAsset(variant?: string, side: 'capa' | 'contracapa' = 'capa') {
  return `/img/${variant && bindings[variant] ? bindings[variant] : 'padrao'}-${side}.jpg`;
}
