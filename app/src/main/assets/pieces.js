// Original vector pieces, included locally for consistent offline rendering.
const shapes = {
 k: '<path d="M30 5v12m-6-6h12" fill="none"/><path d="M21 20c-9-8-16 2-9 10l7 8h22l7-8c7-8 0-18-9-10-4-8-14-8-18 0Z"/><path d="m20 38-3 12h26l-3-12M16 50h28l3 6H13Z"/>',
 q: '<path d="m12 20 5 22h26l5-22-12 11-6-18-6 18Z"/><circle cx="10" cy="17" r="4"/><circle cx="30" cy="10" r="4"/><circle cx="50" cy="17" r="4"/><path d="M18 42h24v7H18Zm-2 8h28l3 6H13Z"/>',
 r: '<path d="M12 10h8v8h6v-8h8v8h6v-8h8v18l-7 5v16H19V33l-7-5Zm4 39h28l3 7H13Z"/><path d="M19 34h22M17 27h26" fill="none"/>',
 b: '<circle cx="30" cy="7" r="4"/><path d="M30 12C12 24 16 33 25 37l-5 12h20l-5-12c9-4 13-13-5-25Z"/><path d="m34 21-7 8" fill="none"/><path d="M16 49h28l4 7H12Z"/>',
 n: '<path d="m39 9-3 9c14 11 11 22 7 31H18c10-8 15-16 11-22l-10 9-9-5 8-14 11-6 1-6Z"/><circle cx="25" cy="21" r="1.5" fill="currentColor"/><path d="m14 49 32 0 2 7H12Z"/><path d="m17 29 4 1" fill="none"/>',
 p: '<circle cx="30" cy="17" r="9"/><path d="M23 27h14l-2 9 7 13H18l7-13Zm-7 22h28l3 7H13Z"/>'
};
export function pieceSVG(type, color) {
 const fill = color === 'w' ? '#fffdf3' : '#293d34';
 const stroke = color === 'w' ? '#52664f' : '#14291f';
 return `<svg viewBox="0 0 60 62" aria-hidden="true" style="color:${stroke}" fill="${fill}" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${shapes[type]}</svg>`;
}
