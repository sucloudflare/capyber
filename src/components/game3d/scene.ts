// CAPYBER Trilha 3D — layout do mapa. O cenário é SIMÉTRICO: itens de
// decoração declarados aqui são espelhados no eixo X (esquerda = direita),
// formando um vale com caminho serpenteando ao sul→norte. O novo cenário RPG
// adiciona castelos por zona de dificuldade, torres de vigia, rio com ponte,
// tochas, ruínas e cercas — tudo fora do raio jogável do caminho.

export interface Spot {
  id: string
  x: number
  z: number
}

/** ponto genérico sem id (luminárias, moedas) */
export interface Point {
  x: number
  z: number
}

/** santuários das fases — o caminho serpenteia de sul (início) a norte (chefe) */
export const SHRINE_SPOTS: Spot[] = [
  { id: 'f1', x: 0, z: 12 },
  { id: 'f2', x: 4.6, z: 6.4 },
  { id: 'f3', x: -4.6, z: 0.9 },
  { id: 'f4', x: 4.6, z: -4.6 },
  { id: 'f5', x: -4.6, z: -10.1 },
  { id: 'f6', x: 3.4, z: -15.4 },
  { id: 'boss', x: 0, z: -20.6 },
]

/** decoração espelhada (x → -x): árvores em pares e grupos simétricos */
export const TREE_SPOTS: { x: number; z: number; s: number }[] = [
  { x: 8.6, z: 12.2, s: 1.0 },
  { x: 14.5, z: 8.5, s: 1.25 },
  { x: 12, z: 2.4, s: 0.95 },
  { x: 19, z: -10, s: 1.15 },
  { x: 11, z: -14, s: 1.0 },
  { x: 7.5, z: -18.5, s: 0.85 },
  { x: 22.5, z: 19, s: 1.25 },
  { x: 21, z: 2, s: 1.1 },
  { x: 19.5, z: -12.5, s: 1.2 },
  { x: 8.5, z: 20, s: 0.9 },
]

/** cristais decorativos também em pares espelhados */
export const CRYSTAL_SPOTS: { x: number; z: number; s: number }[] = [
  { x: 5.8, z: 9.6, s: 1.0 },
  { x: 6.8, z: -1.8, s: 0.85 },
  { x: 6.2, z: -12.4, s: 1.05 },
  { x: 10.5, z: 4.5, s: 0.8 },
]

/** lanternas margeando o caminho (espelhadas) */
export const LAMP_SPOTS: Point[] = [
  { x: 2.3, z: 15.5 },
  { x: 2.3, z: 3.8 },
  { x: 2.3, z: -7.8 },
  { x: 2.3, z: -17.6 },
]

/** pedras decorativas (espelhadas) */
export const ROCK_SPOTS: { x: number; z: number; s: number }[] = [
  { x: 7.8, z: 6.8, s: 0.5 },
  { x: 8.6, z: -8.6, s: 0.65 },
  { x: 5.2, z: 18.5, s: 0.4 },
  { x: 9.8, z: -17.5, s: 0.45 },
]

/** moedas douradas: pares espelhados + duas no eixo */
export const COIN_SPOTS: Point[] = [
  { x: 2.2, z: 15 },
  { x: 6.6, z: 8.6 },
  { x: 6.9, z: -2.2 },
  { x: 6.6, z: -12.6 },
  { x: 0, z: 9.4 },
  { x: 0, z: -17.2 },
]

/** fantasmas NPC que habitam o vale */
export const NPC_GHOSTS: {
  id: string
  x: number
  z: number
  tint: string
  name: string
  line: string
  scale: number
}[] = [
  {
    id: 'vigia',
    x: 2.7,
    z: 16.6,
    tint: '#7cb6ec',
    name: 'VIGIA',
    line: 'Cada santuário guarda um curso e uma prova.',
    scale: 0.95,
  },
  {
    id: 'capy',
    x: 1.9,
    z: -2.6,
    tint: '#f5b73d',
    name: 'CAPY',
    line: 'Curso → prova → certificado em PDF!',
    scale: 0.8,
  },
  {
    id: 'hunter',
    x: -2.5,
    z: -18.8,
    tint: '#3fbf7f',
    name: 'CAÇADOR',
    line: 'Prove suas detecções no desafio final.',
    scale: 1.05,
  },
]

/* ============ cenário RPG: castelos, torres, rio e ruínas ============ */

/** raio VISUAL da ilha — o raio JOGÁVEL continua sendo ISLAND_RADIUS (abaixo),
 * então sobra uma borda de grama para castelos e torres fora do caminho. */
export const ISLAND_VISUAL_RADIUS = 30.2

/** posição inicial do jogador (sul da ilha) */
export const PLAYER_START = { x: 0, z: 18.5 }

/** limites da ilha para o movimento do jogador */
export const ISLAND_RADIUS = 25.5
export const INTERACT_RADIUS = 2.6

/** posição viva do jogador — escrita pelo PlayerRig, lida por moedas/NPCs/UI */
export const PLAYER_POS: { x: number; z: number } = { x: PLAYER_START.x, z: PLAYER_START.z }

/** curva do caminho de terra (pintada no chão e marcada com pedras 3D) */
export const PATH_CURVE: Point[] = [
  { x: 0, z: 19 },
  { x: 0.7, z: 16.8 },
  { x: 1.6, z: 14.6 },
  { x: 1.9, z: 12.9 },
  { x: 3.1, z: 10.6 },
  { x: 3.9, z: 8.4 },
  { x: 3.2, z: 6.4 },
  { x: 1.4, z: 4.2 },
  { x: -1.5, z: 2.6 },
  { x: -3.2, z: 1.4 },
  { x: -2.2, z: -0.6 },
  { x: 1.2, z: -2.4 },
  { x: 3.4, z: -4.4 },
  { x: 2.4, z: -6.6 },
  { x: -0.8, z: -8.2 },
  { x: -3.4, z: -9.8 },
  { x: -2.4, z: -12.2 },
  { x: 0.4, z: -13.9 },
  { x: 2.6, z: -15.2 },
  { x: 2.0, z: -17.4 },
  { x: 0.6, z: -19.2 },
  { x: 0, z: -20.4 },
]

/** rio decorativo que corta o vale de oeste a leste (com ponte de pedra) */
export const RIVER_CURVE: Point[] = [
  { x: -31.5, z: 11.6 },
  { x: -22, z: 10.2 },
  { x: -13, z: 8.2 },
  { x: -6, z: 6.2 },
  { x: 0.6, z: 4.0 },
  { x: 7.5, z: 2.9 },
  { x: 16, z: 2.3 },
  { x: 24, z: 2.0 },
  { x: 31.5, z: 1.9 },
]

/** ponte de pedra sobre o rio (cruza o caminho perto de (0, 3.7)) */
export const BRIDGE_SPOT = { x: 0.1, z: 3.75, rotY: 1.07 }

export type CastleVariant = 'granite' | 'sandstone' | 'obsidian'

/** um castelo por zona de dificuldade — o obsidiana guarda o chefe ao norte */
export const CASTLE_SPOTS: {
  x: number
  z: number
  variant: CastleVariant
  scale: number
}[] = [
  { x: 15.5, z: 17.5, variant: 'granite', scale: 1 },
  { x: -16, z: -3.5, variant: 'sandstone', scale: 1.05 },
  { x: 0, z: -26.2, variant: 'obsidian', scale: 1.1 },
]

/** torres de vigia margeando o caminho (viradas para o centro do vale) */
export const WATCHTOWER_SPOTS: Point[] = [
  { x: 6.8, z: 13.8 },
  { x: -7.2, z: 3.4 },
  { x: 7.4, z: -6.4 },
  { x: -6.6, z: -16.8 },
  { x: 11.8, z: -22.8 },
]

/** tochas do caminho — só as marcadas com `lit` recebem PointLight
 * (orçamento de luz: 4 luzes piscantes no máximo) */
export const TORCH_SPOTS: { x: number; z: number; lit?: boolean }[] = [
  { x: 3.1, z: 9.8, lit: true },
  { x: -3.1, z: 9.8, lit: true },
  { x: 2.5, z: -2.2, lit: true },
  { x: -2.5, z: -2.2, lit: true },
  { x: 3.0, z: 17.2 },
  { x: -3.0, z: 17.2 },
]

/** ruínas de colunas antigas (espelhadas) */
export const RUIN_SPOTS: { x: number; z: number; s: number }[] = [
  { x: 9.2, z: 5.4, s: 1 },
  { x: 11.6, z: -13.6, s: 0.85 },
  { x: 6.2, z: 19.6, s: 0.9 },
]

/** cercas de madeira (trechos retos, declarados nos dois lados) */
export const FENCE_RUNS: { from: Point; to: Point }[] = [
  { from: { x: 3.3, z: 15.2 }, to: { x: 3.9, z: 18.8 } },
  { from: { x: -3.3, z: 15.2 }, to: { x: -3.9, z: 18.8 } },
  { from: { x: 3.8, z: 9.6 }, to: { x: 4.5, z: 12.4 } },
  { from: { x: -3.8, z: 9.6 }, to: { x: -4.5, z: 12.4 } },
]
