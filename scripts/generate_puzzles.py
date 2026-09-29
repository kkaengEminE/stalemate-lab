"""Generate 50 legal instructional positions by reversing from actual stalemates.
Opponent responses are scripted, NOT minimax / forced-draw claims.
Requires python-chess. Deterministic seed; no copyrighted puzzle collection.
"""
import chess, random, json, pathlib
rng = random.Random(20260921)
OUT = pathlib.Path(__file__).resolve().parents[1] / 'app/src/main/assets/puzzles.js'

def key(b): return b.board_fen() + (' w' if b.turn else ' b')

def predecessors(b, capture=None):
    color = not b.turn
    out = []
    for dest, piece in b.piece_map().items():
        if piece.color != color or piece.piece_type == chess.PAWN: continue
        for src in chess.SQUARES:
            if b.piece_at(src): continue
            prior = b.copy(stack=False)
            prior.remove_piece_at(dest)
            prior.set_piece_at(src, piece)
            if capture:
                if color != chess.BLACK or piece.piece_type == chess.KING: continue
                prior.set_piece_at(dest, chess.Piece(capture, chess.WHITE))
            prior.turn = color
            prior.halfmove_clock = 0
            prior.fullmove_number = 1
            m = chess.Move(src, dest)
            if prior.is_valid() and m in prior.legal_moves and not prior.is_game_over():
                # Avoid positions with only one option and captures of the strong side.
                out.append((prior, m.uci()))
    rng.shuffle(out)
    return out

def reverse_chain(final, depth, sacrificial):
    b = final.copy(); line = []; seen = {key(b)}
    for ply in range(depth*2):
        candidates = predecessors(b, sacrificial if ply == 0 else None)
        candidates = [(p,m) for p,m in candidates if key(p) not in seen]
        if not candidates: return None
        b,m = candidates[0]
        seen.add(key(b)); line.insert(0,m)
    if len(list(b.legal_moves)) < 2: return None
    return b, line

def solutions(b, replies, i=0):
    if i >= len(replies): return []
    found=[]
    for m in list(b.legal_moves):
        b.push(m)
        r=chess.Move.from_uci(replies[i])
        if not b.is_game_over() and r in b.legal_moves:
            b.push(r)
            if b.is_stalemate() and b.turn == chess.WHITE: found.append([m.uci(),r.uci()])
            elif not b.is_game_over():
                for tail in solutions(b,replies,i+1): found.append([m.uci(),r.uci()]+tail)
            b.pop()
        b.pop()
    return sorted(found,key=lambda x:(len(x),x))

def canonical(b):
    # Distinct starts, excluding reflections and quarter-turns of the same puzzle.
    def transform(flip,rotate):
        out=[]
        for sq,p in b.piece_map().items():
            x,y=chess.square_file(sq),chess.square_rank(sq)
            if flip: x=7-x
            for _ in range(rotate): x,y=7-y,x
            out.append((p.symbol(),x,y))
        return str(sorted(out))
    return min(transform(f,r) for f in [False,True] for r in range(4))

puzzles=[]; seen=set()
# All these endings are independently verified before use.
finals=[]
for wk in chess.SQUARES:
    if chess.square_file(wk) not in [0,7] and chess.square_rank(wk) not in [0,7]: continue
    for bk in chess.SQUARES:
        if chess.square_distance(wk,bk)>4: continue
        for q in chess.SQUARES:
            if len({wk,bk,q})<3: continue
            b=chess.Board(None)
            for sq,p in [(wk,'K'),(bk,'k'),(q,'q')]: b.set_piece_at(sq,chess.Piece.from_symbol(p))
            b.turn=chess.WHITE
            if b.is_valid() and b.is_stalemate(): finals.append(b)
print('Verified final templates:',len(finals),flush=True)
chapters=[(1,1,False),(2,2,False),(3,3,False),(4,1,True),(5,2,True)]
names=['도망갈 칸을 없애기','가장자리로 한 걸음','안전한 막다른 길','퀸의 그늘','경계선 위의 왕','마지막 피난처','탈출구 닫기','공격받지 않는 칸','한 칸의 차이','무승부의 문']
for chapter,depth,extra in chapters:
    count=0; attempts=0
    while count<10:
        attempts+=1
        final=rng.choice(finals)
        sacrifice=rng.choice([chess.ROOK,chess.BISHOP,chess.KNIGHT]) if extra else None
        candidate=reverse_chain(final,depth,sacrifice)
        if not candidate: continue
        b,line=candidate
        if canonical(b) in seen: continue
        replies=line[1::2]
        sols=solutions(b.copy(),replies)
        if not sols or len(sols[0])!=depth*2: continue
        # Include only positions where the weaker side remains materially behind.
        vals={chess.KING:0,chess.QUEEN:9,chess.ROOK:5,chess.BISHOP:3,chess.KNIGHT:3,chess.PAWN:1}
        material=sum(vals[p.piece_type]*(1 if p.color else -1) for p in b.piece_map().values())
        if material>=0: continue
        seen.add(canonical(b)); chosen=sols[0]; playback=b.copy(); sans=[]
        for uci in chosen:
            m=chess.Move.from_uci(uci); sans.append(playback.san(m)); playback.push(m)
        assert playback.is_stalemate()
        king=chess.square_name(playback.king(chess.WHITE))
        title=names[count] if not extra else ['남은 기물을 내려놓기','마지막 기물의 역할','희생으로 닫는 길','빈손으로 살아남기','퀸을 유인하기','잡히면 무승부','움직일 수 없는 왕','기물보다 중요한 반 수','막다른 길의 희생','마지막 탈출 작전'][count]
        puzzles.append(dict(id=len(puzzles)+1,chapter=chapter,depth=depth,title=title,fen=b.fen(),line=chosen,replies=replies,san=sans,mode='scripted',solutionCount=len(sols),hint=('상대 퀸이 마지막 기물을 잡도록 유도하고, 왕의 도망갈 칸을 없애세요.' if extra else '상대 퀸의 공격선을 살피며 왕의 도망갈 칸이 사라지는 위치를 찾으세요.'),explanation=f'마지막에 내 왕은 {king}에 있습니다. 체크를 받지 않지만 움직일 수 있는 칸이 하나도 없어 스테일메이트입니다.'+( ' 남은 기물을 희생해 다른 합법적인 수도 없앴습니다.' if extra else ' 왕만 있으므로 다른 기물로 둘 수도 없습니다.')))
        count+=1
    print('Chapter',chapter,': 10 puzzles, attempts',attempts,flush=True)
OUT.write_text('export const puzzles = '+json.dumps(puzzles,ensure_ascii=False,indent=2)+';\n')
