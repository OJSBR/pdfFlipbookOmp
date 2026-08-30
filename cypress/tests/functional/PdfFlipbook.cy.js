/**
 * @file cypress/tests/functional/PdfFlipbook.cy.js
 *
 * Copyright (c) 2026 OJSBR (https://ojsbr.com.br)
 * Distributed under the GNU GPL v3.
 *
 * Roda contra o conjunto de dados de teste da PKP por padrao. Para apontar para
 * outra instalacao, passe as variaveis:
 *   npx cypress run --spec 'plugins/generic/pdfFlipbook/cypress/tests/functional/*.cy.js' \
 *     --env contextPath=minhaeditora,adminUsername=admin,adminPassword=senha
 */

describe('pdfFlipbook plugin tests', function () {
	const contexto = Cypress.env('contextPath') || 'publicknowledge';
	const usuario = Cypress.env('adminUsername') || 'admin';
	const senha = Cypress.env('adminPassword') || 'admin';
	const LIMITE = 10;   // quantos livros do catalogo abrir procurando um PDF

	it('Enables the plugin', function () {
		cy.login(usuario, senha, contexto);

		abrirGradeDePlugins();

		// Idempotente de proposito: a suite precisa poder rodar duas vezes seguidas
		// sem que a segunda execucao DESLIGUE o plugin que a primeira ligou.
		cy.get('input[id^="select-cell-pdfflipbookplugin-enabled"]').as('ligar');
		cy.get('@ligar').then(($el) => {
			if (!$el.is(':checked')) {
				cy.get('@ligar').click();
				cy.get('div:contains(\'The plugin "PDF Flipbook" has been enabled.\')');
				cy.waitJQuery();
			}
		});
		cy.reload();
		abrirGradeDePlugins();
		cy.get('input[id^="select-cell-pdfflipbookplugin-enabled"]').should('be.checked');
	});

	it('Offers the flipbook next to the ordinary PDF link and renders pages', function () {
		abrirLivroCom('a.flip_open_btn', 'a PDF publication format', () => {
			// O botao e irmao do link de PDF, nao um substituto: o leitor escolhe.
			cy.get('a.flip_open_btn').should('have.length.at.least', 1);
			cy.get('a[href*="/catalog/view/"]').should('have.length.at.least', 1);

			cy.get('a.flip_open_btn').first().click();

			cy.get('body').should('have.class', 'pdf_flipbook');
			cy.get('.flip_area').should('be.visible');
			// O contador so sai de "—" depois que o PDF.js abriu o documento e a
			// primeira folha foi desenhada; e o sinal mais barato de que renderizou.
			cy.get('#flip_pos', {timeout: 60000}).should('not.contain', '—');
			cy.get('#flip_book .stf__item', {timeout: 60000}).should('have.length.at.least', 1);

			// O modo PDF tradicional continua a um clique de distancia.
			cy.get('a.flip_link').should('have.attr', 'href').and('contain', '/catalog/view/');
		});
	});

	it('Navigates, zooms and returns to the book page', function () {
		abrirLivroCom('a.flip_open_btn', 'a PDF publication format', () => {
			cy.get('a.flip_open_btn').first().click();
			cy.get('#flip_pos', {timeout: 60000}).should('not.contain', '—');

			cy.get('#flip_pos').invoke('text').then((inicio) => {
				cy.get('#flip_next').click();
				cy.get('#flip_pos').should('not.have.text', inicio);
				cy.get('#flip_prev').click();
				cy.get('#flip_pos').should('have.text', inicio);
			});

			// O zoom desmonta e remonta o StPageFlip; ja quebrou aqui uma vez,
			// remontando num no orfao e deixando a tela em branco SEM erro no console.
			cy.get('#flip_zoom_in').click();
			cy.get('#flip_zoom_nivel').should('not.have.text', '100%');
			cy.get('#flip_book .stf__item', {timeout: 60000}).should('have.length.at.least', 1);
			cy.get('#flip_zoom_out').click();
			cy.get('#flip_zoom_nivel').should('have.text', '100%');

			cy.get('header.header_viewable_file a.return').click();
			cy.url().should('contain', '/catalog/book/');
		});
	});

	/**
	 * Leva ate a grade de plugins. Precisa ser chamado DE NOVO depois de cada
	 * reload: a pagina volta para a aba Appearance, e o conteudo das outras abas
	 * continua no DOM, apenas escondido — entao o seletor da grade ainda encontra
	 * o elemento e o clique nao faz nada, sem erro nenhum.
	 */
	function abrirGradeDePlugins() {
		cy.get('nav').contains('Settings').click();
		// Ensure submenu item click despite animation
		cy.get('nav').contains('Website').click({force: true});
		cy.get('button[id="plugins-button"]').click();
	}

	/**
	 * Abre o primeiro livro do catalogo que satisfaz o seletor. Percorrer o
	 * catalogo em vez de cravar um id mantem a suite util em qualquer base:
	 * o conjunto da PKP muda de versao para versao.
	 */
	function abrirLivroCom(seletor, descricao, aoAchar) {
		cy.visit('index.php/' + contexto + '/en/catalog');
		cy.get('a[href*="/catalog/book/"]').then(($as) => {
			const livros = Cypress._.uniq([...$as].map((a) => a.getAttribute('href')));
			const teto = Math.min(livros.length, LIMITE);
			if (livros.length > LIMITE) {
				cy.log(`catalogo com ${livros.length} livros; olhando so os ${LIMITE} primeiros`);
			}
			const tentar = (i) => {
				expect(i, `catalog has a book with ${descricao} among the first ${teto}`).to.be.lessThan(teto);
				cy.visit(livros[i]);
				cy.get('body').then(($b) => ($b.find(seletor).length ? aoAchar() : tentar(i + 1)));
			};
			tentar(0);
		});
	}
});
