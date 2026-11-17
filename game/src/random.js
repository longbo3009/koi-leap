// A small seeded random generator: the same seed gives the same river, which is
// what makes the screenshot scenes repeatable. A 32-bit hash of the seed, then a
// xorshift step on every call.

export function createRandom(seed) {
  let state = (seed ^ 0x9e3779b9) >>> 0;
  if (state === 0) state = 0x1234567;
  return function random() {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}
