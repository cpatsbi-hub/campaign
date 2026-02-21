// ============================================================
// CAMPAIGN PORTAL — GOOGLE APPS SCRIPT v5
// ============================================================
// NO SPREADSHEET ID NEEDED — uses getActiveSpreadsheet()
//
// SETUP:
//  1. Open your Google Sheet
//  2. Extensions > Apps Script > delete all > paste this
//  3. Run function: setup (grants permissions)
//  4. Deploy > New Deployment > Web App
//     Execute as: Me | Who has access: Anyone
//  5. Paste the Web App URL into both HTML files
// ============================================================

var CONFIG_SHEET = 'Config';
var VISITS_SHEET = 'Visits';

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('Connected to: ' + ss.getName());
  getOrCreateSheet(CONFIG_SHEET, ['key','value']);
  getOrCreateSheet(VISITS_SHEET, ['Date','Branch','Timestamp']);
  if (!readConfig()['branches']) writeConfig('branches', defaultBranches());
  if (!readConfig()['campaigns']) writeConfig('campaigns', []);
  if (!readConfig()['banners']) writeConfig('banners', []);
  Logger.log('Setup complete. Now deploy as Web App.');
}

function SS() { return SpreadsheetApp.getActiveSpreadsheet(); }

function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var action = p.action || '';
  var result;
  try {
    switch (action) {
      case 'ping':              result = {ok:true, ts:new Date().toISOString(), sheet:SS().getName()}; break;
      case 'getCampaigns':      result = getCampaignsForBranch(p.branch, p.date); break;
      case 'logVisit':          result = logBranchVisit(p.branch, p.date); break;
      case 'getBranchActivity': result = getBranchActivity(p.date); break;
      case 'adminData':         result = getAdminData(p.date); break;
      case 'getReport':         result = getReport(p.from, p.to, p.campaign||''); break;
      case 'saveCampaign':      result = saveCampaign(parsePayload(p.payload)); break;
      case 'deleteCampaign':    result = deleteCampaign(p.id); break;
      case 'updateBranches':    result = updateBranches(parsePayload(p.payload)); break;
      case 'submitReport':      result = submitReport(parsePayload(p.payload)); break;
      case 'saveBanners':       result = saveBanners(parsePayload(p.payload)); break;
      case 'getBanners':        result = getBanners(); break;
      default: result = {error:'Unknown action: '+action};
    }
  } catch(err) { result = {error: err.message}; }
  return respond(result);
}

function doPost(e) {
  var result;
  try {
    var body = JSON.parse(e.postData.contents);
    switch (body.action) {
      case 'saveCampaign':   result = saveCampaign(body.campaign); break;
      case 'deleteCampaign': result = deleteCampaign(body.id); break;
      case 'updateBranches': result = updateBranches(body.branches); break;
      case 'submitReport':   result = submitReport(body); break;
      case 'saveBanners':    result = saveBanners(body.banners); break;
      default: result = {error:'Unknown action'};
    }
  } catch(err) { result = {error:err.message}; }
  return respond(result);
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePayload(str) {
  if (!str) throw new Error('Empty payload');
  try { return JSON.parse(decodeURIComponent(str)); }
  catch(e) { throw new Error('JSON parse error: '+e.message); }
}

// ── SHEET HELPERS ─────────────────────────────────────────────
function getOrCreateSheet(name, headers) {
  var ss = SS(), sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers && headers.length) {
      sh.appendRow(headers);
      sh.getRange(1,1,1,headers.length).setFontWeight('bold')
        .setBackground('#1e3a5f').setFontColor('#fff');
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

// KEY FIX: normalize any value coming from a sheet cell to a plain yyyy-MM-dd string
function toDateStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    // Sheet Date objects — format in script timezone
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  // Already a string like "2025-02-21" or "21/02/2025"
  var s = String(val).trim();
  // Handle dd/mm/yyyy
  var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return m[3]+'-'+m[2]+'-'+m[1];
  return s.substring(0,10); // take yyyy-MM-dd prefix
}

// ── CONFIG ────────────────────────────────────────────────────
function readConfig() {
  var sh = getOrCreateSheet(CONFIG_SHEET, ['key','value']);
  var d  = sh.getDataRange().getValues(), cfg = {};
  for (var i=0;i<d.length;i++) if (d[i][0] && String(d[i][0])!=='key') cfg[String(d[i][0])]=d[i][1];
  return cfg;
}
function writeConfig(key, value) {
  var sh  = getOrCreateSheet(CONFIG_SHEET, ['key','value']);
  var d   = sh.getDataRange().getValues();
  var str = typeof value==='string' ? value : JSON.stringify(value);
  for (var i=0;i<d.length;i++) { if (String(d[i][0])===key) { sh.getRange(i+1,2).setValue(str); return; } }
  sh.appendRow([key, str]);
}
function getAllCampaigns() { try { return JSON.parse(readConfig()['campaigns']||'[]'); } catch(e) { return []; } }
function getAllBranches()  { try { var b=JSON.parse(readConfig()['branches']||'null'); return b||defaultBranches(); } catch(e) { return defaultBranches(); } }
function getBanners()      { try { return {banners: JSON.parse(readConfig()['banners']||'[]')}; } catch(e) { return {banners:[]}; } }
function saveBanners(b)    { writeConfig('banners', b||[]); return {success:true}; }

function defaultBranches() {
  return ['MALAPPURAM','THIRUNAVAYA','KOTTAKKAL','OTHUKKUNGAL','PUTHANATHANI','POTHUKKALLU',
    'PULAMANTHOLE','VALANCHERRY','PALAPATTY','PERINTHALMANNA','POOKKOTTUMPADAM',
    'CALICUT ROAD PERINTHALMANNA','KARINKALLATHANI','NILAMBUR TOWN','PBB TIRUR','EDARICODE',
    'MALAPPURAM CIVIL STATION','PULPARAMBA','KARUVARAKUNDU','NRI TIRUR','MANIMOOLY','WANDOOR',
    'TIRUR','PANG SOUTH PANG','MANJERI TOWN','ANGADIPURAM','EDAPPAL TOWN','CHUNGATHARA',
    'PONNANI','EDAKKARA','MAKKARAPARAMBA','PANDIKKAD','CHANGARAMKULAM','B P ANGADI','KUTTIPURAM',
    'CHAMRAVATTOM JUNCTION PONNANI','KALPAKANCHERY','TIRUR TOWN','MANKADA','MANJERI','ELAMKULAM',
    'CHANDAKKUNNU','MELATTUR','VENNIYOOR','PRAVASI SEVA KOTTAKKAL','MALAPPURAM TOWN BRANCH'];
}

// ── PARAMETERS ────────────────────────────────────────────────
function normParams(params) {
  if (!params||!params.length) return [];
  if (params[0].paramName!==undefined) return params;
  return params.map(function(p){ return {paramName:p.label||'Value',columns:['Number']}; });
}
function colHdr(pName,col) { return pName+' - '+col; }
function dKey(pName,col)   { return pName+'__'+col; }
function buildHeaders(campaign) {
  var cols=['Timestamp','Date','Branch'], p=normParams(campaign.parameters);
  for (var i=0;i<p.length;i++) for (var j=0;j<p[i].columns.length;j++) cols.push(colHdr(p[i].paramName,p[i].columns[j]));
  return cols;
}

// ── ACTIVE CHECK ──────────────────────────────────────────────
function isActiveOn(c, dateStr) {
  if (!c.active) return false;
  if (c.startDate && c.startDate > dateStr) return false;
  if (c.endDate   && c.endDate   < dateStr) return false;
  var dow=new Date(dateStr+'T12:00:00').getDay();
  var names=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var s=(c.schedule||'daily').toLowerCase();
  if (s==='daily') return true;
  if (s==='weekdays') return dow>=1&&dow<=5;
  if (s==='weekends') return dow===0||dow===6;
  return names[dow]===s;
}

// ── CAMPAIGNS FOR BRANCH ──────────────────────────────────────
function getCampaignsForBranch(branch, date) {
  if (!branch||!date) return {campaigns:[],todayData:{},banners:[]};
  var active = getAllCampaigns()
    .filter(function(c){ return isActiveOn(c,date); })
    .map(function(c){ return ext(c,{parameters:normParams(c.parameters)}); });
  var banners = [];
  try { banners = JSON.parse(readConfig()['banners']||'[]'); } catch(e){}
  return {campaigns:active, todayData:getTodayTotals(branch,date,active), banners:banners};
}

function getTodayTotals(branch, date, campaigns) {
  var ss=SS(), out={};
  for (var ci=0;ci<campaigns.length;ci++) {
    var c=campaigns[ci], sh=ss.getSheetByName('Data_'+c.name);
    if (!sh||sh.getLastRow()<2) { out[c.name]={}; continue; }
    var d=sh.getDataRange().getValues(), h=d[0].map(String);
    var di=h.indexOf('Date'), bi=h.indexOf('Branch');
    if (di<0||bi<0) { out[c.name]={}; continue; }
    var p=normParams(c.parameters), totals={};
    for (var pi=0;pi<p.length;pi++) for (var ki=0;ki<p[pi].columns.length;ki++) totals[dKey(p[pi].paramName,p[pi].columns[ki])]=0;
    for (var ri=1;ri<d.length;ri++) {
      // ★ FIX: normalize the date from the sheet cell
      if (toDateStr(d[ri][di])===date && String(d[ri][bi]).trim()===branch) {
        for (var pi2=0;pi2<p.length;pi2++) for (var ki2=0;ki2<p[pi2].columns.length;ki2++) {
          var dk=dKey(p[pi2].paramName,p[pi2].columns[ki2]);
          var idx=h.indexOf(colHdr(p[pi2].paramName,p[pi2].columns[ki2]));
          if (idx>=0) totals[dk]+=Number(d[ri][idx])||0;
        }
      }
    }
    out[c.name]=totals;
  }
  return out;
}

// ── SUBMIT REPORT ─────────────────────────────────────────────
function submitReport(payload) {
  var branch=payload.branch, date=payload.date, campData=payload.campaigns;
  if (!branch||!date) return {success:false,error:'Missing branch or date'};
  var ss=SS(), cList=getAllCampaigns().filter(function(c){ return isActiveOn(c,date); });
  for (var ci=0;ci<cList.length;ci++) {
    var c=cList[ci], inc=campData?campData[c.name]:null;
    if (!inc) continue;
    var params=normParams(c.parameters);
    var sh=getOrCreateSheet('Data_'+c.name, buildHeaders({parameters:params}));
    var row=[new Date().toISOString(), date, branch];
    for (var pi=0;pi<params.length;pi++) for (var ki=0;ki<params[pi].columns.length;ki++)
      row.push(Number(inc[dKey(params[pi].paramName,params[pi].columns[ki])])||0);
    sh.appendRow(row);
  }
  var norm=cList.map(function(c){ return ext(c,{parameters:normParams(c.parameters)}); });
  return {success:true, todayData:getTodayTotals(branch,date,norm)};
}

// ── SAVE / DELETE CAMPAIGN ────────────────────────────────────
function saveCampaign(campaign) {
  if (!campaign||!campaign.name) return {success:false,error:'No campaign data'};
  campaign.parameters=normParams(campaign.parameters);
  campaign.id=campaign.id||String(Date.now());
  campaign.active=true;
  getOrCreateSheet('Data_'+campaign.name, buildHeaders(campaign));
  var list=getAllCampaigns(); list.push(campaign);
  writeConfig('campaigns',list);
  return {success:true,campaign:campaign};
}
function deleteCampaign(id) {
  writeConfig('campaigns', getAllCampaigns().filter(function(c){ return String(c.id)!==String(id); }));
  return {success:true};
}
function updateBranches(branches) {
  if (!Array.isArray(branches)) return {success:false,error:'Expected array'};
  writeConfig('branches',branches); return {success:true};
}

// ── VISITS ────────────────────────────────────────────────────
function logBranchVisit(branch, date) {
  if (!branch||!date) return {success:false};
  var sh=getOrCreateSheet(VISITS_SHEET,['Date','Branch','Timestamp']);
  var d=sh.getDataRange().getValues();
  for (var i=1;i<d.length;i++) {
    // ★ FIX: normalize date from sheet
    if (toDateStr(d[i][0])===date && String(d[i][1])===branch) return {success:true};
  }
  sh.appendRow([date, branch, new Date().toISOString()]);
  return {success:true};
}

function getBranchActivity(date) {
  var sh=SS().getSheetByName(VISITS_SHEET);
  if (!sh) return {visited:[]};
  var d=sh.getDataRange().getValues(), v=[], seen={};
  for (var i=1;i<d.length;i++) {
    var b=String(d[i][1]);
    // ★ FIX: normalize date from sheet
    if (toDateStr(d[i][0])===date && !seen[b]) { v.push(b); seen[b]=true; }
  }
  return {visited:v};
}

// ── ADMIN DATA ────────────────────────────────────────────────
function getAdminData(date) {
  var camps=getAllCampaigns().map(function(c){ return ext(c,{parameters:normParams(c.parameters)}); });
  var ss=SS(), total=0;
  for (var i=0;i<camps.length;i++) {
    var sh=ss.getSheetByName('Data_'+camps[i].name);
    if (!sh||sh.getLastRow()<2) continue;
    var d=sh.getDataRange().getValues();
    var idx=d[0].map(String).indexOf('Date');
    if (idx>=0) for (var r=1;r<d.length;r++) if (toDateStr(d[r][idx])===date) total++;
  }
  return {campaigns:camps, branches:getAllBranches(), activity:getBranchActivity(date), totalReports:total};
}

// ── REPORT ────────────────────────────────────────────────────
function getReport(from, to, campaignFilter) {
  var camps=getAllCampaigns()
    .map(function(c){ return ext(c,{parameters:normParams(c.parameters)}); })
    .filter(function(c){ return !campaignFilter||c.name===campaignFilter; });
  var branches=getAllBranches(), ss=SS(), cache={};
  for (var i=0;i<camps.length;i++) {
    var sh=ss.getSheetByName('Data_'+camps[i].name);
    cache[camps[i].name]=sh?sh.getDataRange().getValues():null;
  }
  var rows=[];
  for (var bi=0;bi<branches.length;bi++) {
    var branch=branches[bi], row={branch:branch};
    for (var ci=0;ci<camps.length;ci++) {
      var c=camps[ci], d=cache[c.name];
      if (!d||d.length<2) { row[c.name]={}; continue; }
      var h=d[0].map(String), di=h.indexOf('Date'), bri=h.indexOf('Branch');
      if (di<0||bri<0) { row[c.name]={}; continue; }
      var p=c.parameters, t={};
      for (var pi=0;pi<p.length;pi++) for (var ki=0;ki<p[pi].columns.length;ki++) t[dKey(p[pi].paramName,p[pi].columns[ki])]=0;
      for (var ri=1;ri<d.length;ri++) {
        // ★ FIX: normalize date from sheet
        var rd=toDateStr(d[ri][di]), rb=String(d[ri][bri]).trim();
        if (rb===branch && rd>=from && rd<=to) {
          for (var pi2=0;pi2<p.length;pi2++) for (var ki2=0;ki2<p[pi2].columns.length;ki2++) {
            var dk=dKey(p[pi2].paramName,p[pi2].columns[ki2]);
            var idx=h.indexOf(colHdr(p[pi2].paramName,p[pi2].columns[ki2]));
            if (idx>=0) t[dk]+=Number(d[ri][idx])||0;
          }
        }
      }
      row[c.name]=t;
    }
    rows.push(row);
  }
  return {rows:rows, campaigns:camps};
}

function ext(obj,extra) { var r={}; for (var k in obj) r[k]=obj[k]; for (var k2 in extra) r[k2]=extra[k2]; return r; }

// ── TESTS ─────────────────────────────────────────────────────
function TEST_ping()   { Logger.log(SS().getName()); }
function TEST_save()   { Logger.log(JSON.stringify(saveCampaign({name:'TEST',startDate:'2025-01-01',endDate:'2025-12-31',schedule:'daily',active:true,parameters:[{paramName:'PAI',columns:['Number','Amount']}]}))); }
function TEST_report() { var d=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd'); Logger.log(JSON.stringify(getReport(d,d,''))); }
function TEST_activity(){ var d=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd'); Logger.log(JSON.stringify(getBranchActivity(d))); }
