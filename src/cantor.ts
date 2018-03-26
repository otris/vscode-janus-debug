// See https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function

export function cantorPairing(x: number, y: number): number {
    return (x + y) * (x + y + 1) / 2 + y;
}

export function reverseCantorPairing(n: number): { x: number, y: number } {
    const j = Math.floor(Math.sqrt(0.25 + 2 * n) - 0.5);
    return {
        x: j - (n - j * (j + 1) / 2),
        y: n - j * (j + 1) / 2,
    };
}
