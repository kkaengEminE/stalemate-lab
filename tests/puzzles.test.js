import test from 'node:test';
import assert from 'node:assert/strict';
import { puzzles } from '../app/src/main/assets/puzzles.js';
import { Chess, solve, safeMove, evaluateMove } from '../app/src/main/assets/engine.js';
const value={k:0,q:9,r:5,b:3,n:3,p:1};
test('50 distinct, disadvantaged white-to-move positions, ten per chapter',()=>{
 assert.equal(puzzles.length,50);assert.equal(new Set(puzzles.map(p=>p.fen)).size,50);
 for(let c=1;c<=5;c++)assert.equal(puzzles.filter(p=>p.chapter===c).length,10);
 for(const p of puzzles){const g=new Chess(p.fen);assert.equal(g.turn(),'w');assert.equal(g.isGameOver(),false);let balance=0;for(const row of g.board())for(const piece of row)if(piece)balance+=value[piece.type]*(piece.color==='w'?1:-1);assert.ok(balance<0);const white=g.board().flat().filter(x=>x?.color==='w');assert.equal(white.length,p.chapter<=3?1:2);}
});
for(const p of puzzles)test(`Class ${p.id}: legal ${p.depth}-move shortest solution, correct SAN and own stalemate`,()=>{
 const g=new Chess(p.fen);assert.equal(p.line.length,p.depth*2);
 for(let i=0;i<p.line.length;i++){assert.equal(g.isGameOver(),false,'no premature terminal');const m=safeMove(g,p.line[i]);assert.ok(m,'legal move');assert.equal(m.san,p.san[i]);}
 assert.equal(g.turn(),'w');assert.ok(g.isStalemate());assert.equal(g.isCheck(),false);assert.equal(g.moves().length,0);
 const optimal=solve(p.fen,p.replies);assert.equal(optimal.length,p.depth*2);assert.deepEqual(optimal,p.line);
 const run=new Chess(p.fen);
 for(let i=0;i<p.depth;i++){const res=evaluateMove(run.fen(),optimal[i*2],p.replies,i);assert.ok(res.ok);assert.equal(res.won,i===p.depth-1);run.load(res.afterReply);}
});
test('illegal moves rejected without mutating the position',()=>{
 const p=puzzles[0];assert.equal(evaluateMove(p.fen,'a1a8',p.replies,0).ok,false);
 const g=new Chess(p.fen),before=g.fen();assert.equal(safeMove(g,'a1a8'),null);assert.equal(g.fen(),before);
});
test('alternative successful first moves are accepted, wrong legal paths are rejected',()=>{
 let alternatives=0,rejections=0;
 for(const p of puzzles){const g=new Chess(p.fen);for(const m of g.moves({verbose:true})){const uci=m.from+m.to+(m.promotion||'');const r=evaluateMove(p.fen,uci,p.replies,0);if(r.ok&&uci!==p.line[0])alternatives++;if(!r.ok)rejections++;}}
 assert.ok(alternatives>0);assert.ok(rejections>0);
});
test('checkmate and other draws do not count as own stalemate',()=>{
 const mate=new Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1');assert.ok(mate.isCheckmate());assert.equal(mate.isStalemate(),false);assert.deepEqual(solve(mate.fen(),['h8h7']),[]);
 const bare=new Chess('7k/8/8/8/8/8/8/K7 w - - 0 1');assert.ok(bare.isInsufficientMaterial());assert.equal(bare.isStalemate(),false);
});
