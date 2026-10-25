import { coverAsset } from '../lib/covers';

export default function BackCover({ variant }: { variant?: string }) {
  return <>
    <img src={coverAsset(variant, 'contracapa')} alt="Contracapa da coleção; inscrição transcrita abaixo." width="630" height="927" />
    <details className="cover-transcription">
      <summary>Ler a inscrição da contracapa</summary>
      <p className="caption">Transcrição da arte fornecida. A atribuição abaixo consta na imagem.</p>
      <blockquote>
        <p>“Tenho a ideia de que sempre se pode.<br />traduzir um poeta, inglês, latino ou grego,<br />
          exactamente palavra por palavra, sem acrescentar<br />nada, e conservando inclusive a ordem, até<br />
          encontrar o metro e mesmo a rima (...)</p>
        <p>É necessário tempo, digo, meses, e uma rara<br />paciência. Chega-se inicialmente a uma espécie<br />
          de mosaico bárbaro; os fragmentos estão mal<br />juntados; o cimento os liga, mas não os harmoniza.<br />
          Resta a força, o brilho, até mesmo uma violência.”</p>
        <p>— Alain (Émile Chartier) —</p>
      </blockquote>
      <p>Uma Bíblia Livre, livre de mercado, livre de doutrina,<br />
        livre de teologia, livre de ideologia, livre de tradição,<br />
        livre de religião, livre de instituição.<br />
        Uma Bíblia livre.<br />Uma Bíblia verdadeiramente livre.<br />
        Só a Bíblia, nada mais do que a Bíblia.<br />Nossa Bíblia Livre.</p>
    </details>
  </>;
}
