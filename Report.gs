/*****************************************************************************
 MOREH ACADEMY PORTAL - REPORTS (new file "Reports")
 School-year support for report(), and the data behind the new Reports Overview.
 Requires Code.gs, ReEnroll (histSh_, HIST_COLS, activeSY_). Deploy a NEW version.
*****************************************************************************/
const RP_SY_RE = /^\d{4}-\d{4}$/;

/** A valid school year from the browser, otherwise the active one. */
function reportSY_(sy) { sy = String(sy || '').trim(); return RP_SY_RE.test(sy) ? sy : activeSY_(); }

/** Learner records of one school year.
 *  Active year: Students rows (a blank year counts as active, same as inSY_).
 *  Past year : Students rows still stamped with that year + Enrollment History snapshots of that year. */
function rowsForSY_(sy, stu) {
  stu = stu || rows_('S'); const act = activeSY_();
  if (sy === act) return stu.filter(s => (s.SchoolYear || act) === act);
  const out = stu.filter(s => s.SchoolYear === sy), seen = {};
  out.forEach(s => seen[s.StudentID] = 1);
  const hs = histSh_();
  if (hs.getLastRow() > 1) hs.getRange(2, 1, hs.getLastRow() - 1, HIST_COLS.length).getValues().forEach(r => {
    if (String(r[1]) !== sy || seen[String(r[0])]) return;
    let o = null; try { o = JSON.parse(String(r[10])); } catch (_) {}
    if (!o || !o.StudentID) {                                   // damaged snapshot: keep the summary columns
      o = {}; COLS.forEach(c => o[c] = '');
      Object.assign(o, { StudentID:String(r[0]), SchoolYear:String(r[1]), Classification:String(r[2]), Category:String(r[3]), GradeLevel:String(r[4]),
        Cluster:String(r[5]), Section:String(r[6]), EnrollStatus:String(r[7]), FullName:String(r[0]) });
    }
    seen[o.StudentID] = 1; out.push(o);
  });
  return out;
}

/** Admin / Manager. KPIs for one school year + the list of school years that have data. Encoders: no access (same rule as report()). */
function reportsHome(token, sy) {
  try {
    const u = who_(token, 'admin');
    if (u.Clearance === 'Encoder') throw new Error('Encoders do not have access to reports.');
    const stu = rows_('S'), S0 = reportSY_(sy), all = rowsForSY_(S0, stu), n = f => all.filter(f).length, m = {};
    m[activeSY_()] = 1; m[S0] = 1;
    stu.forEach(s => { if (RP_SY_RE.test(s.SchoolYear)) m[s.SchoolYear] = 1; });
    const hs = histSh_();
    if (hs.getLastRow() > 1) hs.getRange(2, 2, hs.getLastRow() - 1, 1).getValues().forEach(r => { if (RP_SY_RE.test(String(r[0]))) m[String(r[0])] = 1; });
    return ok({ sy:S0, active:activeSY_(), years:Object.keys(m).sort().reverse(),
      kpis:{ total:all.length, enrolled:n(r => r.EnrollStatus === 'Enrolled'), pending:n(r => r.EnrollStatus === 'Not Enrolled'), temp:n(r => r.EnrollStatus === 'Temporary'),
        transferred:n(r => r.EnrollStatus === 'Transferred Out'), cancelled:n(r => r.EnrollStatus === 'Cancelled') } });
  } catch (e) { return fail(e); }
}