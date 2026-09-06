/** `total`'i `count` parçaya olabildiğince eşit böler — ilk `total % count` parçaya 1 fazla
 * verir, böylece toplam her zaman tam `total`'e eşit kalır (ör. 10/3 -> [4, 3, 3]). */
export function splitEqually(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => (i < remainder ? base + 1 : base));
}
