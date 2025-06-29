/**
 * Concatena classes CSS ignorando valores vazios.
 *
 * @param inputs - Lista de classes ou valores falsy.
 * @returns String com as classes válidas separadas por espaço.
 */
export function cn(...inputs: Array<string | undefined | false | null>) {
  return inputs.filter(Boolean).join(" ");
}
