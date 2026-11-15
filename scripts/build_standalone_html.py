"""
Builds a single self-contained HTML file (`output/Preview_3D_Perajut_Standalone.html`)
that runs offline/directly via `file://` (double-click in Chrome/Edge/Firefox)
with inline CSS, JS modules, and embedded Base64 GLTF+BIN+Texture references.
"""

import base64
import json
import mimetypes
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_HTML = os.path.join(ROOT, "output", "Preview_3D_Perajut_Standalone.html")


def read_text(rel_path: str) -> str:
    with open(os.path.join(ROOT, rel_path), "r", encoding="utf-8") as f:
        return f.read()


def encode_file_data_uri(abs_path: str) -> str:
    mime, _ = mimetypes.guess_type(abs_path)
    if not mime:
        mime = "application/octet-stream"
    with open(abs_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def embed_gltf(char_id: str) -> dict:
    folder = os.path.join(ROOT, "ref", char_id)
    gltf_path = os.path.join(folder, "scene.gltf")
    with open(gltf_path, "r", encoding="utf-8") as f:
        gltf = json.load(f)

    for buf in gltf.get("buffers", []):
        uri = buf.get("uri", "")
        if uri and not uri.startswith("data:"):
            buf_path = os.path.join(folder, uri)
            buf["uri"] = encode_file_data_uri(buf_path)

    for img in gltf.get("images", []):
        uri = img.get("uri", "")
        if uri and not uri.startswith("data:"):
            img_path = os.path.join(folder, uri)
            img["uri"] = encode_file_data_uri(img_path)

    return gltf


def strip_module_exports_and_local_imports(js_src: str) -> str:
    # Remove multi-line and single-line local ES imports (`./...`) or `three` imports
    js_src = re.sub(
        r"^\s*import\s+[\s\S]*?from\s+['\"][^'\"]+['\"];?\s*\n?",
        "",
        js_src,
        flags=re.MULTILINE,
    )
    # Strip top-level `export ` keyword so declarations merge cleanly in one module
    js_src = re.sub(r"^export\s+(?=(const|let|var|function|async\s+function|class)\b)", "", js_src, flags=re.MULTILINE)
    return js_src


def main() -> None:
    os.makedirs(os.path.dirname(OUT_HTML), exist_ok=True)

    html = read_text("index.html")
    css = read_text(os.path.join("src", "styles.css"))
    specs_js = strip_module_exports_and_local_imports(read_text(os.path.join("src", "data", "project_specs.js")))
    builder_js = strip_module_exports_and_local_imports(read_text(os.path.join("src", "models", "crochet_builder.js")))
    viewer_js = strip_module_exports_and_local_imports(read_text(os.path.join("src", "viewer.js")))

    # Replace gltfLoader.loadAsync(`./ref/${charId}/scene.gltf`) with embedded parse
    embedded_gltf_payload = {
        "sceptile": embed_gltf("sceptile"),
        "dragonite": embed_gltf("dragonite"),
    }
    viewer_js = viewer_js.replace(
        "const gltf = await gltfLoader.loadAsync(`./ref/${charId}/scene.gltf`);",
        "const gltf = await new Promise((resolve, reject) => gltfLoader.parse(JSON.stringify(window.__EMBEDDED_GLTF__[charId]), '', resolve, reject));",
    )

    # Guard against closing </script> inside JSON/JS strings
    embedded_json = json.dumps(embedded_gltf_payload, separators=(",", ":")).replace("</", "<\\/")
    merged_module = (
        "import * as THREE from 'three';\n"
        "import { OrbitControls } from 'three/addons/controls/OrbitControls.js';\n"
        "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\n\n"
        f"window.__EMBEDDED_GLTF__ = {embedded_json};\n\n"
        "// === project_specs.js ===\n"
        f"{specs_js}\n\n"
        "// === crochet_builder.js ===\n"
        f"{builder_js}\n\n"
        "// === viewer.js ===\n"
        f"{viewer_js}\n"
    ).replace("</script>", "<\\/script>")

    # Inline stylesheet & merged ES module in index.html
    html = html.replace(
        '<link rel="stylesheet" href="./src/styles.css">',
        f"<style>\n{css}\n</style>",
    )
    html = html.replace(
        '<script type="module" src="./src/viewer.js"></script>',
        f'<script type="module">\n{merged_module}\n</script>',
    )

    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)

    size_mb = os.path.getsize(OUT_HTML) / (1024 * 1024)
    print(f"Generated standalone preview: {OUT_HTML} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
