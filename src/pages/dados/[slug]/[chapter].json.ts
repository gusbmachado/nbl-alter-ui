import type { APIRoute, GetStaticPaths } from 'astro';
import { compile } from '../../../lib/content';
import type { PublicChapter } from '../../../lib/types';

// The same route serves development and emits static JSON during production builds.
export const getStaticPaths: GetStaticPaths = () => compile().chapters.map(chapter => ({
  params: { slug: chapter.book, chapter: String(chapter.chapter) },
  props: { chapter },
}));
export const GET: APIRoute = ({ props }) => new Response(JSON.stringify(props.chapter as PublicChapter), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});
