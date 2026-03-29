/**
 * 81 文字の盤面文字列を 9 行（各 9 文字）に分ける。
 * 長さが 81 でないときは検証せず、1 要素の配列でそのまま返す。
 */
export function linesOf81(s: string): string[] {
  if (s.length !== 81) {
    return [s];
  }
  return Array.from({ length: 9 }, (_, i) => s.slice(i * 9, i * 9 + 9));
}
