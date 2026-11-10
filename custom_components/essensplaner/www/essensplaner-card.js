import {UI_CSS, UI_VERSION, navigation, section, row, button, iconButton, toggle, filterButton, field, selectField, dialog, notice, versionInfo, bindUI, escapeHtml, combobox, dateNavigation, weekCalendar, confirmDialog, downloadJSON, bindGestures} from './family-ui/1.2.1/family-ui.js';

const ESSENSPLANER_VERSION = '1.4.1';

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
    this._randomPeople = ['Vera', 'Manuel', 'Maximilian', 'Paul'];
    this._shownSuggestionIds = [];
    this._suggestion = null;
    this._pendingMeal = null;
    this.ensureUI();
    this.render();
  }

  connectedCallback() { if (this.shadowRoot) { this.ensureUI(); this.bindSwipe(); } }
  disconnectedCallback() { this._unbindUI?.(); this._unbindUI = null; this._unbindGestures?.(); this._unbindGestures = null; }

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
  esc(value) { return escapeHtml(value); }
  time(value) { return value ? new Date(value).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''; }
  weekLabel(start, end) {
    return start && end ? `${new Date(start + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${new Date(end + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Wird geladen …';
  }
  ensureUI() {
    if (!this.shadowRoot.querySelector('[data-shell]')) {
      this.shadowRoot.innerHTML = `<style>${UI_CSS}</style><ha-card><div data-shell></div></ha-card><div data-dialog-host></div>`;
    }
    this._unbindUI ||= bindUI(this.shadowRoot, ({action, data, checked, element, originalEvent, value, label, date}) => {
      originalEvent.stopPropagation();
      if (action === 'navigate') { this.action('view', {view:data.page}); return; }
      if (action === 'select-meal' && this._modal?.type === 'day') {
        this._modal.mealId = value; this._modal.mealName = label; return;
      }
      if (action === 'random-person') {
        this._randomPeople = checked ? [...new Set([...this._randomPeople, data.person])] : this._randomPeople.filter(person => person !== data.person);
        this._suggestion = null; this.render(); return;
      }
      if (action === 'meal-eater' || action === 'new-eater' || action === 'save-to-catalog') {
        element.setAttribute('aria-checked', String(checked)); element.classList.toggle('on', checked);
        if (action === 'save-to-catalog') {
          this._modal.saveToCatalog = checked;
          this.shadowRoot.querySelector('[data-catalog-extra]').hidden = !checked;
        }
        return;
      }
      this.action(action, {...data, ...(date ? {date} : {})});
    });
  }
  focusKey(element) {
    if (!element?.dataset?.action) return null;
    return Object.fromEntries(['action','date','id','page'].filter(key => element.dataset[key] !== undefined).map(key => [key,element.dataset[key]]));
  }
  restoreFocus(key) {
    if (!key) return;
    const buttons = [...this.shadowRoot.querySelectorAll('[data-shell] button')];
    const match = buttons.find(element => Object.entries(key).every(([name,value]) => element.dataset[name] === value))
      || (key.date && buttons.find(element => element.dataset.action === 'open-day' && element.dataset.date === key.date))
      || buttons.find(element => element.dataset.action === 'new-meal')
      || buttons.find(element => element.getAttribute('aria-current') === 'page');
    match?.focus({preventScroll:true});
  }
  render() {
    if (!this.shadowRoot || !this._hass) return;
    this.ensureUI();
    const oldDialog = this.shadowRoot.querySelector('dialog');
    const closing = Boolean(oldDialog && !this._modal);
    if (closing) oldDialog.close();
    const focus = closing ? this._dialogFocus : this.focusKey(this.shadowRoot.activeElement);
    const state = this.getState();
    const a = state?.attributes || {};
    const meals = a.meals || [];
    const shell = this.shadowRoot.querySelector('[data-shell]');
    if (!this._modal || !shell.childElementCount) {
      this._folds ||= {};
      for (const fold of shell.querySelectorAll('[data-ui="collapse"]')) this._folds[fold.getAttribute('aria-controls')] = fold.getAttribute('aria-expanded') === 'true';
      const block = props => section({...props,expanded:this._folds[props.id+'-content'] ?? true});
      const days = this.weekDays();
      const calendarEntries = days.filter(day => day.entry).map(day => ({
        date:day.date,title:day.entry.title,
        description:`Eingetragen von ${day.entry.planned_by}${day.entry.planned_at?' · '+this.time(day.entry.planned_at):''}`,
        link:day.entry.link,
        actions:iconButton({icon:'edit',label:'Eintrag bearbeiten',action:'open-day',data:{date:day.date}})
          + (this.canDeleteEntry(day.entry) ? iconButton({icon:'trash',label:'Eintrag löschen',action:'confirm-delete-day',data:{date:day.date},danger:true}) : '')
      }));
      const end = new Date(this._weekStart+'T12:00:00'); end.setDate(end.getDate()+6);
      const week = dateNavigation({label:this.weekLabel(this._weekStart,this.dateKey(end)),previousAction:'previous-week',nextAction:'next-week'})
        + (days.length ? weekCalendar({id:'meal-week',start:this._weekStart,entries:calendarEntries,today:this.dateKey(new Date()),emptyLabel:'Essen einplanen'})
          : notice(state?'Für diese Woche sind keine Einträge verfügbar.':'Der Wochenplan-Sensor ist nicht geladen. Bitte Integration und Home-Assistant-Protokoll prüfen.',{error:!state}));
      const mealRows = meals.map(meal => row({title:meal.name,description:`${meal.meat?'Mit Fleisch':'Vegetarisch'} · Isst gern: ${(meal.eaters || []).join(', ') || 'Keine Personen zugeordnet'}`,trailing:iconButton({icon:'edit',label:'Gericht bearbeiten',action:'edit-meal',data:{id:meal.id}})+iconButton({icon:'trash',label:'Gericht löschen',action:'confirm-delete-meal',data:{id:meal.id},danger:true})})).join('');
      const settings = block({id:'meals',title:'Gerichte',trailing:button({label:'Gericht hinzufügen',icon:'add',action:'new-meal',variant:'primary'}),content:mealRows || notice('Noch keine Gerichte gespeichert. Füge ein Gericht hinzu.')})
        + block({id:'export',title:'Sicherung',content:button({label:'Gerichte exportieren',icon:'save',action:'export-meals'})})
        + versionInfo({frontend:ESSENSPLANER_VERSION,backend:a.integration_version,ui:UI_VERSION});
      const randomMeal = this._suggestion?.meal;
      const random = `<div class="grid"><div class="full">${notice('Wähle aus, wer mitisst. Der Vorschlag kommt aus euren gespeicherten Gerichten.')}</div><div class="full">${block({id:'random-people',title:'Wer isst mit?',content:`<div class="toolbar">${['Vera','Manuel','Maximilian','Paul'].map(person => toggle({label:person,action:'random-person',checked:this._randomPeople.includes(person),data:{person}})).join('')}</div>`})}</div><div class="toolbar full">${button({label:this._suggestion?'Gericht vorschlagen':'Zufallsgericht vorschlagen',action:'suggest',variant:'primary'})}${this._suggestion?button({label:'Anderes Gericht',action:'another'}):''}</div>${randomMeal?'<div class="full">'+block({id:'suggestion',title:'Vorschlag',content:row({title:randomMeal.name,description:`${randomMeal.meat?'Mit Fleisch':'Vegetarisch'} · Isst gern: ${(randomMeal.eaters || []).join(', ')}`})+notice(this._suggestion.reason)+button({label:'Im Essensplan einplanen',action:'plan-suggestion',variant:'primary'})})+'</div>':''}</div>`;
      shell.innerHTML = `${navigation({label:'Essensplaner',items:[{id:'week',label:'Essensplan'},{id:'random',label:'Zufallsrezept'}],active:this._view,settings:this.isManager(),help:false})}<main>${this._view==='week'?week:this._view==='random'?random:settings}<div data-feedback${this._notice?'':' hidden'}>${this._notice?notice(this._notice,{error:this._noticeError}):''}</div></main>`;
      this.bindSwipe();
    }
    const host = this.shadowRoot.querySelector('[data-dialog-host]');
    if (this._modal) {
      if (!oldDialog) {this._dialogFocus = this.focusKey(this.shadowRoot.activeElement);this._dialogNotice='';}
      oldDialog?.close();
      host.innerHTML = this.renderModal(meals);
      const modalElement = host.querySelector('dialog');
      modalElement.onclose = () => {
        if (!modalElement.isConnected || host.querySelector('dialog') !== modalElement) return;
        this._modal = null; this.render();
      };
      this.bindDialogFields();
      modalElement.showModal();
    } else {
      host.replaceChildren();
      this.restoreFocus(focus);
      this._dialogFocus = null;
    }
  }
  formField(key, label, value, {type='text',placeholder='',maxlength,required=false} = {}) {
    return field({id:`ep-${key}`,label,value,type,required,placeholder,maxLength:maxlength,autocomplete:'off'}).replace('class="field"','class="field full"').replace('<input ',`<input data-field="${key}" `);
  }
  typeField(id, value) {
    return selectField({id,label:'Art des Gerichts',value:value?'meat':'veg',options:[{value:'veg',label:'Vegetarisch'},{value:'meat',label:'Mit Fleisch'}]}).replace('class="field"','class="field full"');
  }
  eaterFields(action, attribute, eaters) {
    return `<div class="full"><span class="hint">Wer isst das Gericht gern?</span><div class="toolbar">${['Vera','Manuel','Maximilian','Paul'].map(person => toggle({label:person,action,checked:eaters.includes(person),data:{[attribute]:person}})).join('')}</div></div>`;
  }
  renderModal() {
    const modal = this._modal;
    const feedback = `<div data-dialog-feedback${this._dialogNotice?'':' hidden'}>${this._dialogNotice?notice(this._dialogNotice,{error:this._dialogNoticeError}):''}</div>`;
    const cancel = button({label:'Abbrechen',action:'close-modal'});
    let title, content, actions;
    if (modal.type==='meal-confirm' || modal.type==='day-confirm') {
      title = modal.type==='meal-confirm'?'Gericht löschen?':'Tageseintrag löschen?';
      const message = modal.type==='meal-confirm'?`Soll „${modal.meal.name}“ wirklich aus der Gerichte-Liste entfernt werden?`:`Soll der Essenseintrag für ${modal.date} gelöscht werden?`;
      return confirmDialog({id:'planner-dialog',title,message,confirmAction:'delete-confirmed',cancelAction:'close-modal'})
        .replace('<div class="modal-body">',`<div class="modal-body">${feedback}`);
    } else if (modal.type==='meal') {
      const meal = modal.meal || {};
      title = meal.id?'Gericht bearbeiten':'Neues Gericht';
      content = `<div class="grid">${this.formField('name','Name des Gerichts',meal.name || '',{maxlength:120,required:true,placeholder:'z. B. Gemüse-Lasagne'})}${this.typeField('meal-type',meal.meat)}${this.eaterFields('meal-eater','eater',meal.eaters || [])}<small class="hint full">Die Vorlieben helfen bei passenden Vorschlägen. Maximilian isst vegetarisch.</small></div>`;
      actions = cancel + button({label:'Speichern',icon:'save',action:'save-meal',variant:'primary'});
    } else {
      const free = modal.kind !== 'saved';
      title = modal.entry?.title?'Eintrag bearbeiten':'Essen einplanen';
      const choices = `<div class="full"><p class="hint">Für ${this.esc(new Date(modal.date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'}))}</p><div class="toolbar" role="group" aria-label="Art des Eintrags">${filterButton({label:'Frei eintragen',action:'plan-kind',selected:free,data:{value:'free'}})}${filterButton({label:'Aus Gerichten auswählen',action:'plan-kind',selected:!free,data:{value:'saved'}})}</div></div>`;
      const link = this.formField('link','Link (optional)',modal.link || '',{type:'url',placeholder:'https://…'});
      content = `<div class="grid">${choices}${free?this.formField('text','Mahlzeit',modal.freeText || '',{maxlength:240,required:true,placeholder:'Essen eintragen'})+link+`<div class="full">${toggle({label:'Auch in Gerichte speichern',action:'save-to-catalog',checked:modal.saveToCatalog,data:{field:'save-to-catalog'}})}</div><div class="grid full" data-catalog-extra ${modal.saveToCatalog?'':'hidden'}>${this.typeField('new-meal-type',modal.newMeat)}${this.eaterFields('new-eater','new-eater',modal.newEaters || ['Vera','Manuel','Paul'])}</div>`:this.renderMealPicker()+link}</div>`;
      actions = cancel + button({label:'Einplanen',icon:'save',action:'save-day',variant:'primary'});
    }
    return dialog({id:'planner-dialog',title,content:feedback+content,actions});
  }
  renderMealPicker() {
    const items = (this.getState()?.attributes?.meals || []).map(meal => ({id:meal.id,label:meal.name,description:`${meal.meat?'Fleisch':'Vegetarisch'} · ${(meal.eaters || []).join(', ')}`}));
    return `<div class="full">${combobox({id:'meal-search',label:'Gericht auswählen',items,value:this._modal.mealName || '',selected:this._modal.mealId || '',action:'select-meal',placeholder:'Gericht suchen, z. B. Reis …',emptyLabel:'Keine passenden Gerichte gefunden.'})}</div>`;
  }
  bindDialogFields() {
    const search = this.shadowRoot.querySelector('#meal-search');
    if (search) search.oninput = () => {this._modal.mealName=search.value;this._modal.mealId=null;};
    const text = this.shadowRoot.querySelector('[data-field="text"]');
    if (text) text.oninput = () => {this._modal.freeText=text.value;};
    const link = this.shadowRoot.querySelector('[data-field="link"]');
    if (link) link.oninput=()=>{this._modal.link=link.value;};
  }
  bindSwipe() {
    this._unbindGestures?.(); this._unbindGestures = null;
    const days = this.shadowRoot?.querySelector('.days');
    if (days) this._unbindGestures = bindGestures(days, {
      onSwipeLeft:()=>this.shiftWeek(1),onSwipeRight:()=>this.shiftWeek(-1),
      onPullDown:()=>this.action('today',{}),canPull:()=>!this._modal,pullThreshold:70
    });
  }

  notify(message, error = false) {
    if (this._modal) {
      this._dialogNotice = message; this._dialogNoticeError = error;
      const target = this.shadowRoot.querySelector('[data-dialog-feedback]');
      if (target) {target.hidden=false;target.innerHTML = notice(message, {error});}
      return;
    }
    this._notice = message; this._noticeError = error; this.render();
  }
  openDay(date) {
    const state = this.getState()?.attributes || {};
    const entry = this.entryFor(date) || {};
    const savedMeal = (state.meals || []).find((meal) => meal.id === entry.meal_id);
    const pending = this._pendingMeal;
    this._modal = { type: 'day', date, entry, kind: pending || entry.meal_id || !entry.title ? 'saved' : 'free', mealId: pending?.id || entry.meal_id || null, mealName: pending?.name || savedMeal?.name || '', freeText: entry.meal_id || pending ? '' : (entry.title || ''), link: entry.link || '', saveToCatalog: false };
    this.render();
    if (this._modal.kind === 'free') this.shadowRoot.querySelector('[data-field="text"]')?.focus();
  }
  async action(action, data) {
    if (action === 'view') { if (data.view === 'settings' && !this.isManager()) return; this._view = data.view; this._modal = null; this._notice = ''; this.render(); return; }
    if (action === 'previous-week' || action === 'next-week') { this.shiftWeek(action === 'next-week' ? 1 : -1); return; }
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
    if (action === 'close-modal') { this._modal = null; this.render(); return; }
    if (action === 'plan-kind') {
      if (!this._modal || !['free', 'saved'].includes(data.value)) return;
      this._modal.freeText = this.shadowRoot.querySelector('[data-field="text"]')?.value ?? this._modal.freeText ?? '';
      this._modal.link = this.shadowRoot.querySelector('[data-field="link"]')?.value ?? this._modal.link ?? '';
      this._modal.mealId = this._modal.mealId || null;
      const saveToggle = this.shadowRoot.querySelector('[data-field="save-to-catalog"]');
      if (saveToggle) this._modal.saveToCatalog = saveToggle.getAttribute('aria-checked') === 'true';
      const mealType = this.shadowRoot.querySelector('#new-meal-type');
      if (mealType) this._modal.newMeat = mealType.value === 'meat';
      if (this.shadowRoot.querySelector('[data-new-eater]')) this._modal.newEaters = [...this.shadowRoot.querySelectorAll('[data-new-eater][aria-checked="true"]')].map((e) => e.dataset.newEater);
      this._modal.kind = data.value; this.render(); return;
    }
    if (action === 'save-meal') { await this.saveMeal(); return; }
    if (action === 'export-meals') { this.exportMeals(); return; }
    if (action === 'save-day') { await this.saveDay(); return; }
    if (action === 'delete-confirmed') { await this.deleteConfirmed(); return; }
  }

  exportMeals() {
    if (!this.isManager()) return;
    const state = this.getState();
    if (!state) { this.notify('Die Gerichte sind noch nicht geladen.', true); return; }
    const meals = state.attributes.meals.map((meal) => ({ id: meal.id, name: meal.name, meat: meal.meat, eaters: [...(meal.eaters || [])] }));
    const catalog = { format: 'essensplaner-ha-meals', version: 1, people: ['Vera', 'Manuel', 'Maximilian', 'Paul'], meals };
    try {
      downloadJSON(catalog,{filename:`Essensplaner-Gerichte-${this.dateKey(new Date())}.json`});
      this.notify(`Export mit ${meals.length} ${meals.length === 1 ? 'Gericht' : 'Gerichten'} erstellt.`);
    } catch (error) {
      this.notify(error.message || 'Die Gerichte konnten nicht exportiert werden.', true);
    }
  }

  async saveMeal() {
    const name = this.shadowRoot.querySelector('[data-field="name"]')?.value.trim() || '';
    const meat = this.shadowRoot.querySelector('#meal-type')?.value === 'meat';
    const eaters = [...this.shadowRoot.querySelectorAll('[data-eater][aria-checked="true"]')].map((e) => e.dataset.eater);
    if (!name) { this.notify('Bitte einen Namen für das Gericht eingeben.', true); return; }
    if (!eaters.length) { this.notify('Bitte mindestens eine Person auswählen, die das Gericht gern isst.', true); return; }
    if (meat && eaters.includes('Maximilian')) { this.notify('Maximilian isst vegetarisch. Bitte entferne ihn bei einem Fleischgericht.', true); return; }
    try { await this.call('save_meal', { ...(this._modal.meal?.id ? { id: this._modal.meal.id } : {}), name, meat, eaters }); this._modal = null; this._notice = 'Gericht gespeichert.'; this._noticeError = false; this.render(); }
    catch (error) { this.notify(error.message || 'Gericht konnte nicht gespeichert werden.', true); }
  }

  async saveDay() {
    const modal = this._modal; const state = this.getState()?.attributes || {}; const link = this.shadowRoot.querySelector('[data-field="link"]')?.value.trim() || '';
    const saveToCatalog = (this.shadowRoot.querySelector('[data-field="save-to-catalog"]')?.getAttribute('aria-checked') === 'true') || false;
    const kind = modal.kind;
    const payload = { date: modal.date };
    if (kind === 'saved') {
      const mealId = modal.mealId;
      const meal = (state.meals || []).find((m) => m.id === mealId);
      if (!meal) { this.notify('Bitte ein gespeichertes Gericht aus der Liste auswählen.', true); return; }
      payload.meal_id = meal.id;
    } else {
      const text = this.shadowRoot.querySelector('[data-field="text"]')?.value.trim() || '';
      if (!text) { this.notify('Bitte ein Essen eintragen.', true); return; }
      if (saveToCatalog) {
        const meat = this.shadowRoot.querySelector('#new-meal-type')?.value === 'meat';
        const eaters = [...this.shadowRoot.querySelectorAll('[data-new-eater][aria-checked="true"]')].map((e) => e.dataset.newEater);
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

