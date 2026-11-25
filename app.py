from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


ROOT = Path(__file__).resolve().parent

st.set_page_config(page_title="Drawdown visualiser", layout="wide")

html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")
model = (ROOT / "model.js").read_text(encoding="utf-8")
app = (ROOT / "app.js").read_text(encoding="utf-8")

html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>{css}</style>")
html = html.replace('<script defer src="model.js"></script>', f"<script>{model}</script>")
html = html.replace('<script defer src="app.js"></script>', "")
html = html.replace("</body>", f"<script>{app}</script></body>")

components.html(html, height=1200, scrolling=True)
