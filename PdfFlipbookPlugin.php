<?php

/**
 * @file plugins/generic/pdfFlipbook/PdfFlipbookPlugin.php
 *
 * Copyright (c) 2026 OJSBR (https://ojsbr.com.br)
 * Distributed under the GNU GPL v3.
 *
 * @class PdfFlipbookPlugin
 *
 * @brief Leitura de PDF em modo "folhear" (flipbook), com StPageFlip + PDF.js.
 *
 *   Convive com o visualizador de PDF nativo em vez de substitui-lo: o mesmo
 *   endereco do leitor responde nos dois modos e o que decide e o parametro
 *   `leitor=folhear`. Sem ele, este plugin nao faz nada e o pdfJsViewer segue
 *   normal — por isso ele se registra ANTES (sequencia normal) do pdfJsViewer
 *   (SEQUENCE_LATE) e so devolve true quando realmente assume a renderizacao.
 *
 *   O flipbook desenha as paginas em canvas: nao tem selecao de texto, busca
 *   nem leitura por leitor de tela. Ele e uma alternativa, nunca o padrao.
 */

namespace APP\plugins\generic\pdfFlipbook;

use APP\core\Application;
use APP\template\TemplateManager;
use PKP\plugins\GenericPlugin;
use PKP\plugins\Hook;

class PdfFlipbookPlugin extends GenericPlugin
{
    public const PARAM = 'leitor';
    public const MODO = 'folhear';

    public function register($category, $path, $mainContextId = null)
    {
        if (!parent::register($category, $path, $mainContextId)) {
            return false;
        }
        if ($this->getEnabled($mainContextId)) {
            // Sequencia normal: roda antes do pdfJsViewer, que e SEQUENCE_LATE.
            Hook::add('CatalogBookHandler::view', [$this, 'viewCallback']);
            // Botao "Folhear" ao lado dos downloads de PDF na pagina do livro.
            Hook::add('Templates::Catalog::Book::Details', [$this, 'botaoCallback']);
        }
        return true;
    }

    public function getDisplayName()
    {
        return __('plugins.generic.pdfFlipbook.displayName');
    }

    public function getDescription()
    {
        return __('plugins.generic.pdfFlipbook.description');
    }

    /**
     * Decide se este plugin assume a renderizacao do arquivo.
     *
     * Isolado do hook de proposito: e a unica regra de negocio do plugin e,
     * separada do request, pode ser coberta por teste sem subir aplicacao.
     *
     * @param string|null $modoPedido valor do parametro `leitor` na requisicao
     * @param string|null $mimetype   mimetype do arquivo da submissao
     */
    public static function assumeArquivo(?string $modoPedido, ?string $mimetype): bool
    {
        return $modoPedido === self::MODO && $mimetype === 'application/pdf';
    }

    /** Assume a renderizacao apenas quando pedirem o modo folhear. */
    public function viewCallback($hookName, $args)
    {
        $submission = & $args[1];
        $publicationFormat = & $args[2];
        $submissionFile = & $args[3];

        $request = Application::get()->getRequest();
        if (!self::assumeArquivo($request->getUserVar(self::PARAM), $submissionFile->getData('mimetype'))) {
            return false;   // deixa o pdfJsViewer trabalhar
        }

        $publication = null;
        foreach ($submission->getData('publications') as $p) {
            if ($p->getId() === $publicationFormat->getData('publicationId')) {
                $publication = $p;
                break;
            }
        }

        $templateMgr = TemplateManager::getManager($request);
        $templateMgr->assign([
            'pluginUrl' => $request->getBaseUrl() . '/' . $this->getPluginPath(),
            'publication' => $publication,
            'submissionFile' => $submissionFile,
            'publicationFormat' => $publicationFormat,
            'publishedSubmission' => $submission,
            'pdfUrl' => $request->url(null, 'catalog', 'download', [
                $submission->getBestId(), $publicationFormat->getId(), $submissionFile->getId(),
            ]),
            'voltarUrl' => $request->url(null, 'catalog', 'book', [$submission->getBestId()]),
            'pdfViewerUrl' => $request->url(null, 'catalog', 'view', [
                $submission->getBestId(), $publicationFormat->getId(), $submissionFile->getId(),
            ]),
        ]);
        $templateMgr->display($this->getTemplateResource('flipbook.tpl'));
        return true;   // assumido: o pdfJsViewer nem chega a rodar
    }

    /** Injeta o botao na pagina do livro, ao lado de cada link de PDF. */
    public function botaoCallback($hookName, $args)
    {
        $templateMgr = & $args[1];
        $output = & $args[2];
        $request = Application::get()->getRequest();
        $templateMgr->assign('pdfFlipbookParam', self::PARAM . '=' . self::MODO);
        $templateMgr->assign('pdfFlipbookPluginUrl', $request->getBaseUrl() . '/' . $this->getPluginPath());
        $output .= $templateMgr->fetch($this->getTemplateResource('botao.tpl'));
        return false;
    }
}
