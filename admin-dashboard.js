/* Moreh Academy Admission Portal — canonical administrator dashboard.
   Loaded after public-homepage.js so this is the single active dashboard renderer. */
(function () {
  const nfmtLocal = n => Number(n || 0).toLocaleString('en-US');
  const pctLocal = (n, total) => total ? (Math.round((n || 0) / total * 1000) / 10) + '%' : '0%';
  const escLocal = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const dateLocal = value => {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  };
  const asset = 'https://raw.githubusercontent.com/morehians-cmd/admissionportal/feature/public-homepage-redesign/';
  const campus = asset + 'Moreh%20College%20Under%20Blue%20Skies%20(2).png';

  function panel(title, subtitle, body, extra) {
    return '<section class="ma-redesign-panel '+(extra || '')+'"><div class="ma-redesign-panelhead"><h3>'+title+'</h3>'+(subtitle?'<small>'+subtitle+'</small>':'')+'</div>'+body+'</section>';
  }
  function kpi(title, value, note, tone, action, filter) {
    const attrs = action ? ' data-act="'+action+'" data-v="'+(filter || '')+'" role="button" tabindex="0"' : '';
    return '<div class="ma-redesign-kpi '+tone+'"'+attrs+'><span class="ma-redesign-kpi-icon">'+
      ({blue:'♟',green:'✓',orange:'◷',purple:'▣',grey:'↗'}[tone] || '•')+
      '</span><div><small>'+title+'</small><strong>'+nfmtLocal(value)+'</strong><em>'+note+'</em></div></div>';
  }
  function empty(message) { return '<div class="ma-redesign-empty">'+message+'</div>'; }

  function renderDashboard(r) {
    const d = r.data || {}, st = d.stats || {}, total = Number(st.total || 0);
    const mainKpis =
      kpi('Total Applications',st.total,'All active-year records','blue','dflt','All')+
      kpi('Enrolled Students',st.enrolled,pctLocal(st.enrolled,total)+' of applicants','green','dflt','Enrolled')+
      kpi('Not Yet Enrolled',st.pending,pctLocal(st.pending,total)+' awaiting enrollment','orange','dflt','Not Enrolled')+
      kpi('New Applications Today',st.today,'Registered today','purple');
    const secondary =
      kpi('Cancelled',st.cancelled,'Cancelled applications','grey','dflt','Cancelled')+
      kpi('Transferred Out',st.transferred,'Transferred records','grey','dflt','Transferred Out');

    const grades = Array.isArray(d.gradeLevels) ? d.gradeLevels : (d.cards || []).flatMap(g => g.rows || []);
    const maxGrade = Math.max(1,...grades.map(x => Number(x[1] || 0)));
    const bars = grades.map((x,i) => {
      const value = Number(x[1] || 0), label = String(x[0] || '');
      const height = Math.max(3, Math.round(value / maxGrade * 118));
      return '<div class="ma-redesign-baritem" title="'+escLocal(label)+': '+nfmtLocal(value)+'">'+
        '<b>'+nfmtLocal(value)+'</b><i style="height:'+height+'px;background:'+(i%2?'linear-gradient(180deg,#ffad62,#f1872d)':'linear-gradient(180deg,#4b91f5,#1453bd)')+'"></i>'+
        '<small>'+escLocal(label.replace('Grade ','Gr '))+'</small></div>';
    }).join('');

    const statuses = [
      {label:'Enrolled',value:Number(st.enrolled||0),color:'#2475e8'},
      {label:'Not Yet Enrolled',value:Number(st.pending||0),color:'#f59e0b'},
      {label:'Temporary',value:Number(st.temp||0),color:'#16a085'},
      {label:'Transferred Out',value:Number(st.transferred||0),color:'#94a3b8'},
      {label:'Cancelled',value:Number(st.cancelled||0),color:'#64748b'}
    ];
    const statusTotal = statuses.reduce((sum,x)=>sum+x.value,0);
    let angle = 0;
    const slices = statusTotal ? statuses.map(x => {
      const from=angle; angle += x.value/statusTotal*360;
      return x.color+' '+from+'deg '+angle+'deg';
    }).join(',') : '#e8eef7 0deg 360deg';
    const legend = statuses.map(x=>'<div><i style="background:'+x.color+'"></i><span>'+x.label+'</span><b>'+nfmtLocal(x.value)+'</b></div>').join('');

    const collegeRows = Array.isArray(d.collegeCourses) ? d.collegeCourses : [];
    const collegeBody = collegeRows.length
      ? '<div class="ma-redesign-course-list">'+collegeRows.map(x=>'<div><span>'+escLocal(x[0])+'</span><b>'+nfmtLocal(x[1])+'</b></div>').join('')+'</div>'
      : empty('College course applications are not included in the current Basic Education admissions dataset. No course figures are being estimated or fabricated. College content can be maintained under Website Management → Academics → College.');

    const shell =
      '<div class="ma-redesign-dashboard">'+
        '<section class="ma-redesign-masthead">'+
          '<div class="ma-redesign-logos">'+
            '<img src="'+asset+'mgic-logo.png" alt="Moreh Global Innovative College">'+
            '<img src="'+asset+'moreh-academy-logo.png" alt="Moreh Academy">'+
            '<img src="'+asset+'moreh-college-logo.png" alt="Moreh College">'+
          '</div>'+
          '<img class="ma-redesign-campus" src="'+campus+'" alt="Moreh Academy campus under blue skies">'+
          '<div class="ma-redesign-motto">LEARN · GROW · EXCEL</div>'+
        '</section>'+
        '<section class="ma-redesign-welcome"><div><span>MOREH ACADEMY · ADMINISTRATION PORTAL</span><h2>'+escLocal((typeof greet==='function'?greet():'Welcome')+', '+(S.user.FullName || 'Administrator'))+'!</h2><p>Here is your enrollment overview for School Year '+escLocal((S.cfg && S.cfg.sy) || '')+'.</p></div><div class="ma-redesign-welcome-mark">MA</div></section>'+
        '<section class="ma-redesign-kpis">'+mainKpis+'</section>'+
        '<section class="ma-redesign-secondary">'+secondary+'</section>'+
        '<section class="ma-redesign-analytics">'+
          panel('Enrollment by Grade Level','15 Basic Education levels','<div class="ma-redesign-bars">'+(bars || empty('No grade-level records for this school year.'))+'</div>')+
          panel('Application Status',nfmtLocal(statusTotal)+' records','<div class="ma-redesign-status"><div class="ma-redesign-donut" style="background:conic-gradient('+slices+')"><div><b>'+nfmtLocal(statusTotal)+'</b><small>Records</small></div></div><div class="ma-redesign-legend">'+legend+'</div></div>')+
          panel('College Course Overview','Data availability',collegeBody)+
        '</section>'+
        '<section class="ma-redesign-two">'+
          panel('Registration Trend','Last 14 days','<div id="ma-redesign-trend">'+empty('Loading registration trend…')+'</div>')+
          panel('School Calendar & Upcoming Events','Published events','<div id="ma-redesign-events">'+empty('Loading events…')+'</div>')+
        '</section>'+
        '<section class="ma-redesign-bottom">'+
          panel('Incomplete Application Checklist','Missing requirements, consent and certificates','<div id="ma-redesign-incomplete">'+empty('Loading application checklist…')+'</div>')+
          (typeof FULL==='function' && FULL() ? panel('Recent System Activity','Protected audit feed','<div id="ma-redesign-activity">'+empty('Loading recent activity…')+'</div>') : '')+
          panel('Quick Actions','Common administrator tasks',
            '<div class="ma-redesign-actions">'+
              '<button type="button" data-act="nav" data-v="adm"><b>▤</b><span>Admission Operations</span></button>'+
              '<button type="button" data-act="dflt" data-v="Enrolled"><b>✓</b><span>Enrolled Students</span></button>'+
              (typeof FULL==='function' && FULL() ? '<button type="button" data-act="nav" data-v="rep"><b>▥</b><span>Reports & Analytics</span></button>' : '')+
              (typeof SYS==='function' && SYS() ? '<button type="button" data-act="nav" data-v="webm"><b>⌂</b><span>Website Management</span></button><button type="button" data-act="nav" data-v="um"><b>♙</b><span>User Management</span></button>' : '')+
              '<button type="button" data-act="nav" data-v="ev"><b>▦</b><span>Campus Bulletin</span></button>'+
            '</div>')
        +'</section>'+
        '<footer class="ma-redesign-footer"><b>MOREH ACADEMY</b><span>School of Righteousness and Excellence</span><span>Learn · Grow · Excel</span></footer>'+
      '</div>';

    $('view').innerHTML = shell;
    loadDashboardPanels();
  }

  function loadDashboardPanels() {
    google.script.run.withSuccessHandler(res => {
      const box=$('ma-redesign-trend'); if(!box)return;
      if(!res || !res.success || !res.data || !Array.isArray(res.data.spark) || !res.data.spark.length) {
        box.innerHTML=empty('No registration trend data is available yet.'); return;
      }
      const vals=res.data.spark, max=Math.max(1,...vals);
      box.innerHTML='<div class="ma-redesign-trendbars">'+vals.map((v,i)=>
        '<div title="'+nfmtLocal(v)+' registrations"><b>'+nfmtLocal(v)+'</b><i style="height:'+Math.max(3,Math.round(v/max*78))+'px"></i><small>'+(i===0?'14d':i===6?'7d':i===13?'Today':'')+'</small></div>'
      ).join('')+'</div><div class="ma-redesign-trendfoot"><span>Daily registrations</span><b>'+(res.data.trend ? nfmtLocal(res.data.trend.week) : '0')+' this week</b></div>';

      const target=$('ma-redesign-incomplete'); if(!target)return;
      const a=res.data.attention || {}, counts=a.counts || {}, rows=a.rows || [];
      const summary='<div class="ma-redesign-check-counts">'+
        '<span><b>'+nfmtLocal(counts.req||0)+'</b> Requirements</span>'+
        '<span><b>'+nfmtLocal(counts.consent||0)+'</b> Consent</span>'+
        '<span><b>'+nfmtLocal(counts.cert||0)+'</b> Certificates</span></div>';
      const list=rows.length ? rows.slice(0,8).map(x=>
        '<button type="button" class="ma-redesign-check-row" data-act="dflt" data-v="All">'+
          '<span><b>'+escLocal(x.name)+'</b><small>'+escLocal(x.grade)+' · '+escLocal(x.status)+'</small></span>'+
          '<em>'+escLocal((x.badges||[]).join(' · '))+'</em></button>'
      ).join('') : empty('No incomplete application requirements were found.');
      target.innerHTML=summary+list+'<div class="ma-redesign-panel-link"><button type="button" data-act="nav" data-v="adm">Open Admission Operations →</button></div>';
    }).withFailureHandler(()=>{
      const box=$('ma-redesign-trend');if(box)box.innerHTML=empty('Registration trend is temporarily unavailable.');
      const target=$('ma-redesign-incomplete');if(target)target.innerHTML=empty('Application checklist is temporarily unavailable.');
    }).dashboardExtra(S.token);

    if(typeof FULL==='function' && FULL()) {
      google.script.run.withSuccessHandler(res=>{
        const box=$('ma-redesign-activity');if(!box)return;
        const items=res&&res.success&&res.data&&Array.isArray(res.data.items)?res.data.items:[];
        box.innerHTML=items.length?items.slice(0,8).map(x=>
          '<div class="ma-redesign-activity-row"><span></span><div><b>'+escLocal(String(x.action||'System activity').replace(/[._]/g,' '))+'</b><small>'+escLocal(x.actor||'System')+(x.role?' · '+escLocal(x.role):'')+'</small></div><time>'+escLocal([x.date,x.time].filter(Boolean).join(' · '))+'</time></div>'
        ).join(''):empty('No recent system activity.');
      }).withFailureHandler(()=>{
        const box=$('ma-redesign-activity');if(box)box.innerHTML=empty('Activity is temporarily unavailable.');
      }).getRecentActivity(S.token,10);
    }

    google.script.run.withSuccessHandler(res=>{
      const box=$('ma-redesign-events');if(!box)return;
      const events=res&&res.success&&Array.isArray(res.data)?res.data:[];
      const today=new Date();today.setHours(0,0,0,0);
      const upcoming=events.filter(e=>e.EventDate && new Date(e.EventDate+'T00:00:00')>=today)
        .sort((a,b)=>(a.EventDate+a.EventTime).localeCompare(b.EventDate+b.EventTime)).slice(0,5);
      box.innerHTML=upcoming.length?upcoming.map(e=>
        '<div class="ma-redesign-event"><div class="ma-redesign-event-date"><b>'+escLocal(String(e.EventDate).slice(8,10))+'</b><small>'+escLocal(String(e.EventDate).slice(0,7))+'</small></div><div><b>'+escLocal(e.Title||'Untitled event')+'</b><small>'+escLocal([e.EventTime,e.Venue].filter(Boolean).join(' · '))+'</small></div></div>'
      ).join(''):empty('No upcoming events are scheduled.');
    }).withFailureHandler(()=>{
      const box=$('ma-redesign-events');if(box)box.innerHTML=empty('Calendar data is temporarily unavailable.');
    }).getEvents(S.token);
  }

  window.homeAdmin = function () {
    const sy=(S.cfg && S.cfg.sy) || '';
    head('Dashboard','Enrollment overview for School Year '+sy);
    call('dashboard',[T()],renderDashboard);
  };
})();