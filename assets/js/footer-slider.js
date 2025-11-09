// ========================================
// Privacy Modal + Footer Slider Global Init
// ========================================
(function(){
	// Privacy Modal
	const modal = document.getElementById('privacyModal');
	const openBtn = document.getElementById('openPrivacyModal');
	const closeBtn = document.getElementById('btnPrivacyClose');
	function openModal(){ if(!modal) return; modal.style.display='flex'; modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); }
	function closeModal(){ if(!modal) return; modal.style.display='none'; modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); localStorage.setItem('privacyModalSeen','true'); }
	if (openBtn) openBtn.addEventListener('click', e=>{ e.preventDefault(); openModal(); });
	if (closeBtn) closeBtn.addEventListener('click', closeModal);
	modal?.addEventListener('click', e=>{ if (e.target === modal) closeModal(); });
	document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal?.classList.contains('is-open')) closeModal(); });
	if (!localStorage.getItem('privacyModalSeen')) setTimeout(openModal, 500);

	// Footer Slider (dinamik sayıda öğeye uyumlu)
	const track = document.querySelector('.fs-track');
	const prev = document.querySelector('.fs-prev');
	const next = document.querySelector('.fs-next');
	if(track){
		let idx=0, timer=null;
		function count(){ return track.querySelectorAll('.fs-item').length; }
		function apply(){ track.style.transform='translateX(' + (-idx*100) + '%)'; }
		function go(n){ const len=count(); if(!len) return; idx=(n+len)%len; apply(); }
		prev?.addEventListener('click', ()=>go(idx-1));
		next?.addEventListener('click', ()=>go(idx+1));
		function stop(){ if(timer){ clearInterval(timer); timer=null; } }
		function auto(){ stop(); if(count()>1){ timer=setInterval(()=>go(idx+1), 8000); } }
		track.addEventListener('mouseenter', stop); track.addEventListener('mouseleave', auto);
		auto();
		// Dışarıdan yeni öğe ekleme API'sı
		window.appendFooterItems = function appendFooterItems(htmlArray){
			try{
				if(!Array.isArray(htmlArray) || !htmlArray.length) return;
				htmlArray.forEach(function(html){
					const div=document.createElement('div'); div.className='fs-item'; div.innerHTML=String(html); track.appendChild(div);
				});
				if(idx>=count()) idx=0; apply(); auto();
			}catch(e){ console.error('[FooterSlider append]', e); }
		};
	}
})();
