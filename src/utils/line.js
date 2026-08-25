// Etiqueta de la línea, tolerante a campos ausentes.
//
// Es el único lugar donde se arma este texto: antes se repetía en Sidebar y en
// Itinerary, y cualquiera de los dos rompía la pantalla si `line` era null.
export function describeLine(line) {
  if (!line) return 'Línea no disponible'

  const code = [
    line.number == null ? null : `(L${line.number})`,
    line.name ? `[${line.name}]` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const route = [line.start_route, line.end_route].filter(Boolean).join(' - ')

  if (code && route) return `${code} : ${route}`
  return code || route || 'Línea no disponible'
}
