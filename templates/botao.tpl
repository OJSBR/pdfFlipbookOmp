{**
 * Acrescenta um botao "Folhear" ao lado de cada link de PDF da pagina do livro.
 * Feito em JS porque o OMP nao oferece hook dentro de downloadLink.tpl.
 *}
{capture assign="rotuloFolhear"}{translate key="plugins.generic.pdfFlipbook.folhear"}{/capture}
{capture assign="tituloFolhear"}{translate key="plugins.generic.pdfFlipbook.folhearTitulo"}{/capture}
<script>
(function () {
	var PARAM = '{$pdfFlipbookParam|escape:"javascript"}';
	function decorar() {
		var links = document.querySelectorAll('a[href*="/catalog/view/"]');
		Array.prototype.forEach.call(links, function (a) {
			if (a.dataset.flipDone) return;
			a.dataset.flipDone = '1';
			var rotulo = (a.textContent || '').toUpperCase();
			if (rotulo.indexOf('PDF') === -1) return;   // so nos formatos PDF
			var b = document.createElement('a');
			// Copia as classes do link vizinho antes de acrescentar a propria. O
			// vizinho e o link de PDF do OMP (cmp_download_link), que e o que cada
			// tema estiliza como botao. Sem isso o botao so parecia botao onde o
			// tema por acaso estilizasse QUALQUER link — na caixa de formatos do
			// livro sim, na lista de capitulos nao, e ali ele saia como texto
			// sublinhado no meio de botoes. Herdando a classe do irmao, ele fica
			// igual ao vizinho em qualquer contexto e em qualquer tema.
			b.className = ((a.className || '') + ' flip_open_btn').trim();
			b.href = a.href + (a.href.indexOf('?') === -1 ? '?' : '&') + PARAM;
			b.textContent = {$rotuloFolhear|json_encode nofilter};
			b.title = {$tituloFolhear|json_encode nofilter};
			a.parentNode.insertBefore(b, a.nextSibling);
		});
	}
	if (document.readyState !== 'loading') decorar();
	else document.addEventListener('DOMContentLoaded', decorar);
})();
</script>
<style>
/* O botao vive dentro do mesmo bloco dos formatos (.pub_format_*), onde o tema
   estiliza QUALQUER link como botao de download — inclusive com a seta de baixar
   no ::before. Herdar isso deixava o "Folhear" com icone de download (mentira: ele
   nao baixa nada) e deslocado 8px por causa da margem. Aqui so corrigimos essas
   duas heranças e trocamos o icone pelo de livro; o resto do visual segue o tema,
   para o botao ficar irmao dos outros e nao um corpo estranho. */
.flip_open_btn {
	margin-left: 0 !important;
	margin-top: .35rem !important;
	display: inline-block;
}
/* A FONTE VAI DECLARADA AQUI, nao herdada. Na caixa de formatos do livro o tema
   ja aplica FontAwesome aos links de download, e por isso o icone aparecia certo
   ali. Mas o botao tambem e injetado na LISTA DE CAPITULOS, dentro de .files, que
   nao recebe esse tratamento: la o ::before herdava a fonte do corpo (Noto Serif),
   nao encontrava o glifo e desenhava um quadradinho. Declarar a fonte no proprio
   pseudo-elemento faz o icone valer em qualquer contexto em que o botao apareca. */
.flip_open_btn:before {
	font-family: FontAwesome !important;
	font-weight: normal;
	font-style: normal;
	font-variant: normal;
	text-rendering: auto;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	margin-right: .35rem;
	content: "\f02d" !important;   /* livro, no lugar da seta de download */
}
</style>
