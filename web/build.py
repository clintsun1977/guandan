"""Build index.html at the top of the repository (the page GitHub Pages serves) from web/src/ and bot/.

web/src/index.html is the main page: the markup, then in order every file it uses (web/src/ has one per feature, bot/ the
computer players). Each is pulled into the page here:
  //@include web/src/core/cards.js      the line is replaced by that file
  //@include bot/clint/clint-bot.js     the line is replaced by that file
  //@json BOT_MODELS bot/models.json     the line becomes  const BOT_MODELS=<the file's JSON>;
The page gets the <!doctype html>/<head>/<body> skeleton and reset a plain web host needs. Pages publishes the whole
main branch, so the page loads the network weights straight from bot/ (each is checked here against bot/models.json).

Run:  python web/build.py
Then: python -m http.server 8000   (from the top of the repository) and open http://localhost:8000/
(the weights are fetched over http, so opening index.html straight from the disk plays with the Clint rules only)
"""
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path

root = Path(__file__).resolve().parent.parent
web = root / "web"


def inline(src):
    def include(m):
        path = root / m.group(1)
        return path.read_text(encoding="utf-8").removesuffix("\n")

    def as_json(m):
        data = json.loads((root / m.group(2)).read_text(encoding="utf-8"))
        return f"const {m.group(1)}={json.dumps(data, ensure_ascii=False, separators=(',', ':'))};"

    src = re.sub(r"^//@include (\S+)$", include, src, flags=re.M)
    src = re.sub(r"^//@json (\w+) (\S+)$", as_json, src, flags=re.M)
    assert "//@include" not in src and "//@json" not in src
    return src


def check_models():
    catalog = json.loads((root / "bot" / "models.json").read_text(encoding="utf-8"))
    for m in catalog["models"]:
        if not m.get("file"):
            continue  # the Clint rule bot has no weights
        src = root / "bot" / m["path"]
        data = src.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        if digest != m["sha256"]:
            sys.exit(f"{src}: SHA-256 {digest} does not match bot/models.json ({m['sha256']})")
        print(f"  bot/{m['path']}  {len(data):,} bytes  sha256 ok")


def build(version=None):
    src = inline((web / "src" / "index.html").read_text(encoding="utf-8"))
    # stamp the build time as the page version, shown in the lobby and compared between players in a room
    version = version or datetime.now().strftime("%m%d-%H%M")
    assert "const VERSION='dev';" in src
    src = src.replace("const VERSION='dev';", f"const VERSION='{version}';")

    split = src.index('<div id="app">')
    head, body = src[:split].rstrip(), src[split:].strip()
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<style>html,body{{margin:0}}[hidden]{{display:none!important}}</style>
{head}
</head>
<body>
{body}
</body>
</html>
""", version


if __name__ == "__main__":
    page, version = build(sys.argv[1] if len(sys.argv) > 1 else None)
    check_models()
    (root / "index.html").write_text(page, encoding="utf-8")
    print("wrote index.html", len(page), "chars, version", version)
