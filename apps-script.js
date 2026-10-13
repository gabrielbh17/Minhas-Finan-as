/*
 * ═══════════════════════════════════════════════════════════════
 *  FINANÇAS DO GABRIEL — Google Apps Script (Backend) v2
 *
 *  Como instalar:
 *  1. Abra o Google Sheets e crie uma planilha nova em branco
 *  2. No menu: Extensões → Apps Script
 *  3. Apague todo o código que aparecer
 *  4. Cole este arquivo inteiro
 *  5. Clique em Salvar (Ctrl+S)
 *  6. Clique em Executar (▶) uma vez para autorizar — aceite as permissões
 *  7. Clique em Implantar → Nova implantação (ou Gerenciar → editar)
 *     Tipo: App da Web
 *     Executar como: Eu
 *     Quem tem acesso: Qualquer pessoa
 *  8. Clique em Implantar → copie a URL gerada
 *  9. Cole essa URL em Ajustes → Sincronização na plataforma
 * ═══════════════════════════════════════════════════════════════
 */

const SHEET_NAME = 'Dados';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, 3).setValues([['usuario', 'chave', 'valor']]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRow(sheet, usuario, chave) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(usuario) && String(data[i][1]) === String(chave)) {
      return i + 1;
    }
  }
  return -1;
}

function makeResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Tudo via GET para evitar bloqueio de CORS do Google
function doGet(e) {
  try {
    const p = e.parameter || {};
    const action  = p.action  || '';
    const usuario = p.usuario || '';
    const chave   = p.chave   || '';
    const valor   = p.valor !== undefined ? decodeURIComponent(p.valor) : '';

    if (!action) return makeResponse({ ok: true, ping: true });

    const sheet = getOrCreateSheet();

    if (action === 'get') {
      const row = findRow(sheet, usuario, chave);
      if (row === -1) return makeResponse({ ok: true, valor: null });
      const val = sheet.getRange(row, 3).getValue();
      return makeResponse({ ok: true, valor: val });
    }

    if (action === 'set') {
      const row = findRow(sheet, usuario, chave);
      if (row === -1) {
        sheet.appendRow([usuario, chave, valor]);
      } else {
        sheet.getRange(row, 3).setValue(valor);
      }
      return makeResponse({ ok: true });
    }

    if (action === 'delete') {
      const row = findRow(sheet, usuario, chave);
      if (row !== -1) sheet.deleteRow(row);
      return makeResponse({ ok: true });
    }

    return makeResponse({ ok: false, erro: 'Ação desconhecida.' });

  } catch (err) {
    return makeResponse({ ok: false, erro: err.message });
  }
}

// doPost mantido por compatibilidade mas redireciona para doGet
function doPost(e) {
  return doGet(e);
}
