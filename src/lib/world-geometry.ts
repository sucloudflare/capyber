// CAPYBER — Geometria mundial para o globo 3D
// Usa o TopoJSON do Natural Earth (world-atlas, 110m — leve e preciso) e converte
// para segmentos de linha 3D: o "desenho dos países" estilo mapa de sala de crise.

import * as topojson from 'topojson-client'
import worldTopo from 'world-atlas/countries-110m.json'

type TopoTopology = Parameters<typeof topojson.feature>[0]

export interface CountryPolyline {
  /** Nome do país (ex.: "Brazil") */
  name: string
  /** Anéis do polígono, cada um como lista de [lat, lon] */
  rings: [number, number][][]
}

let cache: CountryPolyline[] | null = null

/** Retorna os contornos de todos os países como polilinhas [lat, lon]. */
export function worldCountries(): CountryPolyline[] {
  if (cache) return cache
  const topo = worldTopo as unknown as TopoTopology
  // topojson.feature com o objeto "countries" devolve um FeatureCollection
  const fc = topojson.feature(topo, topo.objects.countries as never) as unknown as {
    features: Array<{
      properties?: { name?: string }
      geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
    }>
  }
  const out: CountryPolyline[] = []
  for (const f of fc.features) {
    const name = f.properties?.name ?? '—'
    const rings: [number, number][][] = []
    if (f.geometry.type === 'Polygon') {
      for (const ring of f.geometry.coordinates as number[][][]) {
        rings.push(ring.map(([lon, lat]) => [lat, lon] as [number, number]))
      }
    } else {
      for (const poly of f.geometry.coordinates as number[][][][]) {
        for (const ring of poly) {
          rings.push(ring.map(([lon, lat]) => [lat, lon] as [number, number]))
        }
      }
    }
    out.push({ name, rings })
  }
  cache = out
  return out
}
