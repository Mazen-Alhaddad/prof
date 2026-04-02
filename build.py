#!/usr/bin/env python3
"""
build.py - يدمج تطبيقات الاختبار داخل اللانشر في ملف واحد
المخرجات: dist/index.html
"""

import os, re

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(SRC_DIR, 'dist')
os.makedirs(DIST_DIR, exist_ok=True)

def read(fname):
    path = os.path.join(SRC_DIR, fname)
    if not os.path.exists(path):
        print(f"⚠️  الملف غير موجود: {fname}")
        return ""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def escape_for_js_template(html):
    html = html.replace('\\', '\\\\')
    html = html.replace('`', '\\`')
    html = html.replace('${', '\\${')
    html = html.replace('</script>', '<\\/script>')
    return html

print("📖 قراءة الملفات...")

launcher = read('index.html')
bio      = read('bio.html')
grammar  = read('grammar.html')
vocab    = read('vocab.html')

apps_js = f"""
<script>
const APPS = {{
  "bio":     {{ title: "🔬 كيمياء + أحياء", html: `{escape_for_js_template(bio)}` }},
  "grammar": {{ title: "📝 قواعد اللغة",    html: `{escape_for_js_template(grammar)}` }},
  "vocab":   {{ title: "📚 مفردات اللغة",   html: `{escape_for_js_template(vocab)}` }}
}};

function openApp(appKey) {{
  const app = APPS[appKey];
  if (!app) return;

  // إنشاء blob URL لعزل كل تطبيق بسياق JavaScript منفصل
  const blob = new Blob([app.html], {{type: 'text/html'}});
  const url = URL.createObjectURL(blob);

  const appContainer = document.getElementById('appContainer');
  appContainer.innerHTML = '';

  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
  iframe.onload = () => URL.revokeObjectURL(url);
  appContainer.appendChild(iframe);

  document.getElementById('appStyles').innerHTML = '';
  document.getElementById('overlayTitle').textContent = app.title;
  document.getElementById('overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}}

function closeApp() {{
  document.getElementById('overlay').classList.remove('active');
  document.getElementById('appContainer').innerHTML = '';
  document.getElementById('appStyles').innerHTML = '';
  document.body.style.overflow = '';
}}
</script>
"""

output = launcher.rstrip()
output = re.sub(r'\s*</body>\s*</html>\s*$', '', output)
output += '\n' + apps_js.strip() + '\n\n</body>\n</html>\n'

out_path = os.path.join(DIST_DIR, 'index.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(output)

print(f"✅ تم البناء بنجاح: {out_path}")
print(f"📦 الحجم النهائي: {len(output.encode('utf-8')) / 1024:.2f} KB")
