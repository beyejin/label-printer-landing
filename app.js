const data={a:{prime:'친구와 취향이 통하는 순간',description:'폰, 카드, 케이블에 우리만 아는 문구를 붙여보세요. 매일 쓰는 물건에 함께하는 취향이 남아요.',heading:'우리끼리만 아는 한 줄,',heading2:'매일 쓰는 물건에.',body:'친구와 맞춘 애칭, 우리 팀의 한마디. 같은 문구를 나눠 붙이면 평범한 물건에도 우리만의 이야기가 생겨요.',end:'우리의 취향을, 한 줄로.'},b:{prime:'내 취향이 눈에 띄는 순간',description:'폰, 카드, 케이블에 내가 고른 문구를 붙여보세요. 매일 쓰는 물건에서 내 스타일이 드러나요.',heading:'어디서 샀냐고 묻고 싶은,',heading2:'내 취향의 한 줄.',body:'좋아하는 문구, 나를 표현하는 한마디. 직접 고른 문구를 붙여 평범한 물건을 나만의 소품으로 바꿔보세요.',end:'내 스타일을, 한 줄로.'}};
const params=new URLSearchParams(location.search);const variant=params.get('v')==='b'?'b':'a';const copy=data[variant];
document.querySelectorAll('[data-copy]').forEach(el=>el.textContent=copy[el.dataset.copy]);
if(params.get('export')==='1')document.body.classList.add('export');
document.querySelector('#label-text').addEventListener('input',event=>{document.querySelector('#label-preview').textContent=event.target.value.trim()||'내 취향 100%';});
document.querySelectorAll('[data-buy]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#purchase-note').textContent='수업용 페이지입니다. 실제 결제는 진행되지 않아요.';document.querySelector('#purchase-note').hidden=false;}));
