*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --font: 'DM Sans', system-ui, sans-serif;
  --bg: #F7F7F5; --surface: #FFFFFF;
  --border: #E4E4DF; --border-strong: #CECEC8;
  --text: #1A1A18; --text-2: #5C5C58; --text-3: #9C9C96;
  --accent: #D85A30; --accent-bg: #FFF0EB;
  --green: #0F6E56; --green-bg: #E1F5EE; --green-border: #5DCAA5;
  --red: #993C1D; --red-bg: #FAECE7; --red-border: #F0997B;
  --amber: #854F0B; --amber-bg: #FAEEDA; --amber-border: #EF9F27;
  --radius: 10px; --radius-sm: 6px;
}
html { font-size: 16px; }
body { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; -webkit-font-smoothing: antialiased; }
button { font-family: var(--font); font-size: 13px; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: var(--radius-sm); padding: 6px 12px; transition: background 0.15s, border-color 0.15s; line-height: 1; }
button:hover { background: var(--bg); border-color: var(--border-strong); }
button:active { transform: scale(0.98); }
button:disabled { opacity: 0.4; cursor: default; transform: none; }
input[type="number"] { font-family: var(--font); font-size: 13px; border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: var(--radius-sm); padding: 4px 6px; text-align: center; outline: none; -moz-appearance: textfield; }
input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
input[type="number"]:focus { border-color: var(--border-strong); }
