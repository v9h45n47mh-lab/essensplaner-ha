const ESSENSPLANER_VERSION = '1.2.0';

class EssensplanerCard extends HTMLElement {
  setConfig(config) {
    this.config = config || {};
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._view = 'week';
    this._weekStart = this._weekStart || this.mondayOf(this.dateKey(new Date()));
    this._modal = null;
    this._notice = '';
    this._noticeError = false;
    this._people = [];
    this._randomPeople = ['Vera', 'Manuel', 'Paul'];
    this._shownSuggestionIds = [];
    this._suggestion = null;
    this._pendingMeal = null;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.isManager() && this._view === 'settings') this._view = 'week';
    if (!this._modal) this.render();
  }
  getCardSize() { return 6; }
  getState() {
    const states = this._hass?.states || {};
    const valid = (s) => s?.attributes?.week_start && Array.isArray(s.attributes.days) && Array.isArray(s.attributes.meals);
    const exact = states['sensor.essensplaner_wochenplan'];
    return valid(exact) ? exact : Object.values(states).find(valid) || null;
  }
  isManager() {
    const user = this._hass?.user;
    const name = String(user?.name || '').toLocaleLowerCase();
    return Boolean(user?.is_admin || /(^|[^a-z])(vera|manuel)([^a-z]|$)/.test(name));
  }
  canDeleteEntry(entry) {
    if (!entry) return false;
    if (this.isManager()) return true;
    const user = this._hass?.user;
    if (!user?.id) return false;
    if (Object.hasOwn(entry, 'planned_by_user_id')) return entry.planned_by_user_id === user.id;
    return Boolean(entry.planned_by && String(entry.planned_by).trim().toLocaleLowerCase() === String(user.name || '').trim().toLocaleLowerCase());
  }
  icon(name) {
    const paths = {
      edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
      delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
      previous: 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z',
      next: 'M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name] || ''}"/></svg>`;
  }
  dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  mondayOf(dateString) {
    const date = new Date(`${dateString}T12:00:00`);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return this.dateKey(date);
  }
  shiftWeek(delta) {
    const date = new Date(`${this._weekStart}T12:00:00`);
    date.setDate(date.getDate() + delta * 7);
    const next = this.mondayOf(this.dateKey(date));
    const attributes = this.getState()?.attributes;
    if (!attributes?.entries && next !== attributes?.week_start) {
      this.notify('Bitte nach dem Update Home Assistant neu starten und die App neu laden, damit alle Kalenderwochen verfügbar sind.', true);
      return;
    }
    this._weekStart = next;
    this.render();
  }
  entryFor(date) {
    const attributes = this.getState()?.attributes || {};
    return attributes.entries ? attributes.entries[date] || null : (attributes.days || []).find((day) => day.date === date)?.entry || null;
  }
  weekDays() {
    const attributes = this.getState()?.attributes;
    if (!attributes || (!attributes.entries && this._weekStart !== attributes.week_start)) return [];
    return Array.from({ length: 7 }, (_, offset) => {
      const day = new Date(`${this._weekStart}T12:00:00`);
      day.setDate(day.getDate() + offset);
      const date = this.dateKey(day);
      return { date, entry: this.entryFor(date) };
    });
  }
  async call(service, data = {}) {
    const state = this.getState();
    const entityId = state?.entity_id || Object.entries(this._hass?.states || {}).find(([, value]) => value === state)?.[0];
    if (!entityId) throw new Error('Der Wochenplan-Sensor ist nicht verfügbar. Bitte in Access Control zum Lesen und Bedienen freigeben.');
    return this._hass.callService('essensplaner', service, { ...data, entity_id: entityId });
  }
  esc(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  time(value) { return value ? new Date(value).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''; }
  weekLabel(start, end) {
    return start && end ? `${new Date(start + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${new Date(end + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Wird geladen …';
  }
  render() {
    if (!this.shadowRoot || !this._hass) return;
    const state = this.getState();
    const a = state?.attributes || {};
    const meals = a.meals || [];
    const weekStart = this._weekStart;
    const weekEnd = weekStart ? (() => { const end = new Date(`${weekStart}T12:00:00`); end.setDate(end.getDate() + 6); return this.dateKey(end); })() : a.week_end;
    const days = this.weekDays();
    const dayRows = days.map((d, index) => {
      const entry = d.entry;
      return `<article class="day ${entry ? 'planned' : 'empty'}" data-day="${d.date}">
        <div class="date"><b>${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][index]}</b><small>${new Date(d.date + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</small></div>
        <div class="day-content"><button class="day-main" data-action="open-day" data-date="${d.date}"><strong>${entry ? this.esc(entry.title) : 'Essen einplanen'}</strong><small>${entry ? `Eingetragen von ${this.esc(entry.planned_by)}${entry.planned_at ? ` · ${this.time(entry.planned_at)}` : ''}` : 'Tippen zum Eintragen'}</small></button>${entry?.link ? `<a class="meal-link" href="${this.esc(entry.link)}" target="_blank" rel="noopener" data-stop>Link ↗</a>` : ''}</div>
        <div class="day-actions">${entry ? `<button class="icon-button" data-action="open-day" data-date="${d.date}" aria-label="Bearbeiten" title="Bearbeiten">✎</button>${this.canDeleteEntry(entry) ? `<button class="icon-button danger" data-action="confirm-delete-day" data-date="${d.date}" aria-label="Eintrag löschen" title="Eintrag löschen">${this.icon('delete')}</button>` : ''}` : `<button class="icon-button add" data-action="open-day" data-date="${d.date}" aria-label="Essen einplanen" title="Essen einplanen">+</button>`}</div>
      </article>`;
    }).join('');
    const mealRows = meals.map((meal) => `<article class="meal-row"><div class="meal-main"><strong>${this.esc(meal.name)}</strong><span class="tag ${meal.meat ? 'meat' : 'veg'}">${meal.meat ? 'Mit Fleisch' : 'Vegetarisch'}</span><small>Isst gern: ${this.esc((meal.eaters || []).join(', ') || 'Keine Personen zugeordnet')}</small></div><div class="row-actions"><button data-action="edit-meal" data-id="${this.esc(meal.id)}" aria-label="Gericht bearbeiten" title="Gericht bearbeiten">${this.icon('edit')}</button><button class="danger" data-action="confirm-delete-meal" data-id="${this.esc(meal.id)}" aria-label="Gericht löschen" title="Gericht löschen">${this.icon('delete')}</button></div></article>`).join('');
    const randomMeal = this._suggestion?.meal;
    const randomMarkup = `<section class="random-view"><div class="page-actions"><h2>Zufallsrezept</h2></div><p class="hint">Wähle aus, wer mitisst. Der Vorschlag kommt aus euren gespeicherten Gerichten.</p><div class="check-grid random-people">${['Vera', 'Manuel', 'Maximilian', 'Paul'].map((person) => `<label class="person-choice"><input type="checkbox" data-random-person="${person}" ${this._randomPeople.includes(person) ? 'checked' : ''}> ${person}</label>`).join('')}</div><div class="random-buttons"><button class="primary" data-action="suggest">${this._suggestion ? 'Gericht vorschlagen' : 'Zufallsgericht vorschlagen'}</button>${this._suggestion ? '<button data-action="another">Anderes Gericht</button>' : ''}</div>${randomMeal ? `<article class="suggestion"><div class="meal-main"><strong>${this.esc(randomMeal.name)}</strong><span class="tag ${randomMeal.meat ? 'meat' : 'veg'}">${randomMeal.meat ? 'Mit Fleisch' : 'Vegetarisch'}</span><small>Isst gern: ${this.esc((randomMeal.eaters || []).join(', '))}</small></div><p class="hint">${this.esc(this._suggestion.reason)}</p><button class="primary" data-action="plan-suggestion">Im Essensplan einplanen</button></article>` : ''}</section>`;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color,#212121);font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:14px}*{box-sizing:border-box}ha-card{display:block;background:var(--ha-card-background,var(--card-background-color,#fff));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#e0e0e0));border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none);overflow:hidden}
      button,input,select{font:inherit}button{color:var(--primary-color,#03a9f4);border:0;background:transparent;border-radius:var(--ha-button-border-radius,20px);padding:9px 14px;cursor:pointer;line-height:1.35;font-weight:500}button:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}button.primary{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff)}button.danger{color:var(--error-color,#db4437)}
      .card-top{display:flex;align-items:stretch;border-bottom:1px solid var(--divider-color,#e0e0e0);min-height:52px}nav{display:flex;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;padding:0 8px}nav::-webkit-scrollbar{display:none}nav button{flex-shrink:0;border-radius:0;border-bottom:2px solid transparent;color:var(--secondary-text-color,#727272);padding:16px 14px;white-space:nowrap;font-size:14px}nav button.selected{border-bottom-color:var(--primary-color,#03a9f4);color:var(--primary-color,#03a9f4)}.settings-button{width:50px;flex-shrink:0;display:grid;place-items:center;padding:12px;border-radius:0;color:var(--secondary-text-color,#727272)}.settings-button.selected{color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}.settings-button svg{width:23px;height:23px;fill:currentColor}
      main{padding:8px 16px 16px}.page-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0}.page-actions h2{font-size:18px;font-weight:500;margin:0}.toolbar{display:flex;align-items:center;gap:8px}.week{display:flex;justify-content:space-between;align-items:center;gap:4px;margin:8px 0 12px}.week strong{flex:1;min-width:0;text-align:center}.week-nav{display:grid;place-items:center;flex-shrink:0;width:48px;height:48px;padding:6px;border-radius:50%}.week-nav svg{width:36px;height:36px;fill:currentColor}.days{display:grid;gap:0}.day{display:grid;grid-template-columns:54px minmax(0,1fr) auto;align-items:center;gap:12px;padding:10px 2px;border-bottom:1px solid var(--divider-color,#e0e0e0);min-height:72px}.day:first-child{border-top:1px solid var(--divider-color,#e0e0e0)}.date{display:grid;text-align:center;gap:3px}.date b{font-size:14px;font-weight:600}.date small,.meal-main small,.day-main small,.hint{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#727272)}.day-content{display:grid;justify-items:start;min-width:0;gap:2px}.day-main{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:0;padding:4px 0;text-align:left;color:var(--primary-text-color,#212121);border-radius:4px}.day-main strong{font-size:15px;font-weight:500;overflow-wrap:anywhere}.day.empty .day-main strong{color:var(--secondary-text-color,#727272);font-weight:400}.meal-link{color:var(--primary-color,#03a9f4);font-size:12px}.day-actions{display:flex;gap:0}.icon-button{display:grid;place-items:center;width:40px;height:40px;padding:6px;font-size:18px}.icon-button.add{font-size:23px}.icon-button.danger,.row-actions .danger{color:var(--error-color,#db4437)}
      .notice{position:fixed;z-index:10001;top:calc(10px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);max-width:min(560px,calc(100% - 24px));padding:10px 12px;margin:8px 0;border-radius:8px;background:var(--secondary-background-color,#f5f5f5);color:var(--primary-text-color,#212121)}.notice.error{background:var(--error-color,#db4437);color:#fff}.form-notice{position:static;transform:none;max-width:none;margin:0 0 14px}.empty-state{padding:24px 10px;text-align:center;color:var(--secondary-text-color,#727272)}
      .meal-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.meal-main{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}.meal-main strong{font-size:15px;font-weight:500;overflow-wrap:anywhere}.tag{font-size:11px;padding:3px 8px;border-radius:12px}.tag.meat{background:color-mix(in srgb,var(--warning-color,#ff9800) 14%,transparent);color:var(--warning-color,#ef6c00)}.tag.veg{background:color-mix(in srgb,var(--success-color,#4caf50) 14%,transparent);color:var(--success-color,#388e3c)}.row-actions{display:flex;gap:2px;flex-shrink:0}.row-actions button{display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;padding:8px;border-radius:50%}.row-actions svg,.icon-button svg{width:22px;height:22px;fill:currentColor}.version{margin-top:18px;padding-top:12px;border-top:1px solid var(--divider-color,#e0e0e0);font-size:12px;color:var(--secondary-text-color,#727272);text-align:right}.random-view{max-width:680px}.random-people{margin:8px 0 18px}.random-buttons{display:flex;gap:8px;flex-wrap:wrap}.suggestion{display:grid;gap:12px;margin-top:18px;padding:16px;border:1px solid var(--divider-color,#ddd);border-radius:12px;background:var(--secondary-background-color,#f8f8f8)}.suggestion .meal-main strong{font-size:18px}
      .overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.42)}.dialog{width:min(560px,100%);max-height:min(90vh,780px);overflow:auto;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);border-radius:16px;box-shadow:0 12px 40px #0004;padding:20px}.dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.dialog-head h2{font-size:20px;font-weight:500;margin:0}.close{font-size:23px;width:38px;height:38px;padding:4px}.form-grid{display:grid;gap:14px}.field{display:grid;gap:6px}.field>span,.group-label{font-size:13px;font-weight:500}.field input[type=text],.field input[type=url],.field select,.search-select{width:100%;min-height:44px;border:1px solid var(--divider-color,#ccc);border-radius:8px;padding:10px 12px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#212121)}.choice-row,.check-grid{display:flex;flex-wrap:wrap;gap:8px}.choice,.person-choice{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--divider-color,#ddd);border-radius:22px;padding:9px 12px;cursor:pointer}.choice:has(input:checked),.person-choice:has(input:checked){border-color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 9%,transparent)}input[type=checkbox],input[type=radio]{accent-color:var(--primary-color,#03a9f4);width:16px;height:16px;margin:0}.saved-meal-picker{display:grid;gap:8px}.saved-meal-picker select{width:100%;min-height:48px;padding:10px 12px;border:1px solid var(--divider-color,#ccc);border-radius:8px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#212121);font:inherit}.check-grid{margin-top:8px}.dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px;padding-top:12px;border-top:1px solid var(--divider-color,#e0e0e0)}.dialog .hint{margin-top:-4px}.confirm-copy{font-size:14px;line-height:1.5}
      @media(max-width:520px){main{padding:6px 12px 12px}.day{grid-template-columns:44px minmax(0,1fr) auto;gap:8px;min-height:68px}.icon-button{width:34px;height:38px}.row-actions{flex-direction:row;align-items:center}.dialog{padding:16px}.tabs button{padding:15px 12px}}
    </style><ha-card><div class="card-top"><nav aria-label="Essensplaner"><button data-action="view" data-view="week" class="${this._view === 'week' ? 'selected' : ''}">Essensplan</button><button data-action="view" data-view="random" class="${this._view === 'random' ? 'selected' : ''}">Zufallsrezept</button></nav>${this.isManager() ? `<button class="settings-button ${this._view === 'settings' ? 'selected' : ''}" data-action="view" data-view="settings" aria-label="Einstellungen" title="Einstellungen" aria-current="${this._view === 'settings' ? 'page' : 'false'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54A.49.49 0 0 0 13.88 2h-3.76a.49.49 0 0 0-.49.42L9.27 4.96c-.59.23-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.72 8.48a.5.5 0 0 0 .12.64l2.03 1.58a6.8 6.8 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.5.39 1.04.71 1.63.94l.36 2.54a.49.49 0 0 0 .49.42h3.76a.49.49 0 0 0 .49-.42l.36-2.54c.59.23 1.13.55 1.63.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg></button>` : ''}</div><main>
      ${this._view === 'week' ? `<div class="week"><button class="week-nav" data-action="shift" data-shift="-1" aria-label="Vorherige Woche" title="Vorherige Woche">${this.icon('previous')}</button><strong>${this.weekLabel(weekStart, weekEnd)}</strong><button data-action="today">Heute</button><button class="week-nav" data-action="shift" data-shift="1" aria-label="Nächste Woche" title="Nächste Woche">${this.icon('next')}</button></div><div class="days">${dayRows || `<div class="empty-state">${state ? 'Für diese Woche sind keine Einträge verfügbar.' : 'Der Wochenplan-Sensor ist nicht geladen. Bitte Integration und Home-Assistant-Protokoll prüfen.'}</div>`}</div>` : this._view === 'random' ? randomMarkup : `<div class="page-actions"><h2>Gerichte</h2><button class="primary" data-action="new-meal">+ Gericht hinzufügen</button></div><p class="hint">Hier pflegst du eure gespeicherten Gerichte und die Personen, die sie gern essen.</p><div class="meal-list">${mealRows || '<div class="empty-state">Noch keine Gerichte gespeichert. Füge ein Gericht hinzu.</div>'}</div><footer class="version">Version ${this.esc(ESSENSPLANER_VERSION)}</footer>`}
      ${this._notice ? `<div class="notice ${this._noticeError ? 'error' : ''}" role="status">${this.esc(this._notice)}</div>` : ''}
      ${this._modal ? this.renderModal(meals) : ''}
    </main></ha-card>`;
    this.shadowRoot.querySelectorAll('[data-action]').forEach((element) => {
      if (element.matches('input[type="radio"]')) {
        element.onchange = (event) => {
          event.stopPropagation();
          if (element.checked) this.action(element.dataset.action, { ...element.dataset, value: element.value });
        };
      } else {
        element.onclick = (event) => { event.stopPropagation(); this.action(element.dataset.action, element.dataset); };
      }
    });
    this.shadowRoot.querySelectorAll('[data-stop]').forEach((el) => el.onclick = (event) => event.stopPropagation());
    this.shadowRoot.querySelectorAll('[data-random-person]').forEach((input) => input.onchange = () => { this._randomPeople = [...this.shadowRoot.querySelectorAll('[data-random-person]:checked')].map((el) => el.dataset.randomPerson); this._suggestion = null; });
    this.shadowRoot.querySelectorAll('.day').forEach((el) => el.onclick = () => this.openDay(el.dataset.day));
    const saveToggle = this.shadowRoot.querySelector('[data-field="save-to-catalog"]');
    if (saveToggle) saveToggle.onchange = () => { this._modal.saveToCatalog = saveToggle.checked; const extra = this.shadowRoot.querySelector('.catalog-extra'); if (extra) extra.hidden = !saveToggle.checked; };
    const freeText = this.shadowRoot.querySelector('[data-field="text"]');
    if (freeText) freeText.oninput = () => { this._modal.freeText = freeText.value; };
    const linkField = this.shadowRoot.querySelector('[data-field="link"]');
    if (linkField) linkField.oninput = () => { this._modal.link = linkField.value; };
    const mealSelect = this.shadowRoot.querySelector('[data-field="meal-select"]');
    if (mealSelect) mealSelect.onchange = () => { this._modal.mealId = mealSelect.value || null; };
    this.bindSwipe();
  }

  renderModal(meals) {
    const modal = this._modal;
    if (modal.type === 'meal-confirm' || modal.type === 'day-confirm') return `<div class="overlay"><section class="dialog" role="dialog" aria-modal="true"><div class="dialog-head"><h2>${modal.type === 'meal-confirm' ? 'Gericht löschen?' : 'Tageseintrag löschen?'}</h2><button class="close" data-action="close-modal" aria-label="Schließen">×</button></div><p class="confirm-copy">${modal.type === 'meal-confirm' ? `Soll „${this.esc(modal.meal.name)}“ wirklich aus der Gerichte-Liste entfernt werden?` : `Soll der Essenseintrag für ${this.esc(modal.date)} gelöscht werden?`}</p><div class="dialog-actions"><button data-action="close-modal">Abbrechen</button><button class="danger" data-action="delete-confirmed">Löschen</button></div></section></div>`;
    if (modal.type === 'meal') {
      const existing = modal.meal || {};
      const checked = new Set(existing.eaters || []);
      return `<div class="overlay"><section class="dialog" role="dialog" aria-modal="true"><div class="dialog-head"><h2>${existing.id ? 'Gericht bearbeiten' : 'Neues Gericht'}</h2><button class="close" data-action="close-modal" aria-label="Schließen">×</button></div><div class="form-grid"><label class="field"><span>Name des Gerichts</span><input type="text" data-field="name" value="${this.esc(existing.name || '')}" maxlength="120" autocomplete="off" placeholder="z. B. Gemüse-Lasagne"></label><div class="field"><span>Art des Gerichts</span><div class="choice-row"><label class="choice"><input type="radio" name="meal-type" value="veg" ${existing.meat ? '' : 'checked'}> Vegetarisch</label><label class="choice"><input type="radio" name="meal-type" value="meat" ${existing.meat ? 'checked' : ''}> Mit Fleisch</label></div></div><div class="field"><span class="group-label">Wer isst das Gericht gern?</span><div class="check-grid">${['Vera', 'Manuel', 'Maximilian', 'Paul'].map((person) => `<label class="person-choice"><input type="checkbox" data-eater="${person}" ${checked.has(person) ? 'checked' : ''}> ${person}</label>`).join('')}</div><small class="hint">Die Vorlieben helfen bei passenden Vorschlägen. Maximilian isst vegetarisch.</small></div></div><div class="dialog-actions"><button data-action="close-modal">Abbrechen</button><button class="primary" data-action="save-meal">Speichern</button></div></section></div>`;
    }
    const date = modal.date;
    const entry = modal.entry || {};
    const edit = Boolean(entry.title);
    const free = modal.kind !== 'saved';
    const selectedMeal = meals.find((m) => m.id === (modal.mealId || entry.meal_id)) || null;
    return `<div class="overlay"><section class="dialog" role="dialog" aria-modal="true"><div class="dialog-head"><h2>${edit ? 'Eintrag bearbeiten' : 'Essen einplanen'}</h2><button class="close" data-action="close-modal" aria-label="Schließen">×</button></div><div class="form-grid"><div class="field"><span>Für ${this.esc(new Date(date + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }))}</span><div class="choice-row"><label class="choice"><input type="radio" name="plan-kind" value="free" data-action="plan-kind" ${free ? 'checked' : ''}> Frei eintragen</label><label class="choice"><input type="radio" name="plan-kind" value="saved" data-action="plan-kind" ${free ? '' : 'checked'}> Aus Gerichten wählen</label></div></div>${free ? `<label class="field"><span>Mahlzeit</span><input type="text" data-field="text" value="${this.esc(modal.freeText ?? (entry.title || ''))}" maxlength="240" placeholder="Essen eintragen" autocomplete="off"></label><label class="field"><span>Link (optional)</span><input type="url" data-field="link" value="${this.esc(modal.link ?? (entry.link || ''))}" placeholder="https://…" inputmode="url"></label><label class="person-choice"><input type="checkbox" data-field="save-to-catalog" ${modal.saveToCatalog ? 'checked' : ''}> Auch in Gerichte speichern</label><div class="catalog-extra" ${modal.saveToCatalog ? '' : 'hidden'}><div class="field"><span>Art des Gerichts</span><div class="choice-row"><label class="choice"><input type="radio" name="new-meal-type" value="veg" ${(modal.newMeat ?? false) ? '' : 'checked'}> Vegetarisch</label><label class="choice"><input type="radio" name="new-meal-type" value="meat" ${(modal.newMeat ?? false) ? 'checked' : ''}> Mit Fleisch</label></div></div><div class="field"><span class="group-label">Wer isst es gern?</span><div class="check-grid">${['Vera', 'Manuel', 'Maximilian', 'Paul'].map((person) => `<label class="person-choice"><input type="checkbox" data-new-eater="${person}" ${(modal.newEaters || ['Vera', 'Manuel', 'Paul']).includes(person) ? 'checked' : ''}> ${person}</label>`).join('')}</div></div></div>` : `<label class="field saved-meal-picker"><span>Gericht auswählen</span><select data-field="meal-select"><option value="">Bitte Gericht auswählen …</option>${meals.map((m) => `<option value="${this.esc(m.id)}" ${m.id === selectedMeal?.id ? 'selected' : ''}>${this.esc(m.name)} · ${m.meat ? 'Fleisch' : 'vegetarisch'} · ${this.esc((m.eaters || []).join(', '))}</option>`).join('')}</select>${meals.length ? '' : '<small class="hint">Noch keine Gerichte gespeichert.</small>'}</label><label class="field"><span>Link (optional)</span><input type="url" data-field="link" value="${this.esc(modal.link ?? (entry.link || ''))}" placeholder="https://…" inputmode="url"></label>`}</div><div class="dialog-actions"><button data-action="close-modal">Abbrechen</button><button class="primary" data-action="save-day">Einplanen</button></div></section></div>`;
  }

  bindSwipe() {
    const days = this.shadowRoot.querySelector('.days');
    if (!days) return;
    let start = null;
    days.addEventListener('touchstart', (event) => { if (event.touches.length === 1) start = [event.touches[0].clientX, event.touches[0].clientY]; }, { passive: true });
    days.addEventListener('touchend', (event) => {
      if (!start || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - start[0]; const dy = event.changedTouches[0].clientY - start[1]; start = null;
      const a = this.getState()?.attributes || {};
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) this.shiftWeek(dx < 0 ? 1 : -1);
      else if (dy > 70 && Math.abs(dy) > Math.abs(dx) * 1.2) this.action('today', {});
    }, { passive: true });
  }

  notify(message, error = false) {
    this._notice = message; this._noticeError = error;
    const dialog = this.shadowRoot?.querySelector('.dialog');
    if (this._modal && dialog) {
      let notice = dialog.querySelector('.form-notice');
      if (!notice) { notice = document.createElement('div'); notice.className = 'notice form-notice'; dialog.querySelector('.dialog-head')?.after(notice); }
      notice.textContent = message; notice.classList.toggle('error', error); return;
    }
    this.render();
  }
  openDay(date) {
    const state = this.getState()?.attributes || {};
    const entry = this.entryFor(date) || {};
    const savedMeal = (state.meals || []).find((meal) => meal.id === entry.meal_id);
    const pending = this._pendingMeal;
    this._modal = { type: 'day', date, entry, kind: pending || entry.meal_id ? 'saved' : 'free', mealId: pending?.id || entry.meal_id || null, mealName: pending?.name || savedMeal?.name || '', mealDropdownOpen: false, freeText: entry.meal_id || pending ? '' : (entry.title || ''), link: entry.link || '', saveToCatalog: false };
    this.render();
    this.shadowRoot.querySelector('[data-field="text"]')?.focus();
  }
  async action(action, data) {
    if (action === 'view') { if (data.view === 'settings' && !this.isManager()) return; this._view = data.view; this._modal = null; this._notice = ''; this.render(); return; }
    if (action === 'shift') { this.shiftWeek(Number(data.shift)); return; }
    if (action === 'today') {
      const date = this.dateKey(new Date());
      this._weekStart = this.mondayOf(date);
      this.render();
      return;
    }
    if (action === 'open-day') { this.openDay(data.date); return; }
    if (action === 'suggest' || action === 'another') {
      const selected = this._randomPeople || [];
      if (!selected.length) { this.notify('Bitte mindestens eine mitessende Person auswählen.', true); return; }
      let candidates = (this.getState()?.attributes?.meals || []).filter((meal) => (!meal.meat || !selected.includes('Maximilian')) && selected.every((person) => (meal.eaters || []).includes(person)) && !this._shownSuggestionIds.includes(meal.id));
      if (!candidates.length && this._shownSuggestionIds.length) { this._shownSuggestionIds = []; candidates = (this.getState()?.attributes?.meals || []).filter((meal) => (!meal.meat || !selected.includes('Maximilian')) && selected.every((person) => (meal.eaters || []).includes(person))); }
      if (!candidates.length) { this._suggestion = null; this.notify('Kein passendes gespeichertes Gericht für diese Auswahl gefunden.', true); return; }
      const absentees = ['Vera', 'Manuel', 'Maximilian', 'Paul'].filter((person) => !selected.includes(person));
      const ranked = candidates.map((meal) => ({ meal, misses: absentees.filter((person) => !(meal.eaters || []).includes(person)).length })).sort((x, y) => y.misses - x.misses || (selected.includes('Maximilian') ? 0 : Number(y.meal.meat) - Number(x.meal.meat)));
      const best = ranked.filter((item) => item.misses === ranked[0].misses && (selected.includes('Maximilian') || Boolean(item.meal.meat) === Boolean(ranked[0].meal.meat)));
      const chosen = best[Math.floor(Math.random() * best.length)].meal;
      this._suggestion = { meal: chosen, reason: `Passt zu ${selected.join(', ')}. ${absentees.length ? 'Personen, die heute nicht mitessen, sind beim Vorschlag berücksichtigt.' : 'Alle essen mit.'}` };
      this._shownSuggestionIds.push(chosen.id); this.render(); return;
    }
    if (action === 'plan-suggestion') { if (!this._suggestion?.meal) return; this._pendingMeal = this._suggestion.meal; this._view = 'week'; this._notice = 'Wähle den Tag, an dem du das Gericht einplanen möchtest.'; this._noticeError = false; this.render(); return; }
    if (action === 'new-meal') { this._modal = { type: 'meal', meal: null }; this.render(); this.shadowRoot.querySelector('[data-field="name"]')?.focus(); return; }
    if (action === 'edit-meal') { const meal = (this.getState()?.attributes.meals || []).find((m) => m.id === data.id); if (meal) { this._modal = { type: 'meal', meal: { ...meal, eaters: [...(meal.eaters || [])] } }; this.render(); this.shadowRoot.querySelector('[data-field="name"]')?.focus(); } return; }
    if (action === 'confirm-delete-meal') { const meal = (this.getState()?.attributes.meals || []).find((m) => m.id === data.id); if (meal) { this._modal = { type: 'meal-confirm', meal }; this.render(); } return; }
    if (action === 'confirm-delete-day') {
      if (!this.canDeleteEntry(this.entryFor(data.date))) { this.notify('Du darfst nur eigene Einträge löschen.', true); return; }
      this._modal = { type: 'day-confirm', date: data.date }; this.render(); return;
    }
    if (action === 'close-modal' || action === 'overlay-close') { if (action === 'overlay-close' && event?.target !== event?.currentTarget) return; this._modal = null; this.render(); return; }
    if (action === 'plan-kind') {
      if (!this._modal || !['free', 'saved'].includes(data.value)) return;
      this._modal.freeText = this.shadowRoot.querySelector('[data-field="text"]')?.value ?? this._modal.freeText ?? '';
      const mealSelect = this.shadowRoot.querySelector('[data-field="meal-select"]');
      if (mealSelect) this._modal.mealId = mealSelect.value || null;
      this._modal.link = this.shadowRoot.querySelector('[data-field="link"]')?.value ?? this._modal.link ?? '';
      this._modal.mealId = this._modal.mealId || null;
      this._modal.saveToCatalog = this.shadowRoot.querySelector('[data-field="save-to-catalog"]')?.checked ?? this._modal.saveToCatalog ?? false;
      const mealType = this.shadowRoot.querySelector('[name="new-meal-type"]:checked');
      if (mealType) this._modal.newMeat = mealType.value === 'meat';
      if (this.shadowRoot.querySelector('[data-new-eater]')) this._modal.newEaters = [...this.shadowRoot.querySelectorAll('[data-new-eater]:checked')].map((e) => e.dataset.newEater);
      this._modal.kind = data.value; this.render(); return;
    }
    if (action === 'save-meal') { await this.saveMeal(); return; }
    if (action === 'save-day') { await this.saveDay(); return; }
    if (action === 'delete-confirmed') { await this.deleteConfirmed(); return; }
  }

  async saveMeal() {
    const name = this.shadowRoot.querySelector('[data-field="name"]')?.value.trim() || '';
    const meat = this.shadowRoot.querySelector('[name="meal-type"]:checked')?.value === 'meat';
    const eaters = [...this.shadowRoot.querySelectorAll('[data-eater]:checked')].map((e) => e.dataset.eater);
    if (!name) { this.notify('Bitte einen Namen für das Gericht eingeben.', true); return; }
    if (!eaters.length) { this.notify('Bitte mindestens eine Person auswählen, die das Gericht gern isst.', true); return; }
    if (meat && eaters.includes('Maximilian')) { this.notify('Maximilian isst vegetarisch. Bitte entferne ihn bei einem Fleischgericht.', true); return; }
    try { await this.call('save_meal', { ...(this._modal.meal?.id ? { id: this._modal.meal.id } : {}), name, meat, eaters }); this._modal = null; this._notice = 'Gericht gespeichert.'; this._noticeError = false; this.render(); }
    catch (error) { this.notify(error.message || 'Gericht konnte nicht gespeichert werden.', true); }
  }

  async saveDay() {
    const modal = this._modal; const state = this.getState()?.attributes || {}; const link = this.shadowRoot.querySelector('[data-field="link"]')?.value.trim() || '';
    const saveToCatalog = this.shadowRoot.querySelector('[data-field="save-to-catalog"]')?.checked || false;
    const kind = this.shadowRoot.querySelector('[name="plan-kind"]:checked')?.value || modal.kind;
    const payload = { date: modal.date };
    if (kind === 'saved') {
      const mealSelect = this.shadowRoot.querySelector('[data-field="meal-select"]');
      const mealId = mealSelect ? mealSelect.value : modal.mealId;
      const meal = (state.meals || []).find((m) => m.id === mealId);
      if (!meal) { this.notify('Bitte ein gespeichertes Gericht aus der Liste auswählen.', true); return; }
      payload.meal_id = meal.id;
    } else {
      const text = this.shadowRoot.querySelector('[data-field="text"]')?.value.trim() || '';
      if (!text) { this.notify('Bitte ein Essen eintragen.', true); return; }
      if (saveToCatalog) {
        const meat = this.shadowRoot.querySelector('[name="new-meal-type"]:checked')?.value === 'meat';
        const eaters = [...this.shadowRoot.querySelectorAll('[data-new-eater]:checked')].map((e) => e.dataset.newEater);
        if (!eaters.length) { this.notify('Bitte auswählen, wer das Gericht gern isst.', true); return; }
        if (meat && eaters.includes('Maximilian')) { this.notify('Maximilian isst vegetarisch. Bitte entferne ihn bei einem Fleischgericht.', true); return; }
        try { const id = `meal-${crypto.randomUUID()}`; await this.call('save_meal', { id, name: text, meat, eaters }); payload.meal_id = id; }
        catch (error) { this.notify(error.message || 'Gericht konnte nicht gespeichert werden.', true); return; }
      } else payload.text = text;
    }
    if (link) payload.link = link;
    try { await this.call('plan_day', payload); this._pendingMeal = null; this._modal = null; this._notice = 'Essen eingeplant.'; this._noticeError = false; this.render(); }
    catch (error) { this.notify(error.message || 'Essen konnte nicht eingeplant werden.', true); }
  }

  async deleteConfirmed() {
    const modal = this._modal;
    try {
      if (modal.type === 'meal-confirm') await this.call('delete_meal', { id: modal.meal.id });
      else await this.call('plan_day', { date: modal.date, clear: true });
      this._modal = null; this._notice = 'Eintrag gelöscht.'; this._noticeError = false; this.render();
    } catch (error) { this.notify(error.message || 'Löschen fehlgeschlagen.', true); }
  }
}
if (!customElements.get('essensplaner-card')) customElements.define('essensplaner-card', EssensplanerCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === 'essensplaner-card')) {
  window.customCards.push({ type: 'essensplaner-card', name: 'Essensplaner', description: 'Wochenplan und Zufallsrezept' });
}
