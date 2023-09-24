export const removeWhiteSpace = (s: string): string => {
  return s.trim().replaceAll(/\s{2,}/g, ' ')
}
