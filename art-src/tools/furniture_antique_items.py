# 엔티크 15종 (GPT 그림 순서대로). 크기: [오른쪽 아래, 왼쪽 아래, 높이]
ITEMS = [
  (0,  'canopyBed',     '캐노피 침대',     'furniture', 360, [24, 16, 30], dict(style='antique', sleep=dict(side=[12, 20], pillow=[19, 8, 8]))),
  (1,  'chesterfield',  '체스터필드 소파', 'furniture', 280, [10, 22, 12], dict(style='antique', seat=dict(z=6, back='-y'), use='chair')),
  (2,  'rockingChair',  '흔들의자',        'furniture', 170, [9, 9, 16],   dict(style='antique', seat=dict(z=6, back='-y'), use='chair')),
  (3,  'teaTable',      '티테이블',        'furniture', 150, [10, 10, 12], dict(style='antique', use='snack')),
  (4,  'vanity',        '화장대',          'furniture', 220, [9, 16, 20],  dict(style='antique')),
  (5,  'rolltopDesk',   '롤톱 책상',       'furniture', 240, [8, 16, 15],  dict(style='antique', use='read')),
  (6,  'grandfatherClock','괘종시계',      'furniture', 200, [6, 6, 26],   dict(style='antique')),
  (7,  'wardrobe',      '엔티크 옷장',     'furniture', 260, [8, 16, 25],  dict(style='antique')),
  (8,  'piano',         '피아노',          'furniture', 400, [9, 18, 17],  dict(style='antique')),
  (9,  'gramophone',    '축음기',          'prop',      160, [7, 7, 15],   dict(kind='goods')),
  (10, 'candelabra',    '촛대',            'prop',       90, [5, 5, 16],   dict(kind='light', use='lamp', light=dict(x=2.5, y=2.5, z=14, radius=40))),
  (11, 'persianRug',    '페르시안 러그',   'prop',      120, [20, 24, 0.5], dict(kind='rug', floor=True)),
  (12, 'goldMirror',    '금테 벽거울',     'prop',      100, [9, 1, 14],   dict(kind='wall', wall=True)),
  (13, 'birdcage',      '새장',            'prop',      110, [6, 6, 16],   dict(kind='goods')),
  (14, 'trunk',         '가죽 트렁크',     'prop',       90, [9, 12, 8],   dict(kind='goods')),
]
