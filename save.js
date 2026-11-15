// =============================================================
// save.js — 저장과 불러오기
// 지금은 이 컴퓨터(브라우저)에만 저장합니다.
// 4단계에서 여기에 구글 계정 동기화를 추가할 예정입니다.
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

  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      // 저장이 막힌 환경(시크릿 창 등)에서는 조용히 넘어갑니다.
    }
  },
};
