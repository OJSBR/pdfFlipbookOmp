<?php

/**
 * @file plugins/generic/pdfFlipbook/tests/PdfFlipbookPluginTest.php
 *
 * Copyright (c) 2026 OJSBR (https://ojsbr.com.br)
 * Distributed under the GNU GPL v3.
 *
 * @class PdfFlipbookPluginTest
 *
 * @brief Cobre a unica regra de negocio do plugin (quando ele assume o arquivo)
 *        e a integridade dos locales, que e onde este tipo de plugin quebra em
 *        silencio: no OJS/OMP 3.5 uma chave sem traducao vira ##chave## na tela
 *        em vez de cair no ingles.
 */

namespace APP\plugins\generic\pdfFlipbook\tests;

use APP\plugins\generic\pdfFlipbook\PdfFlipbookPlugin;
use PKP\tests\PKPTestCase;

class PdfFlipbookPluginTest extends PKPTestCase
{
    private const DIR = __DIR__ . '/..';

    /** So assume PDF, e so quando o modo folhear foi pedido. */
    public function testAssumeApenasPdfNoModoFolhear(): void
    {
        $this->assertTrue(PdfFlipbookPlugin::assumeArquivo('folhear', 'application/pdf'));
    }

    /** Sem o parametro, o visualizador nativo do PKP tem de seguir intacto. */
    public function testNaoAssumeSemOParametro(): void
    {
        $this->assertFalse(PdfFlipbookPlugin::assumeArquivo(null, 'application/pdf'));
        $this->assertFalse(PdfFlipbookPlugin::assumeArquivo('', 'application/pdf'));
        $this->assertFalse(PdfFlipbookPlugin::assumeArquivo('outro', 'application/pdf'));
    }

    /** EPUB, audio e qualquer outro tipo nao sao deste plugin. */
    public function testNaoAssumeOutrosTipos(): void
    {
        foreach (['application/epub+zip', 'audio/mpeg', 'text/html', '', null] as $mime) {
            $this->assertFalse(
                PdfFlipbookPlugin::assumeArquivo('folhear', $mime),
                'nao deveria assumir mimetype ' . var_export($mime, true)
            );
        }
    }

    /** Todo locale declarado precisa ter TODAS as chaves do ingles. */
    public function testTodosOsLocalesTemTodasAsChaves(): void
    {
        $chavesEn = array_keys($this->chavesDe(self::DIR . '/locale/en/locale.po'));
        $this->assertNotEmpty($chavesEn, 'locale/en sem chaves');

        foreach (glob(self::DIR . '/locale/*/locale.po') as $arquivo) {
            $locale = basename(dirname($arquivo));
            $chaves = $this->chavesDe($arquivo);
            $faltando = array_diff($chavesEn, array_keys($chaves));
            $this->assertSame([], array_values($faltando), "locale {$locale} sem chaves");
            foreach ($chaves as $chave => $valor) {
                $this->assertNotSame('', trim($valor), "locale {$locale}: chave {$chave} vazia");
            }
        }
    }

    /** Codigos legados nao existem no 3.5 e o locale simplesmente nao carrega. */
    public function testNaoUsaCodigosDeLocaleLegados(): void
    {
        foreach (['fr_FR', 'pt_PT', 'nb', 'sr', 'zh_CN'] as $legado) {
            $this->assertDirectoryDoesNotExist(self::DIR . '/locale/' . $legado);
        }
    }

    /** Toda chave usada no template/JS precisa existir no locale/en. */
    public function testChavesUsadasExistemNoIngles(): void
    {
        $chavesEn = array_keys($this->chavesDe(self::DIR . '/locale/en/locale.po'));
        $usadas = [];
        foreach (glob(self::DIR . '/templates/*.tpl') as $tpl) {
            preg_match_all('/key="(plugins\.generic\.pdfFlipbook\.[a-zA-Z.]+)"/', file_get_contents($tpl), $m);
            $usadas = array_merge($usadas, $m[1]);
        }
        $usadas = array_unique($usadas);
        $this->assertNotEmpty($usadas, 'nenhuma chave encontrada nos templates');
        foreach ($usadas as $chave) {
            $this->assertContains($chave, $chavesEn, "chave usada no template e ausente do locale/en: {$chave}");
        }
    }

    /**
     * Le o .po com o MESMO parser que o PKP usa em producao (Gettext\PoLoader).
     * Um regex caseiro erra em msgstr multilinha e da falso negativo — foi o que
     * aconteceu na primeira versao deste teste.
     *
     * @return array<string,string> msgid => msgstr
     */
    private function chavesDe(string $arquivo): array
    {
        $this->assertFileExists($arquivo);
        $traducoes = (new \Gettext\Loader\PoLoader())->loadFile($arquivo);
        $out = [];
        foreach ($traducoes as $t) {
            $id = $t->getOriginal();
            if ($id === '') {
                continue;   // cabecalho
            }
            $out[$id] = (string) $t->getTranslation();
        }
        return $out;
    }
}
