/** PROTOTIPO: disegni provvisori delle Mascotte, copiati dalla pagina della direzione Veglia. */
export type Species = 'gatto' | 'cane' | 'coniglio'
export type Pose = 'seduto' | 'affacciato'
export type MascotState = 'sveglio' | 'dorme' | 'cerca'

const EYE = '#1F2547'
const HL = '#FFFFFF'

const COAT: Record<Species, { fur: string, dark: string, light: string, inner: string, nose: string, peekDy: number }> = {
  gatto: { fur: '#EFA56E', dark: '#C97A43', light: '#F8E6CB', inner: '#E79C9E', nose: '#DC7C84', peekDy: 50 },
  cane: { fur: '#A8714A', dark: '#6B4329', light: '#F6E8D2', inner: '#6B4329', nose: '#2A2230', peekDy: 55 },
  coniglio: { fur: '#B6BDCB', dark: '#8C95A8', light: '#F4F1EC', inner: '#E79C9E', nose: '#DC7C84', peekDy: 48 },
}

function almond(cx: number, cy: number, state: MascotState): string {
  if (state === 'dorme')
    return `<path d="M${cx - 4} ${cy} q4 3 8 0" fill="none" stroke="${EYE}" stroke-width="1.7" stroke-linecap="round"/>`
  return `<path d="M${cx - 4} ${cy} q4 -3.8 8 0 q-4 3.8 -8 0Z" fill="${EYE}"/><circle cx="${cx + 1.3}" cy="${cy - 0.9}" r=".85" fill="${HL}"/>`
}

function round(cx: number, cy: number, r: number, state: MascotState): string {
  if (state === 'dorme')
    return `<path d="M${cx - r} ${cy} q${r} ${r * 0.9} ${2 * r} 0" fill="none" stroke="${EYE}" stroke-width="1.7" stroke-linecap="round"/>`
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${EYE}"/><circle cx="${cx + r * 0.35}" cy="${cy - r * 0.35}" r="${r * 0.32}" fill="${HL}"/>`
}

function eyes(pair: string[], state: MascotState): string {
  const s = pair.join('')
  return state === 'cerca' ? `<g class="look">${s}</g>` : s
}

function head(sp: Species, d: number, state: MascotState): string {
  const c = COAT[sp]
  if (sp === 'gatto') {
    return `<path d="M45 ${32 + d} L46 ${13 + d} L58 ${26 + d} Z" fill="${c.fur}"/><path d="M47.6 ${29 + d} L48.2 ${18.5 + d} L55 ${26.5 + d} Z" fill="${c.inner}"/>`
      + `<path d="M75 ${32 + d} L74 ${13 + d} L62 ${26 + d} Z" fill="${c.fur}"/><path d="M72.4 ${29 + d} L71.8 ${18.5 + d} L65 ${26.5 + d} Z" fill="${c.inner}"/>`
      + `<path d="M43 ${40 + d} Q43 ${25 + d} 60 ${25 + d} Q77 ${25 + d} 77 ${40 + d} Q77 ${54 + d} 60 ${55 + d} Q43 ${54 + d} 43 ${40 + d} Z" fill="${c.fur}"/>`
      + `<path d="M56 ${27 + d} l1 5 M60 ${26.5 + d} v6 M64 ${27 + d} l-1 5" stroke="${c.dark}" stroke-width="1.8" stroke-linecap="round"/>`
      + `<ellipse cx="60" cy="${48.5 + d}" rx="7.5" ry="5" fill="${c.light}"/>${
        eyes([almond(53, 40 + d, state), almond(67, 40 + d, state)], state)
      }<path d="M57.6 ${45.5 + d} h4.8 l-2.4 2.6 Z" fill="${c.nose}"/>`
      + `<path d="M60 ${48.1 + d} v1.6 M60 ${49.7 + d} q-2 2 -4 .6 M60 ${49.7 + d} q2 2 4 .6" fill="none" stroke="${EYE}" stroke-width=".9" stroke-linecap="round"/>`
      + `<path d="M51 ${48 + d} L39 ${46 + d} M51 ${50 + d} L40 ${52 + d} M69 ${48 + d} L81 ${46 + d} M69 ${50 + d} L80 ${52 + d}" stroke="${EYE}" stroke-width=".7" opacity=".45"/>`
  }
  if (sp === 'cane') {
    return `<ellipse cx="60" cy="${36 + d}" rx="16" ry="15" fill="${c.fur}"/>`
      + `<path d="M57.5 ${22 + d} h5 l2.5 20 h-10 Z" fill="${c.light}"/>`
      + `<ellipse cx="60" cy="${47 + d}" rx="9.5" ry="8" fill="${c.light}"/>`
      + `<ellipse cx="60" cy="${44 + d}" rx="4.4" ry="3.1" fill="${c.nose}"/>`
      + `<path d="M60 ${47 + d} v2.2 M60 ${49.2 + d} q-3 3 -6 .5 M60 ${49.2 + d} q3 3 6 .5" fill="none" stroke="${EYE}" stroke-width="1" stroke-linecap="round"/>${
        eyes([round(53.6, 35 + d, 2.7, state), round(66.4, 35 + d, 2.7, state)], state)
      }<path d="M45 ${27 + d} C35 ${29 + d} 35 ${52 + d} 41 ${57 + d} C47 ${60 + d} 50 ${46 + d} 49 ${31 + d} Z" fill="${c.dark}"/>`
      + `<path d="M75 ${27 + d} C85 ${29 + d} 85 ${52 + d} 79 ${57 + d} C73 ${60 + d} 70 ${46 + d} 71 ${31 + d} Z" fill="${c.dark}"/>`
  }
  return `<ellipse cx="53" cy="${18 + d}" rx="5" ry="15" transform="rotate(-8 53 ${18 + d})" fill="${c.fur}"/><ellipse cx="53" cy="${19 + d}" rx="2.3" ry="11" transform="rotate(-8 53 ${19 + d})" fill="${c.inner}"/>`
    + `<ellipse cx="67" cy="${18 + d}" rx="5" ry="15" transform="rotate(8 67 ${18 + d})" fill="${c.fur}"/><ellipse cx="67" cy="${19 + d}" rx="2.3" ry="11" transform="rotate(8 67 ${19 + d})" fill="${c.inner}"/>`
    + `<ellipse cx="60" cy="${44 + d}" rx="14.5" ry="13" fill="${c.fur}"/>`
    + `<ellipse cx="56.5" cy="${51 + d}" rx="4.4" ry="3.2" fill="${c.light}"/><ellipse cx="63.5" cy="${51 + d}" rx="4.4" ry="3.2" fill="${c.light}"/>${
      eyes([round(52.5, 42 + d, 2.6, state), round(67.5, 42 + d, 2.6, state)], state)
    }<path d="M58.2 ${48.4 + d} h3.6 l-1.8 2.1 Z" fill="${c.nose}"/>`
    + `<path d="M50 ${50 + d} L41 ${48.5 + d} M70 ${50 + d} L79 ${48.5 + d}" stroke="${EYE}" stroke-width=".7" opacity=".4"/>`
}

function body(sp: Species): string {
  const c = COAT[sp]
  if (sp === 'gatto') {
    return `<path d="M49 52 C44 64 36 84 38 104 C39 112 50 114 60 114 C70 114 81 112 82 104 C84 84 76 64 71 52 Z" fill="${c.fur}"/>`
      + `<path d="M53 55 C50 70 52 90 60 100 C68 90 70 70 67 55 Z" fill="${c.light}"/>`
      + `<path d="M40 86 q5 -2 8 2 M39 96 q5 -2 8 2 M80 86 q-5 -2 -8 2 M81 96 q-5 -2 -8 2" fill="none" stroke="${c.dark}" stroke-width="2" stroke-linecap="round"/>`
      + `<rect x="50" y="80" width="8" height="32" rx="4" fill="${c.fur}"/><rect x="62" y="80" width="8" height="32" rx="4" fill="${c.fur}"/>`
      + `<ellipse cx="54" cy="112" rx="4.6" ry="2.6" fill="${c.light}"/><ellipse cx="66" cy="112" rx="4.6" ry="2.6" fill="${c.light}"/>`
      + `<path d="M80 108 C95 106 97 117 84 117 L68 117" fill="none" stroke="${c.fur}" stroke-width="6" stroke-linecap="round"/>`
  }
  if (sp === 'cane') {
    return `<path d="M80 98 C92 92 96 80 94 70" fill="none" stroke="${c.fur}" stroke-width="5" stroke-linecap="round"/><circle cx="94" cy="70" r="2.6" fill="${c.light}"/>`
      + `<path d="M46 50 C40 64 36 86 38 106 C39 113 50 114 60 114 C70 114 81 113 82 106 C84 86 80 64 74 50 Z" fill="${c.fur}"/>`
      + `<path d="M51 52 C47 70 51 92 60 101 C69 92 73 70 69 52 Z" fill="${c.light}"/>`
      + `<rect x="49" y="78" width="9.5" height="35" rx="4.75" fill="${c.light}"/><rect x="61.5" y="78" width="9.5" height="35" rx="4.75" fill="${c.light}"/>`
  }
  return `<ellipse cx="42" cy="112" rx="8.5" ry="3.8" fill="${c.dark}"/><ellipse cx="78" cy="112" rx="8.5" ry="3.8" fill="${c.dark}"/>`
    + `<path d="M46 54 C35 68 34 100 40 110 C44 115 52 115 60 115 C68 115 76 115 80 110 C86 100 85 68 74 54 Z" fill="${c.fur}"/>`
    + `<path d="M52 62 C48 80 52 100 60 106 C68 100 72 80 68 62 Z" fill="${c.light}"/>`
    + `<ellipse cx="54" cy="110" rx="4.2" ry="3" fill="${c.light}"/><ellipse cx="66" cy="110" rx="4.2" ry="3" fill="${c.light}"/>`
}

export function mascotViewBox(pose: Pose, crop: boolean): string {
  if (!crop)
    return '0 0 120 120'
  return pose === 'affacciato' ? '22 44 76 76' : '21 2 78 78'
}

export function mascotSvg(sp: Species, pose: Pose, state: MascotState): string {
  const c = COAT[sp]
  if (pose === 'affacciato') {
    const paw = sp === 'cane' ? c.light : c.fur
    return `${head(sp, c.peekDy, state)
    }<rect x="0" y="100" width="120" height="20" fill="var(--edge)"/>`
    + `<ellipse cx="46" cy="101" rx="7.5" ry="4.5" fill="${paw}"/><ellipse cx="74" cy="101" rx="7.5" ry="4.5" fill="${paw}"/>`
  }
  const lowered = state === 'dorme' ? 3 : 0
  return `<g class="${state === 'dorme' ? 'breathe' : ''}">${body(sp)}${head(sp, lowered, state)}</g>`
}
