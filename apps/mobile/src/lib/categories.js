// Ícono según el slug/nombre de la categoría, con las mismas reglas que la
// web (apps/web/lib/categories.js): funciona con cualquier categoría que cree
// el admin sin tener que tocar la app.
const RULES = [
  [/sneaker|tenis|zapat|calzado/, 'footsteps-outline'],
  [/audio|audif|sonido|parlant|micro/, 'headset-outline'],
  [/power|bater|bank/, 'battery-charging-outline'],
  [/carg|cable|charg/, 'flash-outline'],
  [/consol|gam|tv|entreten|proyect/, 'game-controller-outline'],
  [/hogar|home|saban|casa/, 'bed-outline'],
  [/ropa|conjunt|camis|buzo|chaqueta/, 'shirt-outline'],
  [/wear|reloj|watch|band/, 'watch-outline'],
  [/acces|holder|soporte|funda/, 'phone-portrait-outline'],
];

export function categoryIcon(category) {
  const key = `${category.slug} ${category.name}`.toLowerCase();
  return RULES.find(([re]) => re.test(key))?.[1] ?? 'layers-outline';
}

/** "en 3 días", "en 4 h 12 min"… o null si ya pasó. */
export function faltaPara(fecha) {
  const ms = new Date(fecha) - Date.now();
  if (!(ms > 0)) return null;
  const dias = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  if (dias > 0) return `en ${dias} día${dias === 1 ? '' : 's'}`;
  if (horas > 0) return `en ${horas} h ${min} min`;
  return `en ${min} min`;
}
