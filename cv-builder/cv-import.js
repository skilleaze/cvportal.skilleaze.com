// Skilleaze CV import: reads plain CV text into the builder's fields without AI.
(function(){
var MON='(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
var PT='(?:'+MON+'\\s*[\'’]?\\d{2,4}|\\d{1,2}[\\/.-]\\d{2,4}|\\d{4})';
var RANGE=new RegExp(PT+'\\s*(?:-|–|—|to|till|until)\\s*(?:'+PT+'|present|current|now|till date|to date|date|ongoing)','i');
var YEAR=/\b(19|20)\d{2}\b/;
var BUL=/^\s*(?:[•●▪■◦○·\-\*–»✓✔➢➤►]|\d+[.)])\s*/;
var H=[
 ['summary',/^(?:professional\s+|career\s+|executive\s+)?(?:summary|profile|objective|about(?:\s+me)?|personal\s+statement|career\s+objective|overview)\b/i],
 ['exp',/^(?:work|professional|employment|career|relevant)?\s*(?:experience|employment(?:\s+history)?|work\s+history|career\s+history|internships?)\b/i],
 ['edu',/^(?:education|academic|educational|qualifications?|academic\s+qualifications?)\b/i],
 ['skills',/^(?:key\s+|core\s+|technical\s+|professional\s+|it\s+|soft\s+)?(?:skills|competenc(?:y|ies)|expertise|strengths|tools|technologies)\b/i],
 ['langs',/^languages?(?:\s+known|\s+skills)?\b/i],
 ['certs',/^(?:certifications?|certificates?|licen[cs]es?|courses?|trainings?|professional\s+development)\b/i],
 ['projects',/^(?:projects?|key\s+projects|academic\s+projects)\b/i],
 ['awards',/^(?:awards?|achievements?|honou?rs|accomplishments)\b/i],
 ['ignore',/^(?:interests|hobbies|references?|declaration|personal\s+(?:details|information|data)|contact(?:\s+details)?)\b/i]
];
function clean(l){return l.replace(/\s+/g,' ').trim();}
function heading(l){var t=clean(l).replace(/[:：]\s*$/,'');if(t.length>42||/[.@]/.test(t.slice(-1)))return null;
 for(var i=0;i<H.length;i++)if(H[i][1].test(t))return H[i][0];return null;}
function nameLike(l){return /^[A-Za-z][A-Za-z.'’\- ]{2,40}$/.test(l)&&l.split(' ').length>=2&&l.split(' ').length<=5&&!heading(l);}
function parse(text){
 var raw=String(text||'').replace(/\r/g,'').replace(/\t/g,' ').split('\n').map(clean).filter(Boolean);
 var out={name:'',title:'',sub:'',location:'',phone:'',email:'',website:'',linkedin:'',summary:'',skills:[],exp:[],edu:[],langs:'',extra:[]};
 var all=raw.join('\n');
 var em=all.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);if(em)out.email=em[0];
 var li=all.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w%\-]+\/?/i);if(li)out.linkedin=li[0].replace(/^https?:\/\//,'');
 var ph=all.match(/(?:\+|00)?\d[\d\s\-().]{7,}\d/);if(ph)out.phone=clean(ph[0]);
 var ws=all.match(/(?:https?:\/\/|www\.)[^\s|,]+/ig);if(ws){for(var w=0;w<ws.length;w++)if(!/linkedin/i.test(ws[w])){out.website=ws[w].replace(/^https?:\/\//,'');break;}}
 var secs={top:[]},cur='top',order=[];
 raw.forEach(function(l){var h=heading(l);if(h){cur=h;if(!secs[cur]){secs[cur]=[];order.push(cur);}return;}(secs[cur]=secs[cur]||[]).push(l);});
 var top=secs.top||[];
 for(var i=0;i<top.length&&i<6;i++){if(nameLike(top[i])&&!out.name){out.name=top[i].replace(/\b\w/g,function(c){return c.toUpperCase();}).replace(/\B\w+/g,function(c){return c.toLowerCase();});continue;}
  if(out.name&&!out.title&&!/[@\d]|linkedin|www\./i.test(top[i])&&top[i].length<80){out.title=top[i];continue;}}
 top.forEach(function(l){l.split(/\s*[|•·●]\s*/).forEach(function(p){p=clean(p);
  if(!out.location&&p&&!/[@\d]|linkedin|www\.|http/i.test(p)&&/,/.test(p)&&p.length<50&&p!==out.title)out.location=p;});});
 var restTop=top.filter(function(l){return l!==out.title&&!nameLike(l)&&!/[@]|linkedin|www\.|\+?\d{6,}/i.test(l.replace(/\s/g,''))&&l.length>60;});
 out.summary=(secs.summary||restTop).join(' ').replace(BUL,'');
 if(secs.skills){var cats=[],plain=[];secs.skills.forEach(function(l){l=l.replace(BUL,'');var m=l.match(/^([^:]{2,30}):\s*(.+)$/);
   if(m)cats.push({cat:clean(m[1]),list:m[2].split(/\s*[,;|•·]\s*/).filter(Boolean).join(', ')});else plain=plain.concat(l.split(/\s*[,;|•·]\s*|\s{2,}/));});
  plain=plain.map(clean).filter(function(x){return x&&x.length<60;});
  if(plain.length)cats.unshift({cat:'Core skills',list:plain.join(', ')});out.skills=cats;}
 if(secs.langs)out.langs=secs.langs.map(function(l){return l.replace(BUL,'');}).join(', ').replace(/\s*,\s*,/g,',');
 if(secs.exp){var jobs=[],j=null,lastB=false;
  secs.exp.forEach(function(l){var isB=BUL.test(l)||(l.length>90&&j&&j.hdr.length);
   if(isB){if(!j){j={hdr:[],b:[]};jobs.push(j);}j.b.push(l.replace(BUL,''));lastB=true;return;}
   if(!j||lastB||j.hdr.length>=3||(RANGE.test(l)&&j.hdr.some(function(x){return RANGE.test(x);}))){j={hdr:[],b:[]};jobs.push(j);}
   j.hdr.push(l);lastB=false;});
  out.exp=jobs.map(function(x){var d='',h=[];x.hdr.forEach(function(l){var m=l.match(RANGE);if(m&&!d){d=clean(m[0]).replace(/\s*(-|–|—|to)\s*/i,' – ');l=clean(l.replace(m[0],'').replace(/[|,(\[\]\)–-]+\s*$/,'').replace(/^\s*[|,–-]+/,''));}if(l)h.push(l);});
   var t=h[0]||'',c=h.slice(1).join(' · ');var at=t.match(/^(.+?)\s+(?:at|@|\||–|-|,)\s+(.+)$/);if(at&&!c){t=at[1];c=at[2];}
   return {t:t,c:c,d:d,b:x.b.join('\n')};}).filter(function(x){return x.t||x.b;});}
 if(secs.edu){var es=[],e=null;
  secs.edu.forEach(function(l){l=l.replace(BUL,'');var deg=/(bachelor|master|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\b|m\.?\s?e\b|mba|bba|bca|mca|b\.?\s?sc|m\.?\s?sc|b\.?\s?com|m\.?\s?com|b\.?\s?a\b|m\.?\s?a\b|ph\.?d|diploma|degree|high school|secondary|higher secondary|12th|10th|hsc|ssc|sslc|puc|certificate in|associate)/i.test(l);
   if(!e||(deg&&e.deg)){e={deg:'',school:'',yrs:''};es.push(e);}
   var m=l.match(RANGE)||l.match(/\b(19|20)\d{2}\b/);if(m&&!e.yrs){e.yrs=clean(m[0]).replace(/\s*(-|–|—|to)\s*/i,' – ');l=clean(l.replace(m[0],'').replace(/[|,(–-]+\s*$/,''));}
   if(!l)return;if(deg&&!e.deg)e.deg=l;else if(!e.school)e.school=l;else if(!e.deg)e.deg=l;});
  out.edu=es.filter(function(x){return x.deg||x.school;});}
 [['certs','Certifications'],['projects','Projects'],['awards','Awards']].forEach(function(p){if(secs[p[0]]&&secs[p[0]].length)out.extra.push({title:p[1],items:secs[p[0]].map(function(l){return l.replace(BUL,'');}).join('\n')});});
 return out;}
function score(j){return (j.name?2:0)+(j.email?1:0)+((j.exp||[]).length?3:0)+((j.edu||[]).length?1:0)+((j.skills||[]).length?1:0);}
window.SKIMPORT={parse:parse,score:score};
})();
