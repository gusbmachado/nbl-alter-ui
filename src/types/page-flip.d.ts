/** Public subset used from StPageFlip 2.0.7 (package ships no declarations). */
declare module 'page-flip' {
  interface Settings {
    width: number; height: number; size: 'fixed' | 'stretch'; showCover: boolean;
    usePortrait: boolean; autoSize: boolean; maxShadowOpacity: number; drawShadow: boolean;
    flippingTime: number; mobileScrollSupport: boolean; clickEventForward: boolean;
    disableFlipByClick: boolean; showPageCorners: boolean; useMouseEvents: boolean; startPage: number;
  }
  export class PageFlip {
    constructor(element: HTMLElement, settings: Settings);
    loadFromHTML(elements: HTMLElement[]): void;
    destroy(): void;
    getState(): string;
    getOrientation(): 'portrait' | 'landscape';
    getCurrentPageIndex(): number;
    turnToPage(index: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    flipNext(): void;
    flipPrev(): void;
    on(event: 'flip', callback: (event: { data: number }) => void): this;
    on(event: 'changeState', callback: (event: { data: string }) => void): this;
    on(event: 'init', callback: () => void): this;
  }
}
