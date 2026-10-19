const state = {
  day: 1, timeText: "오전", action: 3, 
  water: 50, food: 50, power: 30, stone: 5, 
  hunger: 80, thirst: 70, sanity: 75,       
  
  facilityLevels: {
    water: 1,
    food: 1,
    power: 1
  },

  items: {
    medicines: 2,
    tobacco: 0,
    alcohol: 0,
    equipment: 2,
    information: 1 
  },

  visitor: null, 
  knocking: false, 
  visitorCount: 0,
  ignoreCount: 0,

  cctvStatus: {
    cam1: false,
    cam2: false,
    cam3: false
  },
  currentCam: 'cam1',
  isStarted: false 
};

const factions = [
  {name:"신정부", icon:"🛡", gives:["의약품","마석"], wants:["식량","물"], offer:"의약품 2 + 마석 1", need:"식량 10 + 물 8"},
  {name:"군인", icon:"🪖", gives:["장비","마석"], wants:["식량","물"], offer:"장비 1 + 마석 2", need:"식량 12 + 물 8"},
  {name:"초능력자 집단", icon:"🔮", gives:["장비","마석"], wants:["식량","물","의약품"], offer:"마석 2 + 장비 1", need:"식량 12 + 물 6"},
  {name:"사교도", icon:"☠", gives:["마석"], wants:["식량","물","장비"], offer:"마석 3", need:"식량 8 + 물 8"},
  {name:"민간집단", icon:"👥", gives:["담배","마석"], wants:["식량","물","의약품"], offer:"담배 1 + 마석 3", need:"식량 12 + 물 10"},
  {name:"약탈자들", icon:"⚔", gives:["술","마석"], wants:["식량","물"], offer:"술 1 + 마석 1", need:"식량 18 + 물 12"},
  {name:"구원교", icon:"✚", gives:["의약품"], wants:["식량","물"], offer:"의약품 3", need:"식량 15 + 물 10"}
];

const $ = id => document.getElementById(id);
const modal = $("modal"), content = $("modalContent");

let visitorTimer = null;

function render(){
  $("day").textContent = state.day;
  $("timeText").textContent = state.timeText;
  $("water").textContent = state.water;
  $("food").textContent = state.food;
  $("power").textContent = state.power;
  $("stone").textContent = state.stone;
  
  $("hunger").textContent = state.hunger;
  $("thirst").textContent = state.thirst;
  $("sanity").textContent = state.sanity;
  $("hungerBar").style.width = state.hunger+"%";
  $("thirstBar").style.width = state.thirst+"%";
  $("sanityBar").style.width = state.sanity+"%";
  $("actionPoints").textContent = "⚡ ".repeat(state.action) + "○ ".repeat(3-state.action);

  $("itemFoodCount").textContent = state.food;
  $("itemWaterCount").textContent = state.water;
  $("itemMedCount").textContent = state.items.medicines;
  $("itemTobCount").textContent = state.items.tobacco;
  $("itemAlcCount").textContent = state.items.alcohol;
  $("itemEqCount").textContent = state.items.equipment;

  const hasAnomaly = state.cctvStatus.cam1 || state.cctvStatus.cam2 || state.cctvStatus.cam3;
  if(state.sanity < 45 || hasAnomaly){
    $("cctv").classList.add("hallucination");
    $("cctv").innerHTML = `CAM 01<br><span>${hasAnomaly ? "⚠️ 이상 현상 감지!" : "신호 이상..."}</span>`;
  } else {
    $("cctv").classList.remove("hallucination");
    $("cctv").innerHTML = "CAM 01<br><span>정상</span>";
  }
}

function showModal(html){ content.innerHTML=html; modal.classList.remove("hidden"); }
function closeModal(){ modal.classList.add("hidden"); }
$("closeModal").onclick=closeModal;
modal.addEventListener("click",e=>{if(e.target===modal) closeModal();});

function randomFaction(){ return factions[Math.floor(Math.random()*factions.length)]; }

function startVisitorTimer(){
  if(!state.isStarted) return;
  if(visitorTimer) clearTimeout(visitorTimer);
  if(state.visitorCount >= 3 || state.knocking || state.visitor !== null) return;

  visitorTimer = setTimeout(() => {
    if(state.visitorCount < 3 && !state.knocking && state.visitor === null){
      knock();
    }
  }, 10000);
}

function knock(){
  if(state.action <= 0 || state.visitorCount >= 3) return;
  
  state.knocking = true;
  state.visitorCount++;

  if(state.visitorCount === 1) state.timeText = "오전";
  else if(state.visitorCount === 2) state.timeText = "오후";
  else if(state.visitorCount === 3) state.timeText = "저녁";

  state.hunger = Math.max(0, state.hunger - 6);
  state.thirst = Math.max(0, state.thirst - 6);
  checkGameOver();
  
  $("knockEffect").classList.remove("show");
  void $("knockEffect").offsetWidth;
  $("knockEffect").classList.add("show");
  
  state.tempIncomingVisitor = randomFaction();

  $("eventText").innerHTML = `
    <b>누군가 노크하고 있다! (${state.timeText} · ${state.visitorCount}/3회)</b><br>
    <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
      <button class="choice primary" style="padding:6px 10px; font-size:12px;" onclick="acceptTradeEvent()">거래하기 (👥 방문자)</button>
      <button class="choice" style="padding:6px 10px; font-size:12px;" onclick="ignoreKnock()">무시하기</button>
    </div>
  `;
  render();
}

function acceptTradeEvent(){
  if(state.action <= 0){
    toast("행동력이 부족합니다.");
    return;
  }
  state.action--;
  state.visitor = state.tempIncomingVisitor;
  
  $("doorArea").classList.add("open");
  const v = state.visitor;
  $("visitor").innerHTML = `<div class="visitor-label">${v.icon} ${v.name}</div>`;

  if(v.name === "사교도") {
    state.sanity = Math.max(0, state.sanity - 15);
    toast("불길한 사교도의 기운에 정신력이 크게 흔들립니다!");
  } else if(v.name === "약탈자들") {
    state.sanity = Math.max(0, state.sanity - 20);
    toast("위험한 약탈자들의 모습에 공포심이 차오릅니다!");
  }
  checkGameOver();
  showTrade();
  render();
}

function showTrade(){
  const v = state.visitor;
  showModal(`
    <h2>${v.icon} ${v.name}</h2>
    <p>커튼을 열자 상대의 정체가 드러났다.</p>
    <div class="trade-list">
      <div class="trade-box"><h4>상대가 주는 것</h4><p>${v.offer}</p></div>
      <div class="trade-box"><h4>상대가 원하는 것</h4><p>${v.need}</p></div>
    </div>
    <div class="choice-row">
      <button class="choice primary" onclick="completeTrade()">거래하기</button>
      <button class="choice" onclick="finishVisit()">돌려보내기</button>
    </div>`);
}

function completeTrade(){
  const v = state.visitor;
  if(state.food < 10 || state.water < 8){
    showModal(`<h2>거래할 자원이 부족하다</h2><p>식량 또는 물이 부족해 거래를 성사시킬 수 없다. (요청: 식량 10, 물 8)</p><div class="choice-row"><button class="choice primary" onclick="finishVisit()">확인</button></div>`);
    return;
  }
  state.food = Math.max(0, state.food - 10); 
  state.water = Math.max(0, state.water - 8);
  
  if(v.name==="신정부"){state.items.medicines += 2; state.stone += 1;}
  if(v.name==="군인"){state.items.equipment += 1; state.stone += 2;}
  if(v.name==="초능력자 집단"){state.stone += 2; state.items.equipment += 1;}
  if(v.name==="사교도"){state.stone += 3;}
  if(v.name==="민간집단"){state.items.tobacco += 1; state.stone += 3;}
  if(v.name==="약탈자들"){state.items.alcohol += Math.random()<.6?1:0; state.stone += 1;}
  if(v.name==="구원교"){state.items.medicines += 3;}
  
  state.sanity = Math.max(0, state.sanity - 5);
  showModal(`<h2>거래 완료</h2><p>${v.name}과(와)의 거래가 완료되었다.<br>외부인과의 접촉으로 정신력이 소모되었다. (정신력 -5)</p><div class="choice-row"><button class="choice primary" onclick="finishVisit()">커튼 닫기</button></div>`);
  render();
}

function finishVisit(){
  $("doorArea").classList.remove("open");
  $("visitor").innerHTML = "";
  state.visitor = null;
  state.knocking = false;
  closeModal();
  
  if(state.visitorCount >= 3){
    $("eventText").textContent = "오늘 손님이 모두 찾아왔습니다. 저녁이 되었으니 [침실]을 눌러 하루를 마무리하세요.";
  } else {
    $("eventText").textContent = "쉘터는 다시 조용해졌다. 다음 손님을 기다리는 중...";
    startVisitorTimer();
  }
  render();
}

function ignoreKnock(){
  state.sanity = Math.max(0, state.sanity - 2);
  state.knocking = false;
  state.visitor = null;
  state.ignoreCount++; 
  checkGameOver();
  
  if(state.visitorCount >= 3){
    $("eventText").textContent = "노크 소리가 멈췄다. 오늘의 모든 방문이 끝났다. [침실]을 눌러 잠드세요.";
  } else {
    $("eventText").textContent = "노크 소리가 멈췄다. 누군가는 떠났다.";
    startVisitorTimer();
  }
  render();
}

function useItem(itemType){
  if(itemType === 'food'){
    if(state.food <= 0){ toast("식량이 부족합니다."); return; }
    state.food--;
    state.hunger = Math.min(100, state.hunger + 5);
    toast("식량을 사용해 허기를 조금 채웠습니다. (허기 +5)");
  } else if(itemType === 'water'){
    if(state.water <= 0){ toast("물이 부족합니다."); return; }
    state.water--;
    state.thirst = Math.min(100, state.thirst + 5);
    toast("물을 마셔 목마름을 조금 축였습니다. (목마름 +5)");
  } else if(itemType === 'medicines'){
    if(state.items.medicines <= 0){ toast("보유한 의약품이 없습니다."); return; }
    state.items.medicines--;
    state.sanity = Math.min(100, state.sanity + 20);
    toast("의약품을 복용해 정신력이 맑아졌습니다.");
  } else if(itemType === 'tobacco'){
    if(state.items.tobacco <= 0){ toast("보유한 담배가 없습니다."); return; }
    state.items.tobacco--;
    state.thirst = Math.max(0, state.thirst - 5);
    state.sanity = Math.min(100, state.sanity + 15);
    toast("담배를 태우며 안정을 찾았습니다.");
  } else if(itemType === 'alcohol'){
    if(state.items.alcohol <= 0){ toast("보유한 술이 없습니다."); return; }
    state.items.alcohol--;
    state.thirst = Math.min(100, state.thirst + 15);
    state.sanity = Math.max(0, state.sanity - 10);
    toast("술을 마셨습니다. 목마름은 채워졌지만 정신이 혼미해집니다.");
  } else if(itemType === 'equipment'){
    toast("장비는 직접 사용할 수 없는 품목입니다.");
    return;
  }
  render();
}

function triggerFacility(type) {
  if(type === 'water') {
    if(state.cctvStatus.cam1) { toast("⚠️ CAM 01 이상 현상으로 정화실 가동 불가!"); return; }
    if(state.power < 5) { toast("전기가 부족합니다! (필요 전력: 5)"); return; }
    state.power -= 5;
    const gain = Math.floor(6 * state.facilityLevels.water * 0.5);
    state.water += gain;
    toast(`물 정화실 가동: 물 +${gain} 획득`);
  } else if(type === 'food') {
    if(state.cctvStatus.cam2) { toast("⚠️ CAM 02 이상 현상으로 재배실 가동 불가!"); return; }
    if(state.power < 5) { toast("전기가 부족합니다! (필요 전력: 5)"); return; }
    state.power -= 5;
    const gain = Math.floor(6 * state.facilityLevels.food * 0.5);
    state.food += gain;
    toast(`식량 재배실 가동: 식량 +${gain} 획득`);
  } else if(type === 'power') {
    if(state.cctvStatus.cam3) { toast("⚠️ CAM 03 이상 현상으로 발전실 가동 불가!"); return; }
    if(state.stone < 2) { toast("마석이 부족합니다! (필요 마석: 2)"); return; }
    state.stone -= 2;
    const gain = 10 * state.facilityLevels.power;
    state.power += gain;
    toast(`발전실 가동: 전기 +${gain} 획득`);
  }
  render();
}

$("shelterBtn").onclick = () => {
  showModal(`
    <h2>🛠 쉘터 관리 및 시설 강화</h2>
    <p>시설 업그레이드 비용: 마석 2개 + 장비 1개</p>
    
    <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
      <div class="trade-box">
        <h4>💧 물 정화실 (Lv.${state.facilityLevels.water})</h4>
        <p>자동: 물 +${10 * state.facilityLevels.water} | 즉시: 물 +${Math.floor(6 * state.facilityLevels.water * 0.5)} (전력 5 소모)</p>
        <button class="choice primary" style="padding:8px; margin-top:5px; width:100%;" onclick="upgradeFacility('water')">물 정화실 레벨업</button>
      </div>
      
      <div class="trade-box">
        <h4>🌱 식량 재배실 (Lv.${state.facilityLevels.food})</h4>
        <p>자동: 식량 +${10 * state.facilityLevels.food} | 즉시: 식량 +${Math.floor(6 * state.facilityLevels.food * 0.5)} (전력 5 소모)</p>
        <button class="choice primary" style="padding:8px; margin-top:5px; width:100%;" onclick="upgradeFacility('food')">식량 재배실 레벨업</button>
      </div>

      <div class="trade-box">
        <h4>⚙ 발전실 (Lv.${state.facilityLevels.power})</h4>
        <p>자동 전력: +${6 * state.facilityLevels.power} | 즉시 발전: +${10 * state.facilityLevels.power}</p>
        <button class="choice primary" style="padding:8px; margin-top:5px; width:100%;" onclick="upgradeFacility('power')">발전실 레벨업</button>
      </div>
    </div>
  `);
};

function upgradeFacility(type) {
  if(state.stone < 2 || state.items.equipment < 1) {
    toast("재료가 부족합니다! (마석 2개, 장비 1개 필요)");
    return;
  }
  state.stone -= 2;
  state.items.equipment--;
  state.facilityLevels[type]++;
  
  toast("시설 레벨이 상승했습니다!");
  closeModal();
  render();
}

function sleep(){
  if(state.visitorCount < 3) {
    toast("오늘 손님을 모두 맞이하지 않았습니다!");
    return;
  }

  if(visitorTimer) clearTimeout(visitorTimer);
  
  const recovery = state.ignoreCount >= 2 ? 10 : 3;
  state.sanity = Math.min(100, state.sanity + recovery);
  
  let hungerLoss = 15;
  let thirstLoss = 18;

  if (state.sanity < 40) {
    hungerLoss = 25;
    thirstLoss = 30;
    toast("낮은 정신력으로 인해 극심한 갈증에 시달렸습니다!");
  } else if (state.sanity < 70) {
    hungerLoss = 20;
    thirstLoss = 24;
    toast("불안정한 정신으로 에너지가 빠르게 소모됩니다.");
  }

  state.hunger = Math.max(0, state.hunger - hungerLoss);
  state.thirst = Math.max(0, state.thirst - thirstLoss); 
  state.power = Math.max(0, state.power - 6); 

  checkGameOver();

  let requiredPower = 8;
  if(state.power >= requiredPower) {
    state.power -= requiredPower;
    
    if(state.cctvStatus.cam2) {
      toast("⚠️ CAM 02 이상 현상 방치로 식량 생산 실패!");
    } else {
      state.food += 10 * state.facilityLevels.food;
    }

    if(state.cctvStatus.cam1) {
      toast("⚠️ CAM 01 이상 현상 방치로 물 생산 실패!");
    } else {
      state.water += 10 * state.facilityLevels.water;
    }

  } else {
    toast("전기가 부족해 자동 생산이 원활하지 않습니다!");
  }

  if(state.cctvStatus.cam3) {
    toast("⚠️ CAM 03 이상 현상 방치로 전력 회복 실패!");
  } else {
    state.power += 6 * state.facilityLevels.power;
  }

  state.action = 3;
  state.day++;

  if (state.day > 10) {
    showModal(`
      <h1 style="color:#55b9e8; text-align:center;">VICTORY</h1>
      <p style="text-align:center;">10일 동안 무사히 생존해냈습니다!</p>
      <div class="choice-row">
        <button class="choice primary" onclick="location.reload()">다시 시작하기</button>
      </div>
    `);
    return;
  }
  
  state.visitorCount = 0;
  state.ignoreCount = 0;
  state.timeText = "오전";
  state.knocking = false;
  $("doorArea").classList.remove("open");
  state.visitor = null;
  
  let anomalyChance = 0.25 + (1 - state.sanity / 100) * 0.5;

  state.cctvStatus.cam1 = Math.random() < anomalyChance;
  state.cctvStatus.cam2 = Math.random() < anomalyChance;
  state.cctvStatus.cam3 = Math.random() < anomalyChance;

  const events=[
    ["대규모 역병","물과 의약품이 귀해졌다.",-4],
    ["식량난","식량이 귀해졌다.",-5],
    ["전쟁","장비와 마석이 귀해졌다.",-3]
  ];
  if(Math.random() < .45){
    const e = events[Math.floor(Math.random()*events.length)];
    state.sanity = Math.max(0, state.sanity + e[2]);
    $("eventText").innerHTML = `<b>${e[0]}</b><br>${e[1]}`;
  } else {
    $("eventText").textContent = "새로운 사건 없이 하루가 지나갔다. 손님을 기다리는 중...";
  }
  
  render();
  startVisitorTimer();
}

function checkGameOver() {
  if (state.hunger <= 0 || state.thirst <= 0 || state.sanity <= 0) {
    if(visitorTimer) clearTimeout(visitorTimer);
    showModal(`
      <h2 style="color:#ff4d4d;">GAME OVER</h2>
      <p>생존 수치가 바닥나 사망하였습니다.<br>생존 기간: <b>${state.day}일</b></p>
      <div class="choice-row">
        <button class="choice primary" onclick="location.reload()">다시 시작하기</button>
      </div>
    `);
  }
}

function toast(msg){
  $("toast").textContent=msg;
  $("toast").classList.add("show");
  setTimeout(()=>$("toast").classList.remove("show"),1800);
}

$("cctv").onclick = () => {
  openCCTVModal(state.currentCam);
};

function openCCTVModal(camName) {
  state.currentCam = camName;
  const isAnomaly = state.cctvStatus[camName];
  
  let camTitle = "";
  let normalDesc = "";
  let anomalyDesc = "";

  if(camName === 'cam1') {
    camTitle = "CAM 01 : 물 정화실";
    normalDesc = "정상 작동 중. 깨끗한 물이 정수 탱크를 채우고 있습니다.";
    anomalyDesc = "⚠️ [이상 현상] 정수 탱크 안에 정체불명의 형체가 거꾸로 매달려 있습니다!<br>(방치 시 물 정화/생산 불가)";
  } else if(camName === 'cam2') {
    camTitle = "CAM 02 : 식량 재배실";
    normalDesc = "정상 작동 중. 푸른 싹들이 무사히 자라나고 있습니다.";
    anomalyDesc = "⚠️ [이상 현상] 작물들이 사람 손가락 모양으로 뻗어 있습니다!<br>(방치 시 식량 재배/생산 불가)";
  } else if(camName === 'cam3') {
    camTitle = "CAM 03 : 발전실";
    normalDesc = "정상 작동 중. 발전기가 안정적으로 돌아가고 있습니다.";
    anomalyDesc = "⚠️ [이상 현상] 발전기 불빛 속에서 붉은 눈동자들이 노려보고 있습니다!<br>(방치 시 전력 회복 불가)";
  }

  showModal(`
    <h2>📹 CCTV 통합 모니터링</h2>
    <div style="display:flex; gap:6px; margin:10px 0; flex-wrap:wrap;">
      <button class="choice ${camName==='cam1'?'primary':''}" style="padding:8px 4px; font-size:11px;" onclick="openCCTVModal('cam1')">CAM 01</button>
      <button class="choice ${camName==='cam2'?'primary':''}" style="padding:8px 4px; font-size:11px;" onclick="openCCTVModal('cam2')">CAM 02</button>
      <button class="choice ${camName==='cam3'?'primary':''}" style="padding:8px 4px; font-size:11px;" onclick="openCCTVModal('cam3')">CAM 03</button>
    </div>

    <div style="border:2px solid ${isAnomaly ? '#e29ae6' : '#384a4c'}; background:${isAnomaly ? 'linear-gradient(120deg,#1c2929,#24122b)' : 'linear-gradient(#1e3231,#071413)'}; padding:14px; text-align:center; font-family:monospace; min-height:120px; display:flex; flex-direction:column; justify-content:center; align-items:center; border-radius:4px;">
      <h3 style="color:${isAnomaly ? '#e29ae6' : '#77a99c'}; margin-bottom:8px;">${camTitle}</h3>
      <p style="color:${isAnomaly ? '#ffb3ff' : '#a3c1b9'}; font-size:12px; line-height:1.5;">
        ${isAnomaly ? anomalyDesc : normalDesc}
      </p>
    </div>

    <div class="choice-row" style="margin-top:15px;">
      ${isAnomaly ? `<button class="choice primary" style="background:#8b0000; border-color:#ff4d4d;" onclick="purgeCCTV('${camName}')">🔥 정보 소각 (이상 제거)</button>` : `<span style="color:#91a0aa; font-size:12px; align-self:center;">현재 구역은 안전합니다.</span>`}
      <button class="choice" onclick="closeModal()">모니터 끄기</button>
    </div>
  `);
}

function purgeCCTV(camName) {
  state.cctvStatus[camName] = false;
  state.sanity = Math.min(100, state.sanity + 5);
  toast("정보를 소각하여 카메라 환영을 지웠습니다! (정신력 +5)");
  openCCTVModal(camName);
  render();
}

$("infoBtn").onclick = () => showModal(`
  <div style="max-height: 70vh; overflow-y: auto; padding-right: 5px;">
    <h2>📖 아포칼립스 트레이더 가이드</h2>
    
    <h3 style="color:#55b9e8; margin-top:15px;">1. 승리 조건 및 자원</h3>
    <p>
      - <b>승리</b>: 10일 동안 생존 후 11일째를 맞이하면 클리어됩니다.<br>
      - <b>자원</b>: 물, 식량, 전력, 마석<br>
      - <b>생존 생산</b>: 밤새 전기를 소모해 자동 생산 및 개별 조작으로 수급 가능합니다.
    </p>

    <h3 style="color:#55b9e8; margin-top:15px;">2. CCTV 및 이상 현상</h3>
    <p>
      - <b>정신력 연동</b>: 정신력이 낮을수록 이상 현상이 자주 발생합니다.<br>
      - <b>방치 페널티</b>: CAM 01~03 이상 방치 시 자원 및 전력 생산이 차단됩니다.
    </p>

    <h3 style="color:#55b9e8; margin-top:15px;">3. 생존 및 방문자</h3>
    <p>
      - 허기, 목마름, 정신력이 0이 되면 게임 오버.<br>
      - 하루 3번 방문하는 손님들과 거래해 생존하세요.
    </p>
  </div>
`);

document.querySelectorAll(".facility").forEach(btn => {
  const facilityType = btn.getAttribute("data-facility");
  if(facilityType === 'water' || facilityType === 'food' || facilityType === 'power') {
    btn.onclick = () => triggerFacility(facilityType);
  } else if(facilityType === 'bed') {
    btn.onclick = () => sleep(); 
  } else {
    btn.onclick = () => showModal(`<h2>${btn.innerText}</h2><p>이 시설은 추후 업데이트될 예정입니다.</p><div class="choice-row"><button class="choice primary" onclick="closeModal()">닫기</button></div>`);
  }
});

document.addEventListener("keydown",e=>{
  if(e.key.toLowerCase()==="n") knock();
});

function showStartScreen() {
  showModal(`
    <h1 style="text-align:center; letter-spacing:1px; color:#55b9e8; font-size:20px;">APOCALYPSE TRADER</h1>
    <p style="text-align:center; color:#91a0aa;">10일 동안 쉘터를 방어하고 생존하여 살아남으세요.</p>
    <div class="choice-row" style="margin-top:20px;">
      <button class="choice primary" style="padding:12px; font-size:15px; width:100%;" onclick="startGame()">게임 시작</button>
    </div>
  `);
}

function startGame() {
  state.isStarted = true;
  closeModal();
  render();
  startVisitorTimer();
  toast("게임이 시작되었습니다. 손님을 기다리는 중...");
}

showStartScreen();