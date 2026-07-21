/**
 * Diagnostics.gs
 *
 * TEMPORARY read-only diagnostics. Not referenced by the web app.
 * Safe to run at any time and safe to delete when finished.
 *
 * Run `auditPayloadSize` from the Apps Script editor and read the output in
 * the execution log. It answers two questions:
 *
 *   1. Which tables make up the payload the browser has to download?
 *   2. Within the biggest tables, which COLUMNS are worth dropping?
 *
 * Column stats are estimated from a sample of rows rather than a full scan,
 * so byte figures are approximate. Totals are exact.
 */

/** Rows sampled per table for column-level statistics. */
var AUDIT_SAMPLE_ROWS = 500;

/** Tables at or above this share of the payload get a column breakdown. */
var AUDIT_DETAIL_THRESHOLD_PCT = 1.0;

/**
 * Read the first n lines of a large string without splitting the whole thing.
 * Splitting a 100MB string just to look at 500 rows is what we are avoiding.
 */
function auditFirstLines_(text, n) {
  var lines = [];
  var start = 0;
  for (var i = 0; i < n; i++) {
    var nl = text.indexOf('\n', start);
    if (nl === -1) {
      if (start < text.length) lines.push(text.substring(start));
      break;
    }
    lines.push(text.substring(start, nl));
    start = nl + 1;
  }
  return lines;
}

/** Split one CSV line, honouring quotes. Mirrors the client-side parseCSV. */
function auditSplitCsvLine_(line) {
  var out = [];
  var cur = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function auditPad_(s, width) {
  s = String(s);
  while (s.length < width) s += ' ';
  return s;
}

function auditPadLeft_(s, width) {
  s = String(s);
  while (s.length < width) s = ' ' + s;
  return s;
}

/**
 * Main entry point. Reassembles the payload exactly as getAppData does, then
 * reports size by table and by column.
 */
function auditPayloadSize() {
  var dbSpreadsheetId = getRequiredConfig('DB_SPREADSHEET_ID', 'Database Spreadsheet ID');
  var dbSheetName = getConfig('DB_SHEET_NAME', 'DB');

  var ss = SpreadsheetApp.openById(dbSpreadsheetId);
  var sheet = ss.getSheetByName(dbSheetName);
  if (!sheet) throw new Error("Sheet '" + dbSheetName + "' not found.");

  var rows = sheet.getDataRange().getValues().slice(1);

  // Reassemble chunks per cat|key, same as getAppData
  var map = {};
  rows.forEach(function (row) {
    if (!row || row.length < 5) return;
    var cat = row[1], key = row[2], chunkIndex = row[3], content = row[4] || '';
    if (!cat || !key) return;
    var ck = cat + '|' + key;
    if (!map[ck]) map[ck] = [];
    map[ck][chunkIndex] = content;
  });

  var tables = Object.keys(map).map(function (ck) {
    var content = map[ck].join('');
    return { key: ck, content: content, chars: content.length };
  });

  var totalChars = tables.reduce(function (a, t) { return a + t.chars; }, 0);
  tables.sort(function (a, b) { return b.chars - a.chars; });

  Logger.log('================ PAYLOAD SIZE AUDIT ================');
  Logger.log('Sheet rows (chunks): ' + rows.length);
  Logger.log('Tables: ' + tables.length);
  Logger.log('Total payload: ' + totalChars + ' chars (' + (totalChars / 1048576).toFixed(1) + ' MB)');
  Logger.log('');
  Logger.log(auditPad_('TABLE', 34) + auditPadLeft_('MB', 8) + auditPadLeft_('%', 8) + auditPadLeft_('~ROWS', 10) + auditPadLeft_('COLS', 6));
  Logger.log(new Array(67).join('-'));

  tables.forEach(function (t) {
    var sample = auditFirstLines_(t.content, AUDIT_SAMPLE_ROWS + 1);
    var headers = sample.length ? auditSplitCsvLine_(sample[0]) : [];
    var body = sample.slice(1);
    // Estimate row count from mean sampled line length rather than splitting everything
    var sampledChars = body.reduce(function (a, l) { return a + l.length + 1; }, 0);
    var meanLine = body.length ? sampledChars / body.length : 0;
    var estRows = meanLine > 0 ? Math.round(t.chars / meanLine) : 0;
    t.headers = headers;
    t.body = body;
    t.estRows = estRows;
    Logger.log(
      auditPad_(t.key, 34) +
      auditPadLeft_((t.chars / 1048576).toFixed(2), 8) +
      auditPadLeft_((100 * t.chars / totalChars).toFixed(1), 8) +
      auditPadLeft_(estRows, 10) +
      auditPadLeft_(headers.length, 6)
    );
  });

  Logger.log('');
  Logger.log('=========== COLUMN DETAIL (tables >= ' + AUDIT_DETAIL_THRESHOLD_PCT + '% of payload) ===========');
  Logger.log('EMPTY   = every sampled value blank -> safe to drop');
  Logger.log('CONST   = one repeated value -> usually safe to drop');
  Logger.log('est.MB  = projected contribution of this column to the whole table');

  tables.forEach(function (t) {
    var pct = 100 * t.chars / totalChars;
    if (pct < AUDIT_DETAIL_THRESHOLD_PCT || !t.headers.length || !t.body.length) return;

    var n = t.headers.length;
    var colChars = [], nonEmpty = [], distinct = [];
    for (var c = 0; c < n; c++) { colChars.push(0); nonEmpty.push(0); distinct.push({}); }

    var sampledTotal = 0;
    t.body.forEach(function (line) {
      var vals = auditSplitCsvLine_(line);
      sampledTotal += line.length + 1;
      for (var c = 0; c < n; c++) {
        var v = vals[c] === undefined ? '' : vals[c];
        colChars[c] += v.length + 1; // +1 for the delimiter
        if (v !== '') nonEmpty[c]++;
        if (Object.keys(distinct[c]).length <= 5) distinct[c][v] = true;
      }
    });

    var scale = sampledTotal > 0 ? (t.chars / sampledTotal) : 0;

    var cols = [];
    for (var c = 0; c < n; c++) {
      var d = Object.keys(distinct[c]).length;
      cols.push({
        name: t.headers[c],
        estMB: (colChars[c] * scale) / 1048576,
        pctOfTable: 100 * colChars[c] / sampledTotal,
        flag: nonEmpty[c] === 0 ? 'EMPTY' : (d === 1 ? 'CONST' : '')
      });
    }
    cols.sort(function (a, b) { return b.estMB - a.estMB; });

    Logger.log('');
    Logger.log('--- ' + t.key + '  (' + (t.chars / 1048576).toFixed(2) + ' MB, ' + pct.toFixed(1) + '% of payload, ~' + t.estRows + ' rows)');
    Logger.log('    ' + auditPad_('COLUMN', 30) + auditPadLeft_('est.MB', 9) + auditPadLeft_('%tbl', 7) + '  FLAG');
    cols.forEach(function (c) {
      Logger.log('    ' + auditPad_(c.name, 30) + auditPadLeft_(c.estMB.toFixed(2), 9) + auditPadLeft_(c.pctOfTable.toFixed(1), 7) + '  ' + c.flag);
    });

    var droppable = cols.filter(function (c) { return c.flag; });
    if (droppable.length) {
      var saved = droppable.reduce(function (a, c) { return a + c.estMB; }, 0);
      Logger.log('    >> ' + droppable.length + ' empty/constant column(s) here, ~' + saved.toFixed(2) + ' MB');
    }
  });

  Logger.log('');
  Logger.log('================ END AUDIT ================');
}
