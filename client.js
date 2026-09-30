const apiRoot = window.IT_SERVER_URL;
let sessionToken = sessionStorage.getItem('archive-session') || '';
let currentUser = null;
const $ = id => document.getElementById(id);
const titles = {1:'General Access',2:'Corporate Team',3:'QA Team',4:'Executive'};
let typingAudio;
function typeSound() {
  try {
    typingAudio ||= new (window.AudioContext || window.webkitAudioContext)();
    if(typingAudio.state==='suspended')typingAudio.resume().catch(()=>{});
    const sound=typingAudio.createOscillator(),gain=typingAudio.createGain();
    sound.type='triangle';sound.frequency.value=180+Math.random()*80;
    gain.gain.setValueAtTime(0.04,typingAudio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,typingAudio.currentTime+0.025);
    sound.connect(gain);gain.connect(typingAudio.destination);sound.start();sound.stop(typingAudio.currentTime+0.03);
    sound.onended=()=>{sound.disconnect();gain.disconnect();};
  }catch{}
}
for(const input of [$('userId'),$('password')])input.addEventListener('input',typeSound);
async function api(route, data) {
  if (!apiRoot) throw Error('IT Servers unavailable. Please try again later.');
  let response;
  try { response = await fetch(apiRoot + route, {
    method: data === undefined ? 'GET' : 'POST',
    headers: {'Content-Type':'application/json', ...(sessionToken ? {Authorization:'Bearer '+sessionToken} : {})},
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(12000)
  }); } catch { throw Error('IT Servers unavailable. Please try again later.'); }
  const result = await response.json();
  if (!response.ok) throw Error(result.error || 'Request failed.');
  return result;
}
function showGames() {$('itPanel').hidden=true;$('gamesPanel').hidden=false;}
function loginScreen() {
  sessionToken='';currentUser=null;sessionStorage.removeItem('archive-session');
  $('portal').hidden=true;$('terminal').hidden=false;$('loginForm').reset();
  $('records').replaceChildren();$('auditRows').replaceChildren();$('userId').focus();
}
async function showArchive() {
  const result = await api('/api/games');
  currentUser=result.user;
  $('welcome').textContent=`Welcome, ${currentUser.name}! Access Level - ${titles[currentUser.level]}`;
  $('itTab').hidden=currentUser.level!==4;
  $('records').replaceChildren();$('gameSearch').value='';$('searchStatus').textContent='';
  result.games.forEach((game,index)=>{
    const row=document.createElement('tr');
    if(!game.level)row.className='locked';
    for(const value of [index+1,game.name,game.level?titles[game.level]:'',game.level?'Ready to play':'']) {
      const cell=document.createElement('td');cell.textContent=value;row.append(cell);
    }
    const cell=document.createElement('td');
    if(game.level){
      const button=document.createElement('button');button.className='launch';button.textContent='Play';
      button.addEventListener('click',async()=>{
        const tab=window.open('about:blank','_blank');
        if(!tab){$('searchStatus').textContent='Allow pop-ups to open the game.';return;}
        tab.opener=null;button.disabled=true;
        try {const launch=await api('/api/launch',{game:game.id});tab.location.replace(new URL('file-loader/#'+launch.token,location.href).href);}
        catch(error){tab.close();$('searchStatus').textContent=error.message;}
        finally{button.disabled=false;}
      });cell.append(button);
    }
    row.append(cell);$('records').append(row);
  });
  showGames();$('terminal').hidden=true;$('portal').hidden=false;
}
$('userId').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();$('password').focus();}});
let busy=false;
$('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;busy=true;$('error').textContent='';$('loginForm').inert=true;
  try {const result=await api('/api/login',{id:$('userId').value.trim(),password:$('password').value});
    $('password').value='';sessionToken=result.token;sessionStorage.setItem('archive-session',sessionToken);await showArchive();
  }catch(error){loginScreen();$('error').textContent=error.message;}
  finally{busy=false;$('loginForm').inert=false;}
});
$('logout').addEventListener('click',async()=>{try{await api('/api/logout',{});}catch{}finally{loginScreen();}});
$('gamesTab').addEventListener('click',showGames);
$('itTab').addEventListener('click',async()=>{
  $('gamesPanel').hidden=true;$('itPanel').hidden=false;$('auditRows').replaceChildren();$('auditStatus').textContent='Loading shared logs…';
  try {const {logs}=await api('/api/logs');for(const entry of logs){const row=document.createElement('tr');for(const value of [new Date(entry.time).toLocaleString(),entry.user,entry.event,entry.result]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}$('auditRows').append(row);}$('auditStatus').textContent='Latest 1,000 events across all devices.';}
  catch(error){$('auditStatus').textContent=error.message;}
});
$('gameSearch').addEventListener('input',event=>{const query=event.target.value.toLowerCase().trim();for(const row of $('records').rows)row.hidden=!Array.from(row.cells).slice(1,4).map(c=>c.textContent).join(' ').toLowerCase().includes(query);});
if(sessionToken)showArchive().catch(error=>{loginScreen();$('error').textContent=error.message;});
