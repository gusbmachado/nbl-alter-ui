import { coverAsset } from '../lib/covers';

interface Props {
  title: string;
  variant?: string;
  kind?: 'institutional' | 'volume';
  subtitle?: string;
}

/** Supplied artwork stays intact; the separate HTML plaque identifies the volume. */
export default function BookCover({ title, variant, kind = 'volume', subtitle }: Props) {
  const palette = variant && ['brown', 'wine', 'green', 'blue'].includes(variant) ? variant : 'default';
  return <span className={`binding binding-${palette} binding-${kind}`} role="img"
    aria-label={`${kind === 'institutional' ? 'Capa institucional' : 'Capa do tomo'}: ${title}`}>
    <img className="binding-art" src={coverAsset(variant)} width="650" height="927" alt="" decoding="async" />
    <span className="binding-lettering">
      <span className="binding-kicker">{kind === 'institutional' ? 'COLEÇÃO' : 'TOMO'}</span>
      <span className={`binding-title${title.length > 20 ? ' binding-title-long' : ''}`}>{title}</span>
      {subtitle && <span className="binding-subtitle">{subtitle}</span>}
    </span>
  </span>;
}
