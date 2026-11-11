// PROTOTIPO: elenco di schermate, varianti e scenari mostrati dalla barra.
import type { Component } from 'vue'
import HomeA from './home/HomeA.vue'
import HomeB from './home/HomeB.vue'
import HomeC from './home/HomeC.vue'
import SpettatoreA from './spettatore/SpettatoreA.vue'
import SpettatoreB from './spettatore/SpettatoreB.vue'
import SpettatoreC from './spettatore/SpettatoreC.vue'
import TelecameraA from './telecamera/TelecameraA.vue'
import TelecameraB from './telecamera/TelecameraB.vue'
import TelecameraC from './telecamera/TelecameraC.vue'

export interface Variant { key: string, name: string, component: Component }
export interface Screen { key: string, label: string, variants: Variant[], scenarios: { key: string, label: string }[] }

export const screens: Screen[] = [
  {
    key: 'home',
    label: 'Home',
    variants: [
      { key: 'A', name: 'Due porte', component: HomeA },
      { key: 'B', name: 'Le tue Stanze', component: HomeB },
      { key: 'C', name: 'Una domanda alla volta', component: HomeC },
    ],
    scenarios: [
      { key: 'primo', label: 'Primo accesso' },
      { key: 'stanze', label: 'Con Stanze recenti' },
      { key: 'link', label: 'Arrivato da un link' },
    ],
  },
  {
    key: 'spettatore',
    label: 'Spettatore',
    variants: [
      { key: 'A', name: 'Elenco', component: SpettatoreA },
      { key: 'B', name: 'Una alla volta', component: SpettatoreB },
      { key: 'C', name: 'Muro', component: SpettatoreC },
    ],
    scenarios: [
      { key: 'normale', label: 'Una telecamera scollegata' },
      { key: 'tutte', label: 'Tutte in diretta' },
      { key: 'collegamento', label: 'Collegamento in corso' },
      { key: 'vuota', label: 'Nessuna telecamera' },
    ],
  },
  {
    key: 'telecamera',
    label: 'Telecamera',
    variants: [
      { key: 'A', name: 'Pannello', component: TelecameraA },
      { key: 'B', name: 'Quadro', component: TelecameraB },
      { key: 'C', name: 'Specchio', component: TelecameraC },
    ],
    scenarios: [
      { key: 'guardano', label: 'Due persone guardano' },
      { key: 'nessuno', label: 'Nessuno guarda' },
      { key: 'arrivo', label: 'Marta è appena entrata' },
      { key: 'schermo', label: 'Lo schermo può spegnersi' },
    ],
  },
]
