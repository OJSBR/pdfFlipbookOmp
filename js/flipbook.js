/* Leitor "folhear": PDF.js desenha cada pagina em canvas, o StPageFlip monta as
   folhas. Pontos de projeto que nao sao obvios:

   - As paginas sao desenhadas SOB DEMANDA e o cache de canvas tem teto: um PDF
     de centenas de paginas nao cabe na memoria se tudo for rasterizado.
   - Zoom, redimensionamento e tela cheia REMONTAM o livro. A largura/altura do
     StPageFlip so entram no construtor; nao ha API para redimensionar em voo.
     Remontar preserva a pagina atual e custa pouco, porque so as vizinhas sao
     redesenhadas.
   - O StPageFlip MOVE as divs para dentro da estrutura dele (.stf__block) em vez
     de clonar. Nao dependemos disso: procuramos a folha pelo data-page a partir
     da raiz do livro e, se nao acharmos, caimos para o documento inteiro e
     avisamos uma vez. Se uma versao futura passar a clonar, o leitor degrada com
     recado em vez de desenhar em branco calado. */
(function () {
	'use strict';

	var cfg = window.PDF_FLIPBOOK || {};
	var T = cfg.textos || {};
	var elLivro = document.getElementById('flip_book');
	var elArea = document.querySelector('.flip_area');
	var elStatus = document.getElementById('flip_status');
	var elPos = document.getElementById('flip_pos');
	var elZoom = document.getElementById('flip_zoom_nivel');

	var VIZINHAS = 2;         // paginas desenhadas de cada lado da atual
	var MAX_CACHE = 14;       // canvas mantidos em memoria (teto real de RAM)
	var TETO_PAGINAS = 1000;  // acima disto o folhear nao compensa
	var DPR_MAX = 2;
	var ZOOM_MIN = 0.5, ZOOM_MAX = 2.5, ZOOM_PASSO = 0.25;

	var doc = null, flip = null, total = 0, vpBase = null;
	var zoom = 1, medidasAtuais = null;
	var cache = new Map();    // n -> canvas ja renderizado
	var usados = [];          // ordem de uso, para descartar os mais antigos
	var avisouFallback = false;
	var remontando = false;

	function status(msg) {
		elStatus.textContent = msg || '';
		elStatus.style.display = msg ? '' : 'none';
	}

	/* ---------- medidas ---------- */

	function calcularMedidas() {
		var retrato = elArea.clientWidth < 700;
		var colunas = retrato ? 1 : 2;
		var maxL = Math.floor(elArea.clientWidth / colunas) - 10;
		var maxA = elArea.clientHeight - 10;
		var escala = Math.min(maxL / vpBase.width, maxA / vpBase.height) * zoom;
		return {
			largura: Math.max(60, Math.floor(vpBase.width * escala)),
			altura: Math.max(90, Math.floor(vpBase.height * escala)),
			retrato: retrato
		};
	}

	/* ---------- paginas ---------- */

	function elementoPagina(n) {
		var sel = '.flip_page[data-page="' + n + '"]';
		var el = elLivro.querySelector(sel);
		if (el) return el;
		el = document.querySelector(sel);   // rede de seguranca
		if (el && !avisouFallback) {
			avisouFallback = true;
			if (window.console) console.warn('[pdfFlipbook] folha fora da raiz do livro; a biblioteca mudou de comportamento.');
		}
		return el;
	}

	function marcarUso(n) {
		var i = usados.indexOf(n);
		if (i !== -1) usados.splice(i, 1);
		usados.push(n);
		while (usados.length > MAX_CACHE) {
			var velho = usados.shift();
			var c = cache.get(velho);
			if (c) {
				c.width = c.height = 0;      // libera o bitmap
				cache.delete(velho);
			}
			var alvo = elementoPagina(velho);
			if (alvo) alvo.innerHTML = '<span class="flip_page_num">' + velho + '</span>';
		}
	}

	function desenhar(n) {
		if (n < 1 || n > total) return Promise.resolve();
		var alvo = elementoPagina(n);
		if (!alvo) return Promise.resolve();
		if (cache.has(n) && alvo.firstElementChild === cache.get(n)) { marcarUso(n); return Promise.resolve(); }

		return doc.getPage(n).then(function (pagina) {
			var dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
			var escala = (medidasAtuais.largura / vpBase.width) * dpr;
			var vp = pagina.getViewport({ scale: escala });
			var canvas = document.createElement('canvas');
			canvas.width = Math.floor(vp.width);
			canvas.height = Math.floor(vp.height);
			canvas.style.width = '100%';
			canvas.style.height = '100%';
			return pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
				.then(function () {
					var el = elementoPagina(n);
					if (!el) return;
					el.innerHTML = '';
					el.appendChild(canvas);
					cache.set(n, canvas);
					marcarUso(n);
				});
		}).catch(function () { /* pagina isolada que falhou nao derruba o leitor */ });
	}

	function desenharPerto(atual) {
		for (var i = atual - VIZINHAS; i <= atual + VIZINHAS + 1; i++) desenhar(i);
	}

	function posicao(indice) {
		var p = Math.min((indice || 0) + 1, total);
		elPos.textContent = p + ' ' + (T.de || '/') + ' ' + total;
	}

	/* ---------- montagem / remontagem ---------- */

	/* O destroy() do StPageFlip remove o PROPRIO container do DOM, nao apenas o
	   conteudo. Sem recriar, a remontagem (zoom / resize / tela cheia) montava
	   tudo dentro de um no orfao e a tela ficava vazia, sem erro no console. */
	function garantirContainer() {
		if (!elLivro || !document.body.contains(elLivro)) {
			elLivro = document.createElement('div');
			elLivro.id = 'flip_book';
			elArea.insertBefore(elLivro, elArea.firstChild);
		}
		return elLivro;
	}

	function montar(paginaInicial) {
		medidasAtuais = calcularMedidas();
		garantirContainer();
		elLivro.innerHTML = '';
		cache.clear(); usados = [];

		for (var n = 1; n <= total; n++) {
			var div = document.createElement('div');
			div.className = 'flip_page';
			div.setAttribute('data-page', n);
			div.innerHTML = '<span class="flip_page_num">' + n + '</span>';
			elLivro.appendChild(div);
		}

		flip = new St.PageFlip(elLivro, {
			width: medidasAtuais.largura,
			height: medidasAtuais.altura,
			size: 'fixed',
			maxShadowOpacity: 0.5,
			showCover: true,
			mobileScrollSupport: true,
			usePortrait: true
		});
		flip.loadFromHTML(elLivro.querySelectorAll('.flip_page'));
		flip.on('flip', function (e) { posicao(e.data); desenharPerto(e.data + 1); });

		if (paginaInicial && paginaInicial > 1) {
			try { flip.turnToPage(Math.min(paginaInicial - 1, total - 1)); } catch (e) {}
		}
		var atual = (flip.getCurrentPageIndex ? flip.getCurrentPageIndex() : 0) + 1;
		posicao(atual - 1);
		desenharPerto(atual);
		atualizarZoomLabel();
	}

	function remontar() {
		if (remontando || !flip) return;
		remontando = true;
		var atual = 1;
		try { atual = (flip.getCurrentPageIndex() || 0) + 1; } catch (e) {}
		try { flip.destroy(); } catch (e) {}
		flip = null;
		montar(atual);
		remontando = false;
	}

	function atualizarZoomLabel() {
		if (elZoom) elZoom.textContent = Math.round(zoom * 100) + '%';
	}

	function aplicarZoom(delta) {
		var novo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + delta));
		if (novo === zoom) return;
		zoom = novo;
		remontar();
	}

	/* ---------- tela cheia ---------- */

	function emTelaCheia() {
		return !!(document.fullscreenElement || document.webkitFullscreenElement);
	}
	function alternarTelaCheia() {
		var alvo = document.documentElement;
		if (!emTelaCheia()) {
			(alvo.requestFullscreen || alvo.webkitRequestFullscreen || function () {}).call(alvo);
		} else {
			(document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
		}
	}

	/* ---------- inicio ---------- */

	if (!window.pdfjsLib || !window.St) { status(T.erro); return; }
	pdfjsLib.GlobalWorkerOptions.workerSrc = cfg.workerUrl;

	status(T.carregando || '');
	pdfjsLib.getDocument(cfg.pdfUrl).promise.then(function (d) {
		doc = d;
		total = d.numPages;
		if (total > TETO_PAGINAS) {
			status((T.grandeDemais || '').replace('{n}', total).replace('{teto}', TETO_PAGINAS));
			return null;
		}
		return d.getPage(1);
	}).then(function (p1) {
		if (!p1) return;
		vpBase = p1.getViewport({ scale: 1 });
		status('');
		montar(1);

		document.getElementById('flip_prev').addEventListener('click', function () { flip && flip.flipPrev(); });
		document.getElementById('flip_next').addEventListener('click', function () { flip && flip.flipNext(); });
		document.getElementById('flip_zoom_out').addEventListener('click', function () { aplicarZoom(-ZOOM_PASSO); });
		document.getElementById('flip_zoom_in').addEventListener('click', function () { aplicarZoom(ZOOM_PASSO); });
		document.getElementById('flip_full').addEventListener('click', alternarTelaCheia);

		document.addEventListener('keydown', function (ev) {
			if (ev.target && /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)) return;
			if (ev.key === 'ArrowLeft') { flip && flip.flipPrev(); }
			else if (ev.key === 'ArrowRight') { flip && flip.flipNext(); }
			else if (ev.key === '+' || ev.key === '=') { aplicarZoom(ZOOM_PASSO); }
			else if (ev.key === '-') { aplicarZoom(-ZOOM_PASSO); }
			else if (ev.key.toLowerCase() === 'f') { alternarTelaCheia(); }
		});

		// Redimensionar e girar o aparelho remontam o livro (com folga, para nao
		// remontar a cada pixel durante o arrasto da janela).
		var t = null;
		function agendarRemontagem() { clearTimeout(t); t = setTimeout(remontar, 250); }
		window.addEventListener('resize', agendarRemontagem);
		window.addEventListener('orientationchange', agendarRemontagem);
		document.addEventListener('fullscreenchange', agendarRemontagem);
		document.addEventListener('webkitfullscreenchange', agendarRemontagem);
	}).catch(function (e) {
		status((T.erro || 'erro') + ' (' + (e && e.message ? e.message : e) + ')');
	});
})();
