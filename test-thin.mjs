fetch('https://nicaraguainformate.com/api/admin/dashboard-calidad?admin_api_key=sk_informate_admin_2026_xyz')
.then(r => r.text())
.then(t => {
  console.log('Raw response:', t);
})
.catch(e => console.error('Error:', e.message));
