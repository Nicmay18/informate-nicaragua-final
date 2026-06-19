<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#0f1b33">
    <title>Nicaragua Informate â€” Noticias de Nicaragua</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0f1b33;
            --primary-light: #1a2d4d;
            --accent: #c9a96e;
            --accent-hover: #b8945a;
            --danger: #dc2626;
            --bg: #f5f4f0;
            --surface: #ffffff;
            --surface-2: #f8f8f6;
            --text: #1a1a1a;
            --text-secondary: #5a5a5a;
            --text-muted: #8a8a8a;
            --border: #e5e3de;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
            --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
            --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
            --radius-sm: 8px;
            --radius-md: 14px;
            --radius-lg: 20px;
            --radius-xl: 28px;
            --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        [data-theme="dark"] {
            --bg: #0a0e1a;
            --surface: #111827;
            --surface-2: #1a1f2e;
            --text: #f0f0f0;
            --text-secondary: #a0a0a0;
            --text-muted: #6b7280;
            --border: #1f2937;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
            --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
            --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html { scroll-behavior: smooth; }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.5;
            transition: var(--transition);
            -webkit-font-smoothing: antialiased;
            padding-bottom: 80px;
        }
        img { max-width: 100%; height: auto; display: block; }
        a { text-decoration: none; color: inherit; transition: var(--transition); }
        ul { list-style: none; }
        button { font-family: inherit; cursor: pointer; border: none; background: none; }

        /* ===== TOP BAR: INDICADORES + CLIMA + HORA ===== */
        .topbar {
            background: var(--primary);
            color: rgba(255,255,255,0.85);
            font-size: 0.72rem;
            padding: 8px 16px;
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
        }
        .topbar::-webkit-scrollbar { display: none; }

        .topbar-inner {
            display: flex;
            align-items: center;
            gap: 20px;
            max-width: 1280px;
            margin: 0 auto;
        }

        .topbar-item {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
        }

        .topbar-item .label {
            color: var(--accent);
            font-weight: 600;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .topbar-item .value {
            font-weight: 700;
            font-variant-numeric: tabular-nums;
