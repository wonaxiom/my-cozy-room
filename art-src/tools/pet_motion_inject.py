import json, re
src=open('/home/user/my-cozy-room/pet-art.js').read()
m=re.search(r'const PET_ART = (\{.*\});\n',src,re.S)
data=json.loads(m.group(1))
new=json.load(open('newframes.json'))
CW=30
def rle(row):
    o='';i=0
    while i<len(row):
        j=i
        while j<len(row) and row[j]==row[i]: j+=1
        n=j-i; o+=(str(n) if n>1 else '')+row[i]; i=j
    return o
for key,grid in new.items():
    kind,f=key.split('_')
    w=len(grid[0]); ox=(CW-w)//2
    data['frames'][kind][f]=[rle('.'*ox+r.ljust(w,'.')+'.'*(CW-ox-w)) for r in grid]
js=src[:m.start(1)]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+src[m.end(1):]
open('/home/user/my-cozy-room/pet-art.js','w').write(js); print('ok',list(data['frames']['cat']))
