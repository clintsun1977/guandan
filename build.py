"""Build index.html, a standalone page for GitHub Pages, from guandan.html.

guandan.html is written as page content for the claude.ai artifact viewer, which wraps it in its own
<!doctype html>/<head>/<body> skeleton and a small reset. A plain web host serves the file as-is, so this
adds that skeleton and reset around the same content.

Run:  python build.py
"""
from pathlib import Path

here = Path(__file__).parent
src = (here / "guandan.html").read_text(encoding="utf-8")

split = src.index('<div id="app">')
head, body = src[:split].rstrip(), src[split:].strip()

page = f"""<!doctype html>
<html lang="zh-CN">
<head>
<style>html,body{{margin:0}}[hidden]{{display:none!important}}</style>
{head}
</head>
<body>
{body}
</body>
</html>
"""
(here / "index.html").write_text(page, encoding="utf-8")
print("wrote index.html", len(page), "chars")
