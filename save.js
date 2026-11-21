// =============================================================
// save.js — 저장과 불러오기
// 지금은 이 컴퓨터(브라우저)에만 저장합니다.
// 구글 로그인 중이면 cloud.js가 계정에도 함께 저장합니다.
// =============================================================

// 서버에 올리기 전에 글자를 정리: 반쪽만 남은 이모지(짝 없는 서로게이트)와 NUL 글자는 서버가 JSON으로 읽지 못해
// 저장 전체가 실패하므로 지움 (휴대폰 키보드에서 이모지를 지우다 반쪽이 남는 경우가 있음)
function cleanText(t) {
  return String(t).replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "$1").replace(/\u0000/g, "");
}
function cleanForServer(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => (typeof v === "string" ? cleanText(v) : v)));
}

const Save = {
  // 테스트용: 주소에 ?slot=a 를 붙이면 따로 저장합니다. (한 브라우저에서 두 사람을 시험할 때)
  KEY: "cozyroom-save-v2" + (new URLSearchParams(location.search).get("slot") ? "-" + new URLSearchParams(location.search).get("slot") : ""),

  // 처음 시작할 때의 기본값
  defaults() {
    return {
      lampOn: true,
      roomId: "studio",
      layouts: {},     // 방마다 놓은 가구 배치
      coins: 120,      // 처음 받는 코인 (가구 하나를 바로 살 수 있게)
      inventory: {},   // 보관함 { 가구이름: 개수 }
      lastSeen: Date.now(), // 마지막으로 코인을 계산한 시각
      carryMs: 0,      // 1분이 안 돼서 넘어간 시간
      ownedRooms: ["studio"], // 연 방
      ownedStyles: [],        // 산 벽지·바닥
      roomStyles: {},         // 방마다 고른 벽지·바닥 { 방: { wall, floor } }
      look: {},               // 캐릭터 모습 (성별, 머리, 눈, 표정, 옷 등)
      outfits: [],            // 산 옷 (상의·하의)
      pets: [],               // 데려온 반려동물
      pet: null,              // 함께 있는 반려동물
      profile: { name: "", city: null }, // 캐릭터 이름, 사는 곳 (실제 날씨용)
      decoTheme: "basic",     // 배경 장식 (side-deco.js의 DECO_THEMES)
      profileDone: false,     // 처음 시작 설정을 마쳤는지
      friendCode: null,       // 고유번호 (로그인하면 서버에서 받아옴, 친구 추가용)
      owner: null,            // 이 저장 데이터의 주인 (구글 계정 id)
      savedAt: 0,             // 마지막으로 저장한 시각
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return Object.assign(this.defaults(), raw ? JSON.parse(raw) : {});
    } catch (e) {
      return this.defaults();
    }
  },

  locked: false,  // 계정 데이터로 바꿔 끼우는 동안 저장을 멈춤
  onSave: null,   // 저장할 때마다 부를 함수 (계정 저장용)

  // opts.auto: 코인이 쌓이는 것처럼 저절로 일어난 저장. "바꾼 시각(editedAt)"은 그대로 둡니다.
  // 여러 기기를 쓸 때 editedAt이 더 최근인 쪽의 데이터를 씁니다. (cloud.js)
  save(data, opts = {}) {
    if (this.locked) return;
    data.savedAt = Date.now();
    if (!opts.auto) data.editedAt = data.savedAt;
    if (this.onSave) this.onSave();
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      // 저장이 막힌 환경(시크릿 창 등)에서는 조용히 넘어갑니다.
    }
  },
};
