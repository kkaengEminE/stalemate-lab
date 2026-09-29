import { puzzles } from './puzzles.js';
import { Chess, solve, safeMove, evaluateMove } from './engine.js';
import { pieceSVG } from './pieces.js';
const root = document.getElementById('app');
const chapters = [
 {id:1,title:'왕 하나로, 한 수',desc:'움직일 수 없는 순간을 발견해요',label:'기초 · 1수'},
 {id:2,title:'두 수 앞의 무승부',desc:'왕이 갈 곳을 미리 생각해요',label:'왕만 · 2수'},
 {id:3,title:'세 수를 연결하기',desc:'마지막 장면부터 거꾸로 읽어요',label:'왕만 · 3수'},
 {id:4,title:'남은 기물의 역할',desc:'한 번의 희생으로 길을 닫아요',label:'기물 포함 · 1수'},
 {id:5,title:'희생, 그리고 무승부',desc:'기물과 왕의 움직임을 연결해요',label:'기물 포함 · 2수'}
];
let progress = {};
try { const value = JSON.parse(localStorage.getItem('stalemate-progress-v1') || '{}'); if(value && typeof value==='object' && !Array.isArray(value)) progress=value; } catch {}
let page='home', chapter=1, puzzle=null, game=null, history=[], selected=null, hintSquare=null, message='', tone='', busy=false, timer=null, solutionVisible=false, replayStep=null, solutionLine=[], hasViewed=false;
const names={k:'왕',q:'퀸',r:'룩',b:'비숍',n:'나이트',p:'폰'};
const completed = id => Boolean(progress[id]?.done);
const doneCount = () => puzzles.filter(p=>completed(p.id)).length;
function persist(){ try { localStorage.setItem('stalemate-progress-v1',JSON.stringify(progress)); } catch {} }
function base(content, cls='') {
 root.innerHTML=`<main class="shell ${cls}"><header class="topbar"><button class="brand" data-action="home" aria-label="홈으로"><span class="brand-mark">½</span>STALEMATE LAB</button><span class="top-caption">무승부를 배우는 시간</span></header>${content}<footer class="bottom-label"><span>작은 한 수, 다른 결말.</span><span>OFFLINE CHESS LESSONS</span></footer></main>`;
 bind();
}
function home(){ cancel();page='home';
 const next=puzzles.find(p=>!completed(p.id)) || puzzles[0];
 base(`<section class="hero"><div><div class="eyebrow">THE ART OF THE HALF POINT</div><h1>불리한 순간에도,<br><em>길은 있어요.</em></h1><p>왕 하나로도 지켜낼 수 있는 반 수.<br>50개의 작은 연습으로 스테일메이트를 배워보세요.</p></div><div class="hero-art"><span class="half">½</span>${pieceSVG('k','w')}</div></section>
 <section class="summary"><div class="fraction">${doneCount()}<small> / 50</small></div><div class="summary-main"><div class="summary-title">${doneCount()===50?'모든 클래스를 살펴봤어요':'나의 스테일메이트 여정'}</div><div class="progress"><span style="width:${doneCount()*2}%"></span></div></div><button class="primary" data-open="${next.id}">${doneCount()?'이어서 연습':'첫 연습 시작'} ↗</button></section>
 <div class="section-title"><h2>단계별 클래스</h2><span>5단계 · 각 10개 문제</span></div><section class="chapters">${chapters.map(c=>`<button class="chapter" data-chapter="${c.id}"><div class="chapter-top"><span class="chapter-num">0${c.id}</span><span class="pill">${c.label}</span></div><h3>${c.title}</h3><p>${c.desc}</p><div class="chapter-bottom"><span>${puzzles.filter(p=>p.chapter===c.id&&completed(p.id)).length} / 10 완료</span><span>↗</span></div></button>`).join('')}</section>
 <div class="section-title"><h2>체크가 아닌데, 움직일 수 없다면?</h2></div><section class="rule-card"><span class="rule-icon">½</span><div><h3>그 순간, 스테일메이트.</h3><p>내 차례에 체크가 아니고, 내 모든 기물에 합법적인 수가 없다면 무승부예요. 왕 외에 움직일 기물이 하나라도 있으면 아직 끝나지 않았어요.</p></div></section>
 <p class="fineprint">원리 학습 모드 · 상대는 문제마다 정해진 수로 응수합니다. 실전에서 상대가 최선으로 대응해도 강제로 무승부가 된다는 뜻은 아니에요. 1수는 ‘내가 한 번 두기’를 뜻하며 상대의 응수가 뒤따릅니다.</p>`);
}
function lessonList(id){cancel();page='lessons';chapter=id;const c=chapters[id-1];
 base(`<button class="back" data-action="home">← 전체 클래스</button><div class="page-heading"><div><div class="eyebrow">CHAPTER 0${id}</div><h1>${c.title}</h1><p class="intro">${c.desc} · 모든 문제는 흰색으로 시작해요.</p></div></div><section class="lessons">${puzzles.filter(p=>p.chapter===id).map((p,i)=>`<button class="lesson" data-open="${p.id}"><span class="lesson-num">${String(i+1).padStart(2,'0')}</span><span><strong>${p.title}</strong><small>내 ${p.depth}수 · ${p.chapter>3?'기물 희생':'왕만 남은 상황'}${progress[p.id]?.viewed?' · 해법 참고':''}</small></span><span class="check">${completed(p.id)?'✓':'↗'}</span></button>`).join('')}</section>`);
}
function cancel(){clearTimeout(timer);timer=null;busy=false;}
function openPuzzle(id){cancel();page='play';puzzle=puzzles.find(p=>p.id===id);chapter=puzzle.chapter;resetState();renderPlay();window.scrollTo(0,0);}
function resetState(){game=new Chess(puzzle.fen);history=[];selected=null;hintSquare=null;solutionVisible=false;replayStep=null;solutionLine=[];hasViewed=false;tone='';message='흰색 기물을 눌러 움직일 수 있는 칸을 살펴보세요.';}
function displayGame(){ if(replayStep===null)return game;const g=new Chess(puzzle.fen);for(const m of solutionLine.slice(0,replayStep))safeMove(g,m);return g; }
function boardHTML(g){
 const possible=selected && replayStep===null && !busy?g.moves({square:selected,verbose:true}).map(m=>m.to):[];
 const last=replayStep!==null ? solutionLine[replayStep-1] : history.at(-1)?.reply;
 let html='';
 for(let rank=7;rank>=0;rank--)for(let file=0;file<8;file++){
  const sq=String.fromCharCode(97+file)+(rank+1),p=g.get(sq),light=(rank+file)%2===1;
  html+=`<button class="square ${light?'':'dark'} ${selected===sq?'selected':''} ${possible.includes(sq)?'legal':''} ${p?'occupied':''} ${last&&(last.slice(0,2)===sq||last.slice(2,4)===sq)?'last':''} ${hintSquare===sq?'hint':''}" data-square="${sq}" aria-label="${sq}${p?' '+(p.color==='w'?'백 ':'흑 ')+names[p.type]:''}" ${busy||replayStep!==null?'disabled':''}>${p?pieceSVG(p.type,p.color):''}${file===0?`<span class="coord rank">${rank+1}</span>`:''}${rank===0?`<span class="coord">${String.fromCharCode(97+file)}</span>`:''}</button>`;
 }return html;
}
function endExplanation(){ const king=game.board().flat().find(p=>p?.color==='w'&&p.type==='k')?.square; return `내 왕은 ${king}에서 체크를 받지 않고, 왕을 포함한 모든 기물에 합법적인 수가 없어요. 그래서 무승부입니다.`; }
function renderPlay(){
 const shown=displayGame(),won=game.isStalemate()&&game.turn()==='w',c=chapters[puzzle.chapter-1];
 base(`<button class="back" data-action="lessons">← ${c.title}</button><div class="page-heading"><div><div class="eyebrow">CLASS ${String(puzzle.id).padStart(2,'0')} / 50</div><h1>${puzzle.title}</h1></div></div><div class="play-layout"><section class="board-wrap"><div class="opponent"><span class="side-name"><i class="side-dot"></i>상대 · 검은색</span><span class="side-note">정해진 응수</span></div><div class="board" role="group" aria-label="체스판, 흰색은 아래쪽">${boardHTML(shown)}</div><div class="you"><span class="side-name"><i class="side-dot white"></i>나 · 흰색</span><span class="side-note">${replayStep!==null?'해법 재생 중':won?'스테일메이트 · ½–½':busy?'상대의 응수…':shown.isCheck()?'체크를 피하세요':'내 차례'}</span></div></section>
 <section class="play-panel"><div class="play-meta"><span class="tag">${c.label}</span><span class="tag neutral">원리 학습</span></div><h2>지지 않는 마지막 한 수.</h2><div class="goal">기물이 적은 흰색으로 ${puzzle.depth}번 두어<br>내가 스테일메이트가 되는 상황을 만드세요.</div>
 <div class="feedback ${tone}" role="status" aria-live="polite">${message}${won?'<div class="checklist"><span>✓ 내 차례입니다</span><span>✓ 왕이 체크를 받지 않습니다</span><span>✓ 내 모든 기물에 합법적인 수가 없습니다</span></div>':''}</div>
 <div class="actions"><button class="secondary" data-action="hint" ${won||busy||replayStep!==null?'disabled':''}>작은 힌트</button><button class="secondary" data-action="solution" ${busy?'disabled':''}>${solutionVisible?'해법 닫기':'해법 보기'}</button><button class="secondary" data-action="undo" ${!history.length||busy||replayStep!==null?'disabled':''}>한 수 되돌리기</button><button class="secondary" data-action="reset">처음부터</button></div>
 ${won?`<p class="explanation">${endExplanation()}</p><button class="primary wide" ${puzzle.id<50?`data-open="${puzzle.id+1}"`:'data-action="home"'}>${puzzle.id<50?'다음 클래스 →':'전체 클래스 보기'}</button>`:''}
 ${solutionVisible?solutionHTML():''}
 <section class="moves"><h3>나의 수순 · ${history.length} / ${puzzle.depth}수</h3>${history.length?history.map((h,i)=>`<div class="move-row"><span>${i+1}.</span><span>${h.playerSan}</span><span>${h.replySan||'…'}</span></div>`).join(''):'<p class="empty-moves">첫 수를 두면 수순이 여기에 기록돼요.</p>'}</section>
 <details class="response-list"><summary>상대의 예정된 응수 확인</summary>${puzzle.replies.map((m,i)=>`<div>${i+1}번째 응수 · ${m.slice(0,2)} → ${m.slice(2,4)}</div>`).join('')}</details><p class="fineprint">내 1수 + 상대 응수를 한 단계로 셉니다. 상대 수는 고정되어 있고, 해법은 이 조건 안에서 가장 짧은 수순입니다. 조건을 만족하는 다른 수순도 정답으로 인정해요.</p></section></div>`, 'play-page');
}
function solutionHTML(){return `<section class="solution"><h3>해법 · 정해진 응수에서 최단 ${solutionLine.length/2}수</h3><p>${puzzle.hint}</p>${puzzle.san.filter((_,i)=>i%2===0).map((san,i)=>`<div class="move-row"><span>${i+1}.</span><span>${san}</span><span>${puzzle.san[i*2+1]}</span></div>`).join('')}<div class="replay-controls"><button class="secondary" data-action="prev" ${replayStep===null||replayStep===0?'disabled':''}>← 이전</button><span>${replayStep===null?'수순 재생':`${replayStep} / ${solutionLine.length}`}</span><button class="secondary" data-action="next" ${replayStep===solutionLine.length?'disabled':''}>다음 →</button></div><button class="text-button" data-action="return">내 연습으로 돌아오기</button><p>${puzzle.explanation}</p><p>해법을 본 뒤 직접 완료한 문제는 ‘해법 참고’로 기록합니다.</p></section>`;}
function clickSquare(sq){
 if(busy||replayStep!==null||game.isGameOver())return;
 const piece=game.get(sq);
 if(piece?.color==='w') {selected=selected===sq?null:sq;hintSquare=null;renderPlay();return;}
 if(!selected)return;
 const moves=game.moves({square:selected,verbose:true});const move=moves.find(m=>m.to===sq);
 if(!move){message='그 칸으로는 이동할 수 없어요. 표시된 칸을 선택해 주세요.';tone='error';renderPlay();return;}
 const uci=move.from+move.to+(move.promotion||'');
 const result=evaluateMove(game.fen(),uci,puzzle.replies,history.length);
 if(!result.ok){message='합법적인 수지만, 이 문제의 정해진 응수로는 목표에 도달하지 못해요. 다른 길을 찾아보세요.';tone='error';selected=null;renderPlay();return;}
 const before=game.fen(),playerSan=game.move(move).san,index=history.length;
 history.push({before,player:uci,playerSan,reply:puzzle.replies[index],replySan:''});
 selected=null;hintSquare=null;busy=true;tone='';message='좋아요. 상대의 응수를 살펴보세요.';renderPlay();
 timer=setTimeout(()=>{
  const reply= safeMove(game,puzzle.replies[index]);history[index].replySan=reply.san;busy=false;
  if(game.isStalemate()) {tone='success';message='<strong>스테일메이트, 반 수를 지켰어요.</strong>움직일 수 없지만, 체크도 아니에요.';progress[puzzle.id]={done:true,viewed:progress[puzzle.id]?.done?progress[puzzle.id].viewed&&hasViewed:hasViewed};persist();}
  else {tone='';message=`${history.length}수를 잘 연결했어요. 앞으로 ${puzzle.depth-history.length}수, 마지막 장면을 만들어 보세요.`;}
  renderPlay();
 },450);
}
function action(a){
 if(a==='home')return home();if(a==='lessons')return lessonList(chapter);
 if(page!=='play')return;
 if(a==='reset'){const viewed=hasViewed;cancel();resetState();hasViewed=viewed;return renderPlay();}
 if(a==='undo'&&history.length&&!busy){const h=history.pop();game=new Chess(h.before);selected=null;hintSquare=null;message='한 수 전으로 돌아왔어요. 다른 길도 살펴보세요.';tone='';}
 if(a==='hint'&&!busy){hasViewed=true;const line=solve(game.fen(),puzzle.replies,history.length);hintSquare=line[0]?.slice(0,2);message=puzzle.hint+(line.length?` 다음에는 ${hintSquare}의 기물을 움직여 보세요.`:'');tone='';}
 if(a==='solution'){solutionVisible=!solutionVisible;replayStep=null;if(solutionVisible){hasViewed=true;solutionLine=solve(puzzle.fen,puzzle.replies);selected=null;}}
 if(a==='next'){replayStep=replayStep===null?0:Math.min(solutionLine.length,replayStep+1);selected=null;hintSquare=null;}
 if(a==='prev')replayStep=Math.max(0,replayStep-1);
 if(a==='return'){replayStep=null;}
 renderPlay();
}
function bind(){root.querySelectorAll('[data-action]').forEach(el=>el.onclick=()=>action(el.dataset.action));root.querySelectorAll('[data-chapter]').forEach(el=>el.onclick=()=>lessonList(Number(el.dataset.chapter)));root.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>openPuzzle(Number(el.dataset.open)));root.querySelectorAll('[data-square]').forEach(el=>el.onclick=()=>clickSquare(el.dataset.square));}
window.appBack=()=>{if(page==='play'){lessonList(chapter);return true;}if(page==='lessons'){home();return true;}return false;};
home();
