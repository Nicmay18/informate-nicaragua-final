#!/usr/bin/env python3
"""
SYSTEM REGISTRY builder for Nicaragua Informate / NIOS.
Scans the repository and emits docs/SYSTEM_REGISTRY.md.
"""
import os
import re
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'
DOCS.mkdir(exist_ok=True)
OUTPUT = DOCS / 'SYSTEM_REGISTRY.md'
HEALTH_OUTPUT = DOCS / 'HEALTH_MATRIX.md'
DEPENDENCY_OUTPUT = DOCS / 'DEPENDENCY_GRAPH.md'

# Directories and files to scan
EXCLUDED = {'node_modules', '.next', '.git', 'Windsurf', 'resources'}
SCAN_DIRS = [
    d for d in os.listdir(ROOT)
    if os.path.isdir(ROOT / d) and d not in EXCLUDED
]

# Classifications based on path patterns
CLASS_PATTERNS = [
    ('CORE', ['lib/editorial/core/']),
    ('EDITORIAL_CRITICAL', ['lib/editor', 'lib/meni', 'lib/eos', 'lib/editorial']),
    ('BUSINESS_CRITICAL', ['lib/nios/business', 'lib/nios/ceo', 'lib/nios/command-center']),
    ('SEO_CRITICAL', ['app/sitemap', 'app/robots', 'lib/seo', 'lib/schemas', 'lib/sitemap']),
    ('PERFORMANCE_CRITICAL', ['lib/analytics', 'lib/perf', 'lib/caching']),
    ('SECURITY_SENSITIVE', ['lib/auth', 'middleware', 'app/api/admin', 'app/api/cron', 'lib/firebase-admin']),
    ('EXPERIMENTAL', ['experiment', 'prototype', 'draft']),
]

IMPORT_RE = re.compile(r"import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]")
DYNAMIC_IMPORT_RE = re.compile(r"import\(['\"]([^'\"]+)['\"]\)")
REQUIRE_RE = re.compile(r"require\(['\"]([^'\"]+)['\"]\)")

def normalize_import(source, current_dir):
    """Try to turn an import string into a path relative to ROOT."""
    if source.startswith('@/'):
        return source[2:].split('/')
    if source.startswith('.') and not source.startswith('./node_modules'):
        parts = Path(current_dir).parts
        for comp in source.split('/'):
            if comp == '..':
                parts = parts[:-1]
            elif comp != '.':
                parts = parts + (comp,)
        return parts
    return None


def infer_classification(rel, content, imports, importers, tests):
    path = rel.lower()
    if '.test.' in path or rel.startswith('tests/'):
        return 'TEST'
    if '__tests__' in path or 'test.' in path:
        return 'TEST'
    if path.endswith('.d.ts'):
        return 'SUPPORT'
    if rel.startswith('public/') or rel.startswith('data/'):
        return 'SUPPORT'
    if 'package.json' in rel or 'tsconfig' in rel or 'next.config' in rel:
        return 'CORE'
    # Next.js app files are routes / API even if no one imports them
    if rel.startswith('app/') or rel.startswith('middleware') or rel.startswith('src/app/'):
        return 'ACTIVE'
    for cls, patterns in CLASS_PATTERNS:
        if any(p in path for p in patterns):
            return cls
    # Heuristics
    if not importers and not tests and not rel.startswith('lib/'):
        return 'DEAD_CODE'
    if not importers and rel.startswith('lib/') and rel.startswith('lib/') and 'index' not in rel:
        return 'ORPHAN'
    if 'legacy' in path or 'old' in path or 'deprecated' in path:
        return 'LEGACY'
    if 'api' in path and 'route' in path:
        return 'ACTIVE'
    if 'page.tsx' in rel or 'layout.tsx' in rel:
        return 'ACTIVE'
    if 'nios' in path:
        return 'BUSINESS_CRITICAL'
    if 'components' in rel:
        return 'ACTIVE'
    if 'utils' in path or 'helpers' in path:
        return 'SUPPORT'
    if 'scripts' in rel:
        return 'SUPPORT'
    if 'hooks' in rel:
        return 'ACTIVE'
    return 'ACTIVE'


def _add_file(files, by_rel, full):
    try:
        rel = full.relative_to(ROOT).as_posix()
    except ValueError:
        return
    if rel in by_rel:
        return
    size = full.stat().st_size
    try:
        content = full.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        content = ''
    lines = content.count('\n') + 1
    files.append({
        'rel': rel,
        'full': full,
        'size': size,
        'lines': lines,
        'content': content,
        'ext': full.suffix,
        'dir': Path(rel).parts[0] if rel else '',
    })
    by_rel[rel] = files[-1]


def main():
    files = []
    by_rel = {}
    # Root-level files
    for name in os.listdir(ROOT):
        if name.startswith('.') or name.endswith('.log'):
            continue
        full = ROOT / name
        if full.is_file():
            _add_file(files, by_rel, full)
    # Scan directories
    for d in SCAN_DIRS:
        p = ROOT / d
        if not p.exists():
            continue
        for root, _, filenames in os.walk(p):
            for name in filenames:
                if name.startswith('.') or name.endswith('.log'):
                    continue
                full = Path(root) / name
                _add_file(files, by_rel, full)

    # Collect imports and reverse map
    file_imports = defaultdict(set)
    reverse = defaultdict(set)
    for f in files:
        current_dir = str(f['full'].parent.relative_to(ROOT)).replace('\\', '/')
        for m in IMPORT_RE.finditer(f['content']):
            src = m.group(1)
            file_imports[f['rel']].add(src)
            if src.startswith('@/') or (src.startswith('.') and not src.startswith('./node_modules')):
                target = normalize_import(src, current_dir)
                if target:
                    target_rel = '/'.join(target)
                    # Match potential file candidates with .ts/.tsx/.js/.jsx
                    for ext in ('.ts', '.tsx', '.js', '.jsx', ''):
                        cand = target_rel + ext
                        if cand in by_rel:
                            reverse[cand].add(f['rel'])
                            break
        for m in DYNAMIC_IMPORT_RE.finditer(f['content']):
            src = m.group(1)
            file_imports[f['rel']].add(src)
            if src.startswith('@/') or (src.startswith('.') and not src.startswith('./node_modules')):
                target = normalize_import(src, current_dir)
                if target:
                    target_rel = '/'.join(target)
                    for ext in ('.ts', '.tsx', '.js', '.jsx', ''):
                        cand = target_rel + ext
                        if cand in by_rel:
                            reverse[cand].add(f['rel'])
                            break
        for m in REQUIRE_RE.finditer(f['content']):
            src = m.group(1)
            file_imports[f['rel']].add(src)
            if src.startswith('@/') or (src.startswith('.') and not src.startswith('./node_modules')):
                target = normalize_import(src, current_dir)
                if target:
                    target_rel = '/'.join(target)
                    for ext in ('.ts', '.tsx', '.js', '.jsx', ''):
                        cand = target_rel + ext
                        if cand in by_rel:
                            reverse[cand].add(f['rel'])
                            break

    # Tests discovery
    test_files = [f['rel'] for f in files if '.test.' in f['rel'] or f['rel'].startswith('tests/')]
    has_test = {}
    for f in files:
        base = Path(f['rel']).stem
        has_test[f['rel']] = any(base in t or Path(t).stem == base for t in test_files)

    # Package.json deps
    pkg = {}
    if (ROOT / 'package.json').exists():
        try:
            pkg = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
        except Exception:
            pass

    # Build output
    out = []
    out.append('# SYSTEM REGISTRY')
    out.append('')
    out.append(f'Generado: {ROOT.name}')
    out.append(f'Total archivos escaneados: {len(files)}')
    out.append('')
    out.append('## Resumen por clasificación')
    out.append('')

    # Summary by class
    counts = defaultdict(int)
    for f in files:
        imps = file_imports[f['rel']]
        impr = reverse[f['rel']]
        tests = has_test[f['rel']]
        cls = infer_classification(f['rel'], f['content'], imps, impr, tests)
        f['cls'] = cls
        counts[cls] += 1

    for cls, cnt in sorted(counts.items(), key=lambda x: -x[1]):
        out.append(f'- **{cls}**: {cnt}')
    out.append('')
    out.append('## Resumen por directorio')
    out.append('')
    dir_counts = defaultdict(int)
    for f in files:
        dir_counts[f['dir']] += 1
    for d, cnt in sorted(dir_counts.items(), key=lambda x: -x[1]):
        out.append(f'- **{d}**: {cnt} archivos')
    out.append('')
    out.append('## Package.json — dependencias relevantes')
    out.append('')
    for k in ['dependencies', 'devDependencies']:
        if k in pkg:
            out.append(f'### {k}')
            for dep, ver in sorted(pkg[k].items()):
                out.append(f'- `{dep}`: {ver}')
            out.append('')

    out.append('## Registro de archivos')
    out.append('')
    out.append('| Archivo | Clase | Líneas | Importado por | Tests | Notas |')
    out.append('|---------|-------|--------|---------------|-------|-------|')
    for f in sorted(files, key=lambda x: x['rel']):
        impr = sorted(reverse[f['rel']])
        importers = ', '.join(f'`{x}`' for x in impr[:5])
        if len(impr) > 5:
            importers += f' (+{len(impr)-5})'
        notes = []
        if not impr and not f['rel'].startswith(('app/', 'public/', 'data/', 'tests/', 'docs/', 'middleware')) and not f['rel'].startswith('src/app/'):
            notes.append('ORPHAN?')
        if '.test.' in f['rel']:
            notes.append('TEST')
        if f['cls'] in ('LEGACY', 'DEAD_CODE'):
            notes.append('REVIEW')
        out.append(f"| `{f['rel']}` | {f['cls']} | {f['lines']} | {importers} | {'Sí' if has_test[f['rel']] else 'No'} | {'; '.join(notes)} |")

    # Dead code / orphan candidates
    out.append('')
    out.append('## Candidatos a revisión (orphan / dead / legacy)')
    out.append('')
    for f in files:
        if f['cls'] in ('DEAD_CODE', 'ORPHAN', 'LEGACY'):
            out.append(f"- `{f['rel']}` ({f['cls']}) — {f['lines']} líneas")
    out.append('')

    # Health matrix
    health_out = []
    health_out.append('# HEALTH MATRIX')
    health_out.append('')
    health_out.append(f'Generado: {ROOT.name} — {len(files)} archivos')
    health_out.append('')
    health_out.append('| Archivo | Estado | Razón |')
    health_out.append('|---------|--------|-------|')
    for f in sorted(files, key=lambda x: x['rel']):
        rel = f['rel']
        cls = f['cls']
        imps = reverse[rel]
        tests = has_test[rel]
        reason = []
        if cls in ('DEAD_CODE', 'ORPHAN'):
            reason.append('sin consumidores')
        if cls == 'LEGACY':
            reason.append('legacy/deprecado')
        if not tests and cls not in ('TEST', 'SUPPORT', 'PUBLIC', 'DATA'):
            reason.append('sin tests')
        if f['lines'] > 400 and not tests:
            reason.append('archivo grande sin tests')
        if cls in ('SECURITY_SENSITIVE',) and not tests:
            reason.append('crítico sin tests')
        if not reason:
            state = 'HEALTHY'
            reason_text = 'OK'
        elif cls in ('DEAD_CODE', 'ORPHAN', 'LEGACY'):
            state = 'DEAD' if cls == 'DEAD_CODE' else 'ORPHAN' if cls == 'ORPHAN' else 'OUTDATED'
            reason_text = '; '.join(reason)
        else:
            state = 'NEEDS_REPAIR'
            reason_text = '; '.join(reason)
        health_out.append(f"| `{rel}` | {state} | {reason_text} |")
    health_out.append('')

    # Dependency graph
    dep_out = []
    dep_out.append('# DEPENDENCY GRAPH')
    dep_out.append('')
    dep_out.append(f'Generado: {ROOT.name} — {len(files)} archivos')
    dep_out.append('')
    dep_out.append('## Archivos con más consumidores (top 20)')
    dep_out.append('')
    top = sorted(files, key=lambda x: len(reverse[x['rel']]), reverse=True)[:20]
    for f in top:
        dep_out.append(f"- `{f['rel']}` → {len(reverse[f['rel']])} importadores")
    dep_out.append('')
    dep_out.append('## Orphans (sin consumidores)')
    dep_out.append('')
    orphans = [f for f in files if not reverse[f['rel']] and f['cls'] not in ('PUBLIC', 'DATA', 'TEST', 'SUPPORT')]
    for f in orphans[:50]:
        dep_out.append(f"- `{f['rel']}` ({f['cls']}) — {f['lines']} líneas")
    if len(orphans) > 50:
        dep_out.append(f'- ... y {len(orphans)-50} más')
    dep_out.append('')
    dep_out.append('## High coupling (>400 líneas + importado)')
    dep_out.append('')
    for f in files:
        if f['lines'] > 400 and reverse[f['rel']]:
            dep_out.append(f"- `{f['rel']}` — {f['lines']} líneas, {len(reverse[f['rel']])} importadores")
    dep_out.append('')

    OUTPUT.write_text('\n'.join(out), encoding='utf-8')
    HEALTH_OUTPUT.write_text('\n'.join(health_out), encoding='utf-8')
    DEPENDENCY_OUTPUT.write_text('\n'.join(dep_out), encoding='utf-8')
    print(f'Escritos {len(files)} archivos en {OUTPUT} y {HEALTH_OUTPUT} y {DEPENDENCY_OUTPUT}')


if __name__ == '__main__':
    main()
