"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Subject={subject_name:string;correct_count:number;wrong_count:number;blank_count:number;review_topics?:string};
type Exam={id:string;title:string;exam_date:string;score:number;note?:string;exam_subjects:Subject[]};
type Activity={id:string;title:string;event_date:string;summary:string;details?:string;image_url?:string};

/**
 * Puan gelişimi. SVG kabın gerçek genişliğinde çizilir; böylece telefonda yazılar
 * küçülmez. Tarihler grafiğin içinde, ilgili noktanın altındadır ve sığmayacak
 * kadar çok deneme varsa yalnızca bir kısmı yazılır.
 */
function ProgressChart({ exams }: { exams: Exam[] }) {
  const ref=useRef<HTMLDivElement>(null);
  const [width,setWidth]=useState(700);
  useEffect(()=>{
    const el=ref.current; if(!el)return;
    const observer=new ResizeObserver(([entry])=>setWidth(Math.max(280,Math.round(entry.contentRect.width))));
    observer.observe(el); return ()=>observer.disconnect();
  },[]);
  if (!exams.length) return <div className="emptyChart">Grafik için henüz sonuç bulunmuyor.</div>;
  const height=240,left=36,right=20,top=28,bottom=44;
  const plotW=width-left-right,plotH=height-top-bottom;
  const x=(i:number)=>exams.length>1?left+i*(plotW/(exams.length-1)):left+plotW/2;
  const y=(score:number)=>top+(1-Number(score)/100)*plotH;
  const points=exams.map((e,i)=>`${x(i)},${y(e.score)}`).join(" ");
  const maxLabels=Math.max(2,Math.floor(plotW/72));
  const every=Math.ceil(exams.length/maxLabels);
  const short=(d:string)=>new Date(`${d}T12:00:00`).toLocaleDateString("tr-TR",{day:"numeric",month:"short"});
  return <div className="chartWrap" ref={ref}><svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Deneme puanlarının zaman içindeki gelişimi">
    {[0,25,50,75,100].map(v=><g key={v}><line className="grid" x1={left} y1={y(v)} x2={width-right} y2={y(v)}/><text x={left-8} y={y(v)+4} textAnchor="end">{v}</text></g>)}
    <line x1={left} y1={top+plotH} x2={width-right} y2={top+plotH}/>
    <polyline points={points}/>
    {exams.map((e,i)=><g key={e.id}>
      <circle cx={x(i)} cy={y(e.score)} r="6"><title>{`${e.title}: ${e.score}`}</title></circle>
      <text className="scoreLabel" x={x(i)} y={y(e.score)-12} textAnchor="middle">{e.score}</text>
      {(i%every===0||i===exams.length-1)&&<text x={x(i)} y={top+plotH+24} textAnchor={exams.length>1&&i===0?"start":exams.length>1&&i===exams.length-1?"end":"middle"}>{short(e.exam_date)}</text>}
    </g>)}
  </svg></div>;
}

export default function ParentResults({ slug }: { slug:string }) {
  const [data,setData]=useState<{parent:{parent_name:string;student_name:string};exams:Exam[];activities:Activity[]}|null>(null);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState("");
  const load=useCallback(async()=>{const r=await fetch(`/api/veli/results?slug=${encodeURIComponent(slug)}`,{cache:"no-store"});if(r.status===401){setData(null);setReady(true);return}const j=await r.json();if(!r.ok)setError(j.error);else setData(j);setReady(true)},[slug]);
  useEffect(()=>{load()},[load]);
  async function login(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");const f=new FormData(e.currentTarget);const r=await fetch("/api/veli/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug,password:f.get("password")})});const j=await r.json();if(!r.ok)return setError(j.error);await load()}

  if(!ready)return <main className="portalCenter">Yükleniyor…</main>;
  if(!data)return <main className="portalCenter parentWelcome"><form className="loginCard" onSubmit={login}><Link className="portalLogo" href="/"><img src="/kids-academy-logo.jpeg" alt="" width={40} height={40} /><b>Kids Academy</b></Link><span>VELİ SONUÇ SİSTEMİ</span><h1>Sonuçlarınız güvende.</h1><p><b>{slug}</b> hesabı için kurumumuzun verdiği şifreyi girin.</p><label>Şifre<input name="password" type="password" required autoFocus /></label><button>Sonuçları görüntüle →</button>{error&&<div className="formMessage error">{error}</div>}<Link className="backHome" href="/veli">← Kullanıcı adını değiştir</Link></form></main>;

  const exams=[...data.exams].sort((a,b)=>a.exam_date.localeCompare(b.exam_date));
  const latest=exams[exams.length-1];
  const previous=exams[exams.length-2];
  const average=exams.length?exams.reduce((sum,e)=>sum+Number(e.score),0)/exams.length:0;
  const highest=exams.length?Math.max(...exams.map(e=>Number(e.score))):0;
  const change=latest&&previous?Number(latest.score)-Number(previous.score):null;

  const subjectTotals=new Map<string,{correct:number;wrong:number;blank:number}>();
  exams.forEach(exam=>exam.exam_subjects.forEach(s=>{
    const cur=subjectTotals.get(s.subject_name)||{correct:0,wrong:0,blank:0};
    cur.correct+=s.correct_count;cur.wrong+=s.wrong_count;cur.blank+=s.blank_count;
    subjectTotals.set(s.subject_name,cur);
  }));
  const subjectSummary=Array.from(subjectTotals.entries()).map(([name,t])=>{
    const total=t.correct+t.wrong+t.blank;
    return {name,correct:t.correct,wrong:t.wrong,blank:t.blank,rate:total?Math.round(t.correct/total*100):0};
  }).sort((a,b)=>a.rate-b.rate);

  const priorityTopics=subjectSummary.flatMap(subject=>{
    const lastNoted=[...exams].reverse().find(exam=>exam.exam_subjects.some(s=>s.subject_name===subject.name&&s.review_topics?.trim()));
    if(!lastNoted)return[];
    const note=lastNoted.exam_subjects.find(s=>s.subject_name===subject.name)?.review_topics;
    return note?[{subject:subject.name,note,examTitle:lastNoted.title}]:[];
  });

  return <main className="resultsPage"><header className="resultsNav"><Link className="portalLogo" href="/"><img src="/kids-academy-logo.jpeg" alt="" width={40} height={40} /><b>Kids Academy</b></Link><div><span>{data.parent.student_name}</span><button onClick={async()=>{await fetch("/api/veli/logout",{method:"POST"});location.reload()}}>Çıkış</button></div></header><div className="resultsShell">
    <section className="resultHero"><div><small>VELİ SONUÇ SİSTEMİ</small><h1>Merhaba, {data.parent.parent_name}.</h1><p>Öğrenciniz {data.parent.student_name} için deneme gelişimi, ders performansı ve çalışılması gereken konular burada.</p></div>{latest&&<div className="latestScore"><small>SON PUAN · {latest.title}</small><b>{latest.score}</b><span>{new Date(`${latest.exam_date}T12:00:00`).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}</span></div>}</section>

    {data.activities?.length>0&&<section className="parentActivities"><div className="resultSectionHead"><div><small>SİZE ÖZEL PAYLAŞIMLAR</small><h2>{data.parent.student_name} için etkinlikler</h2></div><span>{data.activities.length} paylaşım</span></div><div className="parentActivityGrid">{data.activities.map(activity=><article key={activity.id}>{activity.image_url&&<img src={activity.image_url} alt={`${activity.title} etkinliği`} />}<div><time>{new Date(`${activity.event_date}T12:00:00`).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}</time><h3>{activity.title}</h3><p>{activity.summary}</p>{activity.details&&<small>{activity.details}</small>}</div></article>)}</div></section>}

    <section className="resultMetrics"><article><small>SON PUAN</small><b>{latest?.score??"—"}</b><span>{latest?latest.title:"Sonuç bekleniyor"}</span></article><article><small>EN YÜKSEK</small><b>{exams.length?highest.toFixed(0):"—"}</b><span>Kişisel en iyi puan</span></article><article><small>ORTALAMA</small><b>{exams.length?average.toFixed(1):"—"}</b><span>{exams.length} deneme ortalaması</span></article><article className={change!==null&&change>=0?"positiveMetric":""}><small>SON DEĞİŞİM</small><b>{change===null?"—":`${change>=0?"+":""}${change.toFixed(1)}`}</b><span>{change===null?"İki sonuç sonrası hesaplanır":change>=0?"Yükseliş devam ediyor":"Birlikte toparlayabiliriz"}</span></article></section>

    {latest&&latest.exam_subjects.length>0&&<section className="subjectOverview"><div className="resultSectionHead"><div><small>SON DENEME ANALİZİ</small><h2>Derslere göre görünüm</h2></div><span>{latest.title}</span></div><div className="subjectOverviewGrid">{latest.exam_subjects.map(subject=>{const total=subject.correct_count+subject.wrong_count+subject.blank_count;const rate=total?Math.round(subject.correct_count/total*100):0;return <article key={subject.subject_name}><div><b>{subject.subject_name}</b><strong>%{rate}</strong></div><div className="subjectProgress"><i style={{width:`${rate}%`}}/></div><p><span>{subject.correct_count} doğru</span><span>{subject.wrong_count} yanlış</span><span>{subject.blank_count} boş</span></p>{subject.review_topics&&<small><b>Çalışılacak:</b> {subject.review_topics}</small>}</article>})}</div></section>}

    {subjectSummary.length>0&&<section className="subjectOverview"><div className="resultSectionHead"><div><small>TÜM DENEMELER</small><h2>Genel ders performansı</h2></div><span>{exams.length} deneme ortalaması</span></div><div className="subjectOverviewGrid">{subjectSummary.map(subject=>(<article key={subject.name}><div><b>{subject.name}</b><strong>%{subject.rate}</strong></div><div className="subjectProgress"><i style={{width:`${subject.rate}%`}}/></div><p><span>{subject.correct} doğru</span><span>{subject.wrong} yanlış</span><span>{subject.blank} boş</span></p></article>))}</div></section>}

    {priorityTopics.length>0&&<section className="priorityTopics"><div className="resultSectionHead"><div><small>ODAKLANILACAK ALANLAR</small><h2>Öncelikli çalışma konuları</h2></div></div><div className="priorityTopicsList">{priorityTopics.map(item=>(<article key={item.subject}><b>{item.subject}</b><p>{item.note}</p><small>{item.examTitle}</small></article>))}</div></section>}

    <section className="progressCard"><div className="resultSectionHead"><div><small>GELİŞİM</small><h2>Zaman içindeki ilerleme</h2></div><span>{exams.length} deneme</span></div><ProgressChart exams={exams}/></section>

    <section className="examResults"><div className="resultSectionHead"><div><small>DENEMELER</small><h2>Tüm sonuçlar</h2></div></div>{[...exams].reverse().map(exam=><article className="examCard" key={exam.id}><div className="examTop"><div><time>{new Date(`${exam.exam_date}T12:00:00`).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}</time><h3>{exam.title}</h3></div><strong>{exam.score}<small>/100</small></strong></div><div className="subjectTable"><div className="subjectResultHeader"><span>Ders</span><span>Doğru</span><span>Yanlış</span><span>Boş</span><span>Çalışılacak konular</span></div>{exam.exam_subjects.map(s=><div className="subjectResultRow" key={s.subject_name}><b>{s.subject_name}</b><span className="correct">{s.correct_count}D</span><span className="wrong">{s.wrong_count}Y</span><span>{s.blank_count}B</span><p className={s.review_topics?"":"noTopics"}>{s.review_topics||"—"}</p></div>)}</div>{exam.note&&<div className="teacherNote"><b>Öğretmen notu</b><p>{exam.note}</p></div>}</article>)}{!exams.length&&<div className="noResults">Henüz yayınlanmış bir deneme sonucu yok.</div>}</section>
  </div></main>;
}
