// =============================================================
// save.js — 저장과 불러오기
// 지금은 이 컴퓨터(브라우저)에만 저장합니다.
// 구글 로그인 중이면 cloud.js가 계정에도 함께 저장합니다.
// =============================================================

const Save = {
  KEY: "cozyroom-save-v2",

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
      look: { hair: "short", hairColor: "brown", outfit: "basic" }, // 캐릭터 꾸미기
      outfits: [],            // 산 옷
      pets: [],               // 데려온 반려동물
      pet: null,              // 함께 있는 반려동물
      profile: { name: "", city: null }, // 캐릭터 이름, 사는 곳 (실제 날씨용)
      profileDone: false,     // 처음 시작 설정을 마쳤는지
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

  save(data) {
    if (this.locked) return;
    data.savedAt = Date.now();
    if (this.onSave) this.onSave();
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      // 저장이 막힌 환경(시크릿 창 등)에서는 조용히 넘어갑니다.
    }
  },
};
