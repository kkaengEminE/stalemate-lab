import { Chess } from './vendor/chess.js';
export { Chess };
export const moveObject = uci => ({ from: uci.slice(0, 2), to: uci.slice(2, 4), ...(uci[4] ? { promotion: uci[4] } : {}) });
export function safeMove(game, uci) { try { return game.move(typeof uci === 'string' ? moveObject(uci) : uci); } catch { return null; } }
// Enumerates every legal learner move against the stated, fixed opponent responses.
// This is intentionally not an adversarial chess engine or a forced-draw claim.
export function solve(fen, replies, index = 0) {
  const game = new Chess(fen);
  if (index >= replies.length || game.isGameOver()) return [];
  let best = [];
  for (const move of game.moves({ verbose: true })) {
    game.move(move);
    if (!game.isGameOver() && safeMove(game, replies[index])) {
      let tail = null;
      if (game.isStalemate() && game.turn() === 'w') tail = [];
      else if (!game.isGameOver()) { const next = solve(game.fen(), replies, index + 1); if (next.length) tail = next; }
      if (tail !== null) {
        const candidate = [move.from + move.to + (move.promotion || ''), replies[index], ...tail];
        if (!best.length || candidate.length < best.length || (candidate.length === best.length && candidate.join() < best.join())) best = candidate;
      }
      game.undo();
    }
    game.undo();
  }
  return best;
}
export function evaluateMove(fen, uci, replies, index) {
  const game = new Chess(fen);
  if (!safeMove(game, uci)) return { ok: false, reason: 'illegal' };
  const afterPlayer = game.fen();
  if (game.isGameOver() || !safeMove(game, replies[index])) return { ok: false, reason: 'off-route' };
  const won = game.isStalemate() && game.turn() === 'w';
  if (!won && (game.isGameOver() || !solve(game.fen(), replies, index + 1).length)) return { ok: false, reason: 'no-stalemate' };
  return { ok: true, won, afterPlayer, afterReply: game.fen() };
}
