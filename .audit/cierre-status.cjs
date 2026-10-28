const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const mode = process.argv[2] || 'github';
async function main() {
  if (mode === 'github') {
    const c = execFileSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'],
    });
    const token = c.split(/\r?\n/).find(l => l.startsWith('password='))?.slice(9);
    const api = async path => {
      const r = await fetch('https://api.github.com/' + path, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
      return r.ok ? r.json() : { httpStatus: r.status };
    };
    const repo = 'repos/Nicmay18/informate-nicaragua-final/';
    const [user, master, protection, collaborators, deployments] = await Promise.all([
      api('user'), api(repo + 'branches/master'), api(repo + 'branches/master/protection'),
      api(repo + 'collaborators'), api(repo + 'deployments?environment=Production&per_page=5'),
    ]);
    const prs = [];
    for (const n of [2, 4, 10, 11, 12, 13, 14, 15, 16, ...process.argv.slice(3).map(Number)]) {
      const p = await api(repo + 'pulls/' + n);
      if (!p.head) { prs.push({ number: n, ...p }); continue; }
      const [reviews, checks, statuses] = await Promise.all([
        api(repo + `pulls/${n}/reviews`), api(repo + `commits/${p.head.sha}/check-runs?per_page=100`),
        api(repo + `commits/${p.head.sha}/status`),
      ]);
      prs.push({ number: n, state: p.state, merged: p.merged, author: p.user.login, head: p.head.sha, branch: p.head.ref,
        base: p.base.sha, mergeable: p.mergeable, mergeable_state: p.mergeable_state, url: p.html_url,
        requested_reviewers: p.requested_reviewers.map(x => x.login),
        reviews: Array.isArray(reviews) ? reviews.map(x => ({ user: x.user.login, state: x.state, commit: x.commit_id })) : reviews,
        checks: checks.check_runs?.map(x => ({ name: x.name, conclusion: x.conclusion, status: x.status, url: x.html_url })),
        statuses: statuses.statuses?.map(x => ({ context: x.context, state: x.state, url: x.target_url })) });
    }
    const result = { at: new Date().toISOString(), user: user.login, master: master.commit?.sha, protection,
      collaborators: Array.isArray(collaborators) ? collaborators.map(x => ({ login: x.login, role: x.role_name })) : collaborators,
      deployments: Array.isArray(deployments) ? deployments.map(x => ({ id: x.id, sha: x.sha, environment: x.environment, created_at: x.created_at })) : deployments, prs };
    fs.writeFileSync('.audit/cierre-status.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } else if (mode === 'vercel') {
    const auth = JSON.parse(fs.readFileSync(process.env.APPDATA + '/com.vercel.cli/Data/auth.json', 'utf8'));
    const project = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
    const r = await fetch(`https://api.vercel.com/v13/deployments/nicaraguainformate.com?teamId=${project.orgId}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (!r.ok) { console.log('Vercel HTTP', r.status); return; }
    const d = await r.json();
    const result = { at: new Date().toISOString(), id: d.id, url: d.url, alias: d.alias, target: d.target, readyState: d.readyState, createdAt: d.createdAt,
      gitSource: d.gitSource, commit: d.meta?.githubCommitSha, ref: d.meta?.githubCommitRef };
    fs.writeFileSync('.audit/cierre-vercel.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  }
}
main().catch(e => { console.error(e.name); process.exitCode = 1; });
