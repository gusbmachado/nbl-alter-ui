export interface Collection {
  id: string; title: string; summary: string; order: number;
  coverVariant: string; enabled: boolean;
}
export interface Book {
  slug: string; title: string; originalTitle?: string; collectionId: string;
  order: number; canonTags: string[]; totalChapters: number | null;
  publicationState: 'planned' | 'in_progress' | 'complete';
  summary: string; preface?: string; translatorAttribution?: string;
  coverVariant?: string; enabled: boolean;
}
export interface Verse { number: number; text: string; style: 'prose' | 'poetry' }
export interface Note {
  id: string; book: string; chapter: number; status: 'draft' | 'published';
  scope: 'verse' | 'range' | 'chapter'; verseStart?: number; verseEnd?: number;
  category: string; title?: string; order: number; body: string;
}
export interface Chapter {
  id: string; book: string; chapter: number; title?: string;
  status: 'draft' | 'published'; publishedAt?: string; verses: Verse[];
  contentKind?: 'sample' | 'demonstration'; sourceLabel?: string;
}
export interface PublicChapter extends Chapter { notes: Note[] }
export interface ChapterInfo { chapter: number; title?: string; publishedAt?: string; contentKind?: Chapter['contentKind']; sourceLabel?: string }
export interface CatalogBook extends Book { chapters: ChapterInfo[] }
export interface Site {
  title: string; newsletterUrl: string;
  noteCategories: { id: string; label: string }[];
}
export interface Catalog { collections: Collection[]; books: CatalogBook[]; site: Site }
export interface Position { bookSlug: string; chapter: number; verse: number; offset: number }
