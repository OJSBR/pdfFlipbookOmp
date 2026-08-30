{**
 * Leitor "folhear" (flipbook) de PDF. Reaproveita o mesmo cabecalho do leitor
 * nativo (.header_viewable_file) para Voltar / Baixar ficarem no lugar de sempre.
 *}
<!DOCTYPE html>
<html lang="{$currentLocale|replace:"_":"-"}" xml:lang="{$currentLocale|replace:"_":"-"}">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset={$defaultCharset|escape}" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>{$submissionFile->getLocalizedData('name')|escape}</title>
	{load_header context="frontend" headers=$headers}
	{load_stylesheet context="frontend" stylesheets=$stylesheets}
	<link rel="stylesheet" href="{$pluginUrl}/styles/flipbook.css" type="text/css" />
</head>
<body class="pkp_page_{$requestedPage|escape} pkp_op_{$requestedOp|escape} pdf_flipbook">

	<header class="header_viewable_file">
		<a href="{$voltarUrl}" class="return">
			<span class="pkp_screen_reader">{translate key="common.back"}</span>
		</a>
		<span class="title">{$submissionFile->getLocalizedData('name')|escape}</span>
		<a href="{$downloadUrl|default:$pdfUrl|escape}" class="download" download>
			<span class="label">{translate key="common.download"}</span>
		</a>
	</header>

	<div class="flip_toolbar">
		<button type="button" id="flip_prev" class="flip_btn" aria-label="{translate key="plugins.generic.pdfFlipbook.anterior"}">&lsaquo;</button>
		<span id="flip_pos" class="flip_pos" role="status" aria-live="polite">&mdash;</span>
		<button type="button" id="flip_next" class="flip_btn" aria-label="{translate key="plugins.generic.pdfFlipbook.proxima"}">&rsaquo;</button>
		<span class="flip_sep"></span>
		<span class="flip_grupo">
			<button type="button" id="flip_zoom_out" class="flip_btn" aria-label="{translate key="plugins.generic.pdfFlipbook.reduzir"}">&minus;</button>
			<span id="flip_zoom_nivel" class="flip_zoom_nivel">100%</span>
			<button type="button" id="flip_zoom_in" class="flip_btn" aria-label="{translate key="plugins.generic.pdfFlipbook.ampliar"}">+</button>
		</span>
		<button type="button" id="flip_full" class="flip_btn flip_btn_texto">{translate key="plugins.generic.pdfFlipbook.telaCheia"}</button>
		<span class="flip_sep"></span>
		<a class="flip_btn flip_btn_texto flip_link" href="{$pdfViewerUrl}">{translate key="plugins.generic.pdfFlipbook.modoPdf"}</a>
	</div>

	<div class="flip_area">
		<div id="flip_book"></div>
		<div id="flip_status" class="flip_status">{translate key="plugins.generic.pdfFlipbook.carregando"}</div>
	</div>

	<script src="{$pluginUrl}/js/lib/pdfjs/pdf.js"></script>
	<script src="{$pluginUrl}/js/lib/page-flip.js"></script>
	{capture assign="txtErro"}{translate key="plugins.generic.pdfFlipbook.erro"}{/capture}
	{capture assign="txtDe"}{translate key="plugins.generic.pdfFlipbook.de"}{/capture}
	{capture assign="txtCarregando"}{translate key="plugins.generic.pdfFlipbook.carregando"}{/capture}
	{capture assign="txtGrande"}{translate key="plugins.generic.pdfFlipbook.grandeDemais"}{/capture}
	{capture assign="urlWorker"}{$pluginUrl}/js/lib/pdfjs/pdf.worker.js{/capture}
	<script>
		window.PDF_FLIPBOOK = {
			pdfUrl: {$pdfUrl|json_encode nofilter},
			workerUrl: {$urlWorker|json_encode nofilter},
			textos: {
				erro: {$txtErro|json_encode nofilter},
				de: {$txtDe|json_encode nofilter},
				carregando: {$txtCarregando|json_encode nofilter},
				grandeDemais: {$txtGrande|json_encode nofilter}
			}
		};
	</script>
	<script src="{$pluginUrl}/js/flipbook.js"></script>
</body>
</html>
