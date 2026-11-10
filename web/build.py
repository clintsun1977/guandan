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


# danMCai-reason (guandanai's search bot 9001): the bundle built by guandanai's web/docs/REASON_BOT_INTEGRATION.md (section 4.1),
# copied unchanged; every file must be byte for byte what was checked against that guide's table
REASON = {
    "reason/assets/search-worker.mjs": ("10079e4bddc771241cdb617ce7dab799a08870b9aca87cb97e77b6d993ba27a4", 89142),
    "reason/assets/reason-client.mjs": ("869ab81e3975e82bb21b8c2e49d73b4a6e57f3d24fce5d8f1493678002e27f0f", 51063),
    "reason/assets/vendor/ort.wasm.min.mjs": ("c21d9c326d453a4a61398270c804d5979e118540597cb0c07f7b3d64e6098234", 53725),
    "reason/assets/vendor/ort-wasm-simd-threaded.mjs": ("30ed0b5cd1182ede931fea448afb567d4dc705ec957af09f108a2be5f770dac3", 24738),
    "reason/assets/vendor/ort-wasm-simd-threaded.wasm": ("4b884c203b0fa48d057be3332c65513ff85aa3c5bddd6946acc0fab7ecda001d", 14848852),
    "reason/models/bot-017.onnx": ("462afc99ee6bcfb788871d7a8f84d4298c008d57465c62d48ca1792cdb11b3f7", 5368650),
    "reason/models/belief-v1-16d76783.onnx": ("16d767830e4536180fac56d744e95934b7525ab67b18d27df4f33066033d65e9", 3931285),
}


def check_reason():
    for rel, (sha, size) in REASON.items():
        data = (root / "bot" / rel).read_bytes()
        if hashlib.sha256(data).hexdigest() != sha or len(data) != size:
            sys.exit(f"bot/{rel}: SHA-256 or size does not match the danMCai-reason bundle")
        print(f"  bot/{rel}  {len(data):,} bytes  sha256 ok")


def build(version=None):
    src = inline((web / "src" / "index.html").read_text(encoding="utf-8"))
    # stamp the build time as the page version, shown in the lobby and compared between players in a room
    version = version or datetime.now().strftime("%m%d-%H%M")
    assert "const VERSION='dev';" in src and "const APP_HASH='dev';" in src
    # the round records name the page by its content: c1977 (this project) and five hex digits of its SHA-256
    app_hash = "c1977" + hashlib.sha256(src.encode("utf-8")).hexdigest()[:5]
    src = src.replace("const VERSION='dev';", f"const VERSION='{version}';")
    src = src.replace("const APP_HASH='dev';", f"const APP_HASH='{app_hash}';")

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
    check_reason()
    # Separate full-information coach, built from the verified upstream engine plus our adapter.
    worker = (root / "bot/reason/assets/search-worker.mjs").read_text(encoding="utf-8")
    extension = (root / "bot/reason/open-coach-extension.js").read_text(encoding="utf-8")
    (root / "bot/reason/assets/open-coach-worker.mjs").write_text(worker + "\n" + extension, encoding="utf-8")
    (root / "index.html").write_text(page, encoding="utf-8")
    print("wrote index.html", len(page), "chars, version", version)
