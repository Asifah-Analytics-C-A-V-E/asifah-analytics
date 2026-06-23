/**
 * <leader-signals-card>
 * ─────────────────────────────────────────────────────────────────────────────
 * Asifah Analytics — reusable Web Component for the Leader Commodity
 * Interventions module ("Butterfly Build", Phase 1).
 *
 * v1.1.0 ADDS:
 *   - Absorption signature integration ("So What" layer)
 *   - Per-intervention parallel fetch of /absorption-signature/<id>
 *   - Collapsible So What block: BLUF visible by default, full analysis
 *     (transmission chain, escalation ladder, historical analog) on expand
 *   - Same proxy-aware backend routing as leader interventions
 *
 * USAGE: (unchanged from v1.0)
 *
 *   <leader-signals-card
 *     country="india"
 *     backend="https://asifah-asia-backend.onrender.com/api/asia">
 *   </leader-signals-card>
 *
 *   <leader-signals-card
 *     commodity="gold"
 *     backend="https://asifah-backend.onrender.com/api">
 *   </leader-signals-card>
 *
 *   <leader-signals-card
 *     backend="https://asifah-backend.onrender.com/api">
 *   </leader-signals-card>
 *
 * v1.1.0 — May 11 2026 — Phase 1 architectural stub
 * ─────────────────────────────────────────────────────────────────────────────
 */

class LeaderSignalsCard extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._refreshIntervalMs = 5 * 60 * 1000;
    this._refreshTimer = null;
  }

  static get observedAttributes() {
    return ['country', 'commodity', 'backend', 'detail'];
  }

  /**
   * Detail level controls how much info renders per intervention:
   *   compact — card header only, no tags, no source (regional roll-ups)
   *   bluf    — card + tags + So What BLUF + drill-in link (commodity pages)
   *   full    — everything (country stability pages — default)
   */
  _getDetailLevel() {
    const level = (this.getAttribute('detail') || 'full').toLowerCase();
    return ['compact', 'bluf', 'full'].includes(level) ? level : 'full';
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal !== newVal && this.isConnected) {
      this.refresh();
    }
  }

  connectedCallback() {
    this._renderShell();
    this.refresh();
    this._refreshTimer = setInterval(() => this.refresh(), this._refreshIntervalMs);
  }

  disconnectedCallback() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
  }

  _getMode() {
    if (this.getAttribute('country'))   return 'country';
    if (this.getAttribute('commodity')) return 'commodity';
    return 'global';
  }

  _getBackendBase() {
    return (this.getAttribute('backend') || '').replace(/\/+$/, '');
  }

  _getInterventionsUrl() {
    const backend = this._getBackendBase();
    if (!backend) return null;
    const mode = this._getMode();
    if (mode === 'country')   return `${backend}/leader-interventions/${encodeURIComponent(this.getAttribute('country').toLowerCase())}`;
    if (mode === 'commodity') return `${backend}/leader-interventions/commodity/${encodeURIComponent(this.getAttribute('commodity').toLowerCase())}`;
    return `${backend}/leader-interventions`;
  }

  _getAbsorptionUrl(interventionId) {
    const backend = this._getBackendBase();
    if (!backend || !interventionId) return null;
    return `${backend}/absorption-signature/${encodeURIComponent(interventionId)}`;
  }

  async refresh() {
    const url = this._getInterventionsUrl();
    if (!url) {
      this._renderError('No backend URL configured. Set the `backend` attribute.');
      return;
    }
    this._renderLoading();
    try {
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const interventions = (data && data.interventions) || [];
      if (interventions.length > 0) {
        const enriched = await Promise.all(
          interventions.map(iv => this._fetchSignature(iv))
        );
        data.interventions = enriched;
      }

      this._renderData(data);
    } catch (err) {
      this._renderError(`Could not load leader signals: ${err.message}`);
    }
  }

  async _fetchSignature(intervention) {
    const interventionId = intervention.fingerprint_id;
    if (!interventionId) {
      intervention._absorption_signature = null;
      return intervention;
    }
    const url = this._getAbsorptionUrl(interventionId);
    if (!url) {
      intervention._absorption_signature = null;
      return intervention;
    }
    try {
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) {
        intervention._absorption_signature = null;
        return intervention;
      }
      const data = await resp.json();
      intervention._absorption_signature = (data && data.has_signature)
        ? data.signature
        : null;
    } catch (err) {
      console.warn(`[LeaderSignalsCard] Signature fetch failed for ${interventionId}:`, err.message);
      intervention._absorption_signature = null;
    }
    return intervention;
  }

  _renderShell() {
    this.shadowRoot.innerHTML = `
      <style>${this._css()}</style>
      <div class="card" part="card">
        <div class="header">
          <div class="title-row">
            <span class="icon">🗣️</span>
            <h3 class="title">Leader Commodity Signals</h3>
            <span class="live-dot" title="Auto-refreshes every 5 minutes"></span>
          </div>
          <p class="subtitle" id="subtitle">Verbal interventions by senior officials affecting commodity markets.</p>
        </div>
        <div class="body" id="body">
          <div class="state-loading">
            <div class="skeleton"></div>
            <div class="skeleton"></div>
            <div class="skeleton"></div>
          </div>
        </div>
        <div class="footer">
          <span class="footer-text">Asifah Analytics · Butterfly Build v1.1</span>
        </div>
      </div>
    `;

    this.shadowRoot.addEventListener('click', (e) => {
      const swToggle = e.target.closest('.sw-toggle');
      if (swToggle) {
        e.preventDefault();
        const block = swToggle.closest('.so-what');
        if (block) {
          const isOpen = block.classList.toggle('open');
          swToggle.textContent = isOpen ? 'Hide full analysis \u25b4' : 'Read full analysis \u25be';
        }
        return;
      }
      // Speaker-group expand/collapse (group-by-speaker layout).
      const lsgToggle = e.target.closest('.lsg-toggle');
      if (lsgToggle) {
        e.preventDefault();
        const grp = lsgToggle.closest('.lsg');
        if (grp) {
          const open = grp.classList.toggle('open');
          const chev = lsgToggle.querySelector('.lsg-chevron');
          if (chev) chev.textContent = open ? '\u25b4' : '\u25be';
        }
      }
    });
  }

  _renderLoading() {
    const body = this.shadowRoot.getElementById('body');
    if (!body) return;
    body.innerHTML = `
      <div class="state-loading">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>
    `;
  }

  _renderError(msg) {
    const body = this.shadowRoot.getElementById('body');
    if (!body) return;
    body.innerHTML = `
      <div class="state-error">
        <div class="state-error-icon">⚠️</div>
        <div class="state-error-msg">${this._escape(msg)}</div>
        <div class="state-error-hint">The card will retry automatically.</div>
      </div>
    `;
  }

  _renderData(data) {
    const body = this.shadowRoot.getElementById('body');
    const subtitle = this.shadowRoot.getElementById('subtitle');
    if (!body) return;

    const interventions = (data && data.interventions) || [];
    const mode = this._getMode();

    if (subtitle) {
      if (mode === 'country') {
        subtitle.textContent = `Verbal commodity interventions by ${this._titleCase(this.getAttribute('country'))} officials.`;
      } else if (mode === 'commodity') {
        const cName = data.commodity_name || this.getAttribute('commodity');
        subtitle.textContent = `Cross-country leader interventions affecting ${cName}.`;
      } else {
        subtitle.textContent = 'Global feed of verbal commodity interventions by senior officials worldwide.';
      }
    }

    if (interventions.length === 0) {
      body.innerHTML = `
        <div class="state-empty">
          <div class="state-empty-icon">🕊️</div>
          <div class="state-empty-msg">No active leader commodity signals.</div>
          <div class="state-empty-hint">
            This card tracks verbal interventions ("jawboning") by heads of state, finance ministers,
            and central bank governors that move commodity markets without formal policy action.
            Quiet here means quiet on the wires.
          </div>
        </div>
      `;
      return;
    }

    let breakdownHtml = '';
    if (mode === 'global' && data.breakdown_by_country) {
      const topCountries = Object.entries(data.breakdown_by_country)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      breakdownHtml = `
        <div class="breakdown">
          <span class="breakdown-label">${interventions.length} active · top:</span>
          ${topCountries.map(([c, n]) => `<span class="breakdown-pill">${this._titleCase(c)} <b>${n}</b></span>`).join('')}
        </div>
      `;
    } else if (mode === 'commodity' && data.countries_with_intervention && data.countries_with_intervention.length) {
      breakdownHtml = `
        <div class="breakdown">
          <span class="breakdown-label">${interventions.length} active across ${data.countries_with_intervention.length} ${data.countries_with_intervention.length === 1 ? 'country' : 'countries'}:</span>
          ${data.countries_with_intervention.slice(0, 6).map(c => `<span class="breakdown-pill">${this._titleCase(c)}</span>`).join('')}
        </div>
      `;
    } else if (mode === 'country') {
      const swCount = interventions.filter(iv => iv._absorption_signature).length;
      const swHint = swCount > 0
        ? ` · <span class="breakdown-sw-hint">${swCount} with So What analysis</span>`
        : '';
      breakdownHtml = `
        <div class="breakdown">
          <span class="breakdown-label">${interventions.length} active ${interventions.length === 1 ? 'signal' : 'signals'} for ${this._titleCase(this.getAttribute('country'))}${swHint}</span>
        </div>
      `;
    }

    // Group by speaker -- one expandable card per speaker (collapsed by default).
    // Pan Gongsheng's 5 signals collapse into a single card; Xi's 3 into another.
    const groups = this._groupBySpeaker(interventions);
    const groupsHtml = groups.map(g => this._renderSpeakerGroup(g, mode)).join('');
    body.innerHTML = breakdownHtml + `<div class="speaker-group-list">${groupsHtml}</div>`;
  }

  // Group interventions by speaker; sort groups by signal count desc, then latest.
  _groupBySpeaker(interventions) {
    const map = new Map();
    interventions.forEach(iv => {
      const key = (iv.speaker || 'Unknown speaker').trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(iv);
    });
    const groups = [];
    map.forEach((items, speaker) => {
      items.sort((a, b) => this._dateVal(b.date) - this._dateVal(a.date)); // latest first
      groups.push({ speaker, items });
    });
    groups.sort((a, b) => {
      if (b.items.length !== a.items.length) return b.items.length - a.items.length;
      return this._dateVal(b.items[0].date) - this._dateVal(a.items[0].date);
    });
    return groups;
  }

  _dateVal(d) {
    const t = d ? Date.parse(d) : NaN;
    return isNaN(t) ? 0 : t;
  }

  // One expandable speaker card: collapsed header (speaker, role, count, teaser)
  // + a body holding that speaker's individual intervention cards.
  _renderSpeakerGroup(group, mode) {
    const items = group.items;
    const lead = items[0] || {};
    const role = this._humanizeRole(lead.role);
    const n = items.length;
    const countLabel = `${n} ${n === 1 ? 'signal' : 'signals'}`;
    const dirMeta = this._directionMeta(lead.direction);
    const commodities = Array.from(new Set(
      items.map(iv => (iv.commodity || '').toUpperCase()).filter(Boolean)
    ));
    const commTags = commodities.slice(0, 4)
      .map(c => `<span class="lsg-commtag">${this._escape(c)}</span>`).join('');
    const moreComm = commodities.length > 4
      ? `<span class="lsg-commtag lsg-commtag-more">+${commodities.length - 4}</span>` : '';
    const teaser = this._escape(lead.quote_short || '');
    const itemsHtml = items.map(iv => this._renderIntervention(iv, mode)).join('');

    return `
      <div class="lsg">
        <button class="lsg-toggle" type="button">
          <span class="lsg-icon" title="${dirMeta.label}">${dirMeta.icon}</span>
          <span class="lsg-headline">
            <span class="lsg-name-row">
              <strong class="lsg-name">${this._escape(group.speaker)}</strong>
              <span class="lsg-role">${role ? '· ' + this._escape(role) : ''}</span>
            </span>
            ${teaser ? `<span class="lsg-teaser">${teaser}</span>` : ''}
            ${commTags || moreComm ? `<span class="lsg-commrow">${commTags}${moreComm}</span>` : ''}
          </span>
          <span class="lsg-right">
            <span class="lsg-count">${countLabel}</span>
            <span class="lsg-chevron">▾</span>
          </span>
        </button>
        <div class="lsg-body">
          <div class="intervention-list">${itemsHtml}</div>
        </div>
      </div>
    `;
  }

  _renderIntervention(iv, mode) {
    const directionMeta = this._directionMeta(iv.direction);
    const intensityClass = `intensity-${iv.intensity || 'moderate'}`;
    const sourceTitle = this._sourceLabel(iv.source_title);
    const dateStr = this._formatDate(iv.date);
    const langTag = (iv.language || 'en').toUpperCase();
    const priceReaction = this._priceReactionBadge(iv.price_reaction_pct_24h);
    const commodity = (iv.commodity || 'unknown').toUpperCase();
    const country = this._titleCase(iv.country || '');
    const speaker = iv.speaker || 'Unknown speaker';
    const role = this._humanizeRole(iv.role);
    const rationale = this._humanizeRationale(iv.rationale);

    const countryTagHtml = (mode === 'country') ? '' : `<span class="tag tag-country">${country}</span>`;
    const url = iv.source_url || '#';
    const isClickable = !!iv.source_url;

    // Render So What block scaled to detail level:
    //   compact → omit entirely
    //   bluf    → BLUF + drill-in link, no expandable analysis
    //   full    → full collapsible analysis (default)
    //
    // Staleness gate: signatures with should_render === false (expired analysis,
    // beyond the analytical_validity_days window) are suppressed entirely. The
    // intervention card still renders — we just don't show stale interpretation.
    const detail = this._getDetailLevel();
    let soWhatHtml = '';
    const sig = iv._absorption_signature;
    const sigShouldRender = sig && (sig.should_render !== false);
    if (sig && sigShouldRender && detail !== 'compact') {
      if (detail === 'bluf') {
        soWhatHtml = this._renderSoWhatBluf(sig, iv.country);
      } else {
        soWhatHtml = this._renderSoWhat(sig);
      }
    }

    // Compact mode: minimal card — header only, no tags or source row.
    // Used in regional roll-ups where many cards are stacked at low altitude.
    const isCompact = detail === 'compact';

    return `
      <div class="intervention-wrapper">
        <a class="intervention ${isClickable ? 'clickable' : ''} ${isCompact ? 'is-compact' : ''}" href="${this._escape(url)}" target="_blank" rel="noopener noreferrer">
          <div class="iv-top">
            <span class="iv-icon" title="${directionMeta.label}">${directionMeta.icon}</span>
            <div class="iv-headline-block">
              <div class="iv-speaker">
                <strong>${this._escape(speaker)}</strong>
                <span class="iv-role">· ${this._escape(role)}</span>
              </div>
              <div class="iv-quote">${this._escape(iv.quote_short || '')}</div>
            </div>
            <div class="iv-meta-right">
              <span class="iv-date">${dateStr}</span>
              <span class="iv-lang">${langTag}</span>
            </div>
          </div>
          ${isCompact ? '' : `
          <div class="iv-tags">
            ${countryTagHtml}
            <span class="tag tag-commodity">${commodity}</span>
            <span class="tag tag-direction tag-${directionMeta.cssClass}">${directionMeta.label}</span>
            ${rationale ? `<span class="tag tag-rationale">${this._escape(rationale)}</span>` : ''}
            <span class="tag tag-intensity ${intensityClass}">${(iv.intensity || 'moderate').toUpperCase()}</span>
            ${priceReaction}
            ${iv.verbal_only ? '<span class="tag tag-verbal" title="Verbal intervention with no formal policy action">VERBAL</span>' : ''}
          </div>
          <div class="iv-source">
            <span class="iv-source-label">Source:</span>
            <span class="iv-source-name">${this._escape(sourceTitle)}</span>
          </div>
          `}
        </a>
        ${soWhatHtml}
      </div>
    `;
  }

  /**
   * Render an analytical-staleness banner for a signature, if appropriate.
   * Returns empty string for `fresh` (don't clutter), otherwise returns a
   * color-coded banner (aging=cyan, stale=amber). `expired` is gated out
   * upstream so this never sees it.
   */
  _renderStalenessBanner(sig) {
    if (!sig) return '';
    const status = sig.staleness_status || 'fresh';
    if (status === 'fresh') return '';

    const days = sig.days_since_authored;
    const daysLeft = sig.days_until_expiry;
    let label = '';
    let icon = '';

    if (status === 'aging') {
      icon = 'ℹ️';
      label = `Analysis is ${Math.round(days)} days old — context may be shifting.`;
    } else if (status === 'stale') {
      icon = '⚠️';
      label = `Analysis is ${Math.round(days)} days old — conditions may have changed. Expires in ${Math.round(daysLeft)} days.`;
    } else {
      // Defensive — shouldn't reach here because expired is gated upstream
      return '';
    }

    return `
      <div class="sw-staleness sw-staleness-${status}">
        <span class="sw-staleness-icon">${icon}</span>
        <span class="sw-staleness-text">${this._escape(label)}</span>
      </div>
    `;
  }

  /**
   * BLUF-only So What rendering — for commodities.html and similar pages.
   * Shows the classification badge + short-form BLUF + a discreet drill-in
   * link to the country stability page where the full analysis lives.
   */
  _renderSoWhatBluf(sig, country) {
    const classificationMeta = this._classificationMeta(sig.classification);
    const countryLower = (country || '').toLowerCase();
    const countryDisplay = this._titleCase(country || '');
    // Convention: country stability pages live at /{country}-stability.html
    // (lebanon-stability.html, india-stability.html, china-stability.html, etc.)
    const drillUrl = countryLower ? `/${countryLower}-stability.html` : null;

    const drillHtml = drillUrl ? `
      <a class="sw-drillin" href="${this._escape(drillUrl)}">
        Why does this matter? <strong>${this._escape(countryDisplay)} stability page</strong> →
      </a>
    ` : '';

    const stalenessHtml = this._renderStalenessBanner(sig);

    return `
      <div class="so-what so-what-bluf">
        <div class="sw-header">
          <span class="sw-badge sw-badge-${classificationMeta.cssClass}">🔗 SO WHAT — ${classificationMeta.label}</span>
          ${sig.confidence ? `<span class="sw-confidence">Confidence: ${Math.round(sig.confidence * 100)}%</span>` : ''}
        </div>
        ${stalenessHtml}
        <div class="sw-bluf">${this._escape(sig.so_what_short || '')}</div>
        ${drillHtml}
      </div>
    `;
  }

  _renderSoWhat(sig) {
    const classificationMeta = this._classificationMeta(sig.classification);
    const chainSteps = (sig.transmission_chain || [])
      .map((step, i, arr) => {
        const isLast = i === arr.length - 1;
        const isIntervention = step.is_intervention;
        return `
          <div class="sw-chain-step ${isIntervention ? 'sw-chain-step-iv' : ''}">
            <span class="sw-chain-num">${step.step}</span>
            <span class="sw-chain-label">${this._escape(step.label)}</span>
          </div>
        `;
      }).join('');

    const ladder = sig.escalation_ladder || {};
    const nextRungs = (ladder.next_rungs || [])
      .map(rung => `
        <div class="sw-rung">
          <div class="sw-rung-name">${this._escape((rung.name || '').replace(/_/g, ' ').toUpperCase())}</div>
          <div class="sw-rung-desc">${this._escape(rung.description || '')}</div>
          <div class="sw-rung-meta">
            <span class="sw-rung-days">~${rung.estimated_days || '?'} days</span>
            <span class="sw-rung-prob">P=${Math.round((rung.probability || 0) * 100)}%</span>
          </div>
        </div>
      `).join('');

    const triggers = (ladder.trigger_conditions || [])
      .map(t => `<li>${this._escape(t)}</li>`).join('');

    const stressors = (sig.upstream_stressors || [])
      .map(s => `
        <div class="sw-stressor">
          <div class="sw-stressor-header">
            <span class="sw-stressor-theater">${this._escape((s.theater || '').toUpperCase())}</span>
            <span class="sw-stressor-mech">${this._escape((s.mechanism || '').replace(/_/g, ' '))}</span>
            <span class="sw-stressor-contrib">${Math.round((s.contribution || 0) * 100)}%</span>
          </div>
          ${s.note ? `<div class="sw-stressor-note">${this._escape(s.note)}</div>` : ''}
        </div>
      `).join('');

    const analog = sig.historical_analog;
    const analogHtml = analog ? `
      <div class="sw-section">
        <div class="sw-section-title">📚 Historical Analog</div>
        <div class="sw-analog">
          <div class="sw-analog-event"><strong>${this._escape(this._titleCase(analog.country || ''))} ${analog.year || ''}</strong> — ${this._escape(analog.event || '')}</div>
          ${analog.preceded ? `<div class="sw-analog-detail"><em>Preceded:</em> ${this._escape(analog.preceded)}</div>` : ''}
          ${analog.similarity ? `<div class="sw-analog-detail"><em>Pattern:</em> ${this._escape(analog.similarity)}</div>` : ''}
        </div>
      </div>
    ` : '';

    const stalenessHtml = this._renderStalenessBanner(sig);

    return `
      <div class="so-what">
        <div class="sw-header">
          <span class="sw-badge sw-badge-${classificationMeta.cssClass}">🔗 SO WHAT — ${classificationMeta.label}</span>
          ${sig.confidence ? `<span class="sw-confidence">Confidence: ${Math.round(sig.confidence * 100)}%</span>` : ''}
        </div>

        ${stalenessHtml}

        <div class="sw-bluf">${this._escape(sig.so_what_short || '')}</div>

        <button class="sw-toggle" type="button">Read full analysis ▾</button>

        <div class="sw-expanded">

          ${stressors ? `
            <div class="sw-section">
              <div class="sw-section-title">🌐 Upstream Stressors</div>
              ${stressors}
            </div>
          ` : ''}

          ${chainSteps ? `
            <div class="sw-section">
              <div class="sw-section-title">🦋 Transmission Chain</div>
              <div class="sw-chain">${chainSteps}</div>
            </div>
          ` : ''}

          ${nextRungs ? `
            <div class="sw-section">
              <div class="sw-section-title">🪜 Escalation Ladder · Current: <span class="sw-current-rung">${this._escape((ladder.current_rung || '').replace(/_/g, ' ').toUpperCase())}</span></div>
              <div class="sw-rungs">${nextRungs}</div>
              ${triggers ? `
                <div class="sw-triggers">
                  <div class="sw-triggers-label">Trigger conditions to watch:</div>
                  <ul>${triggers}</ul>
                </div>
              ` : ''}
              ${ladder.analyst_note ? `<div class="sw-analyst-note">${this._escape(ladder.analyst_note)}</div>` : ''}
            </div>
          ` : ''}

          ${analogHtml}

          ${sig.so_what_long ? `
            <div class="sw-section">
              <div class="sw-section-title">🧭 Full Analysis</div>
              <div class="sw-long-prose">${this._formatLongProse(sig.so_what_long)}</div>
            </div>
          ` : ''}

          <div class="sw-attribution">
            <span class="sw-attr-label">Authored by:</span>
            <span class="sw-attr-name">${this._escape(sig.authored_by || 'Asifah')}</span>
            ${sig.source_type ? `<span class="sw-attr-source">(${this._escape(sig.source_type.replace(/_/g, ' '))})</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _classificationMeta(classification) {
    const map = {
      defensive_statecraft: { label: 'Defensive statecraft', cssClass: 'defensive' },
      offensive_statecraft: { label: 'Offensive statecraft', cssClass: 'offensive' },
      mixed:                { label: 'Mixed posture',         cssClass: 'mixed' },
    };
    return map[classification] || { label: (classification || 'Analysis').replace(/_/g, ' '), cssClass: 'neutral' };
  }

  _directionMeta(direction) {
    const map = {
      suppress_demand:     { icon: '📉', label: 'Suppress demand',     cssClass: 'down' },
      boost_demand:        { icon: '📈', label: 'Boost demand',        cssClass: 'up' },
      restrict_supply:     { icon: '🚫', label: 'Restrict supply',     cssClass: 'down' },
      boost_supply:        { icon: '🛢️', label: 'Boost supply',        cssClass: 'up' },
      build_reserves:      { icon: '🏦', label: 'Build reserves',      cssClass: 'neutral' },
      draw_reserves:       { icon: '🪙', label: 'Draw reserves',       cssClass: 'neutral' },
      threaten_ban:        { icon: '⚠️', label: 'Threaten ban',        cssClass: 'down' },
      threaten_sanctions:  { icon: '⚖️', label: 'Threaten sanctions',  cssClass: 'down' },
    };
    return map[direction] || { icon: '🗣️', label: direction || 'Unknown', cssClass: 'neutral' };
  }

  _humanizeRole(role) {
    if (!role) return '';
    const map = {
      head_of_state:         'Head of state',
      finance_minister:      'Finance minister',
      central_bank_governor: 'Central bank governor',
      energy_minister:       'Energy minister',
      trade_minister:        'Trade minister',
      agriculture_minister:  'Agriculture minister',
      foreign_minister:      'Foreign minister',
    };
    return map[role] || role.replace(/_/g, ' ');
  }

  _humanizeRationale(rationale) {
    if (!rationale) return '';
    const map = {
      fx_defense:          'FX defense',
      inflation:           'Inflation',
      food_security:       'Food security',
      energy_security:     'Energy security',
      sanctions_response:  'Sanctions response',
      strategic_stockpile: 'Strategic stockpile',
      election_politics:   'Election politics',
      climate_policy:      'Climate policy',
      industrial_policy:   'Industrial policy',
    };
    return map[rationale] || rationale.replace(/_/g, ' ');
  }

  _sourceLabel(source) {
    if (!source) return 'Unknown';
    if (typeof source === 'string') return source;
    if (typeof source === 'object' && source.name) return source.name;
    return 'Unknown';
  }

  _priceReactionBadge(pct) {
    if (pct === null || pct === undefined) return '';
    const sign = pct > 0 ? '+' : '';
    const cls = pct > 0 ? 'up' : (pct < 0 ? 'down' : 'neutral');
    return `<span class="tag tag-price tag-${cls}" title="24h price reaction on linked commodity">${sign}${pct.toFixed(2)}%</span>`;
  }

  _formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const hours = (now - d) / (1000 * 60 * 60);
      if (hours < 1)  return 'just now';
      if (hours < 24) return `${Math.floor(hours)}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return iso.slice(0, 10);
    }
  }

  _formatLongProse(text) {
    if (!text) return '';
    return text
      .split('\n\n')
      .map(para => `<p>${this._escape(para.trim())}</p>`)
      .join('');
  }

  _titleCase(s) {
    if (!s) return '';
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  _escape(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _css() {
    return `
      :host {
        display: block;
        --_bg:        var(--lsc-bg, #0d1b2e);
        --_border:    var(--lsc-border, #1e3a5f);
        --_accent:    var(--lsc-accent, #38bdf8);
        --_text:      var(--lsc-text-primary, #e2f0fb);
        --_text-2:    var(--lsc-text-secondary, #93c5fd);
        --_text-3:    var(--lsc-text-muted, #6b7d99);
        --_radius:    14px;
        --_radius-sm: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: var(--_text);
      }

      .card {
        background: var(--_bg);
        border: 1px solid var(--_border);
        border-radius: var(--_radius);
        padding: 20px 22px;
        position: relative;
        overflow: hidden;
      }
      .card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--_accent), transparent);
        opacity: 0.6;
      }

      .header { margin-bottom: 14px; }
      .title-row { display: flex; align-items: center; gap: 10px; }
      .icon { font-size: 1.4em; }
      .title { margin: 0; font-size: 1.1em; font-weight: 600; color: var(--_text); letter-spacing: 0.01em; }
      .live-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: var(--_accent); margin-left: auto;
        animation: pulse 2.6s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50%      { opacity: 1.0; transform: scale(1.15); }
      }
      .subtitle { margin: 4px 0 0 0; font-size: 0.85em; color: var(--_text-3); line-height: 1.4; }

      .breakdown {
        display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
        padding: 10px 0 14px 0;
        border-bottom: 1px solid var(--_border);
        margin-bottom: 12px;
      }
      .breakdown-label { font-size: 0.8em; color: var(--_text-2); font-weight: 500; }
      .breakdown-sw-hint { color: var(--_accent); font-weight: 600; }
      .breakdown-pill {
        font-size: 0.75em; padding: 3px 9px; border-radius: 999px;
        background: rgba(56, 189, 248, 0.08);
        border: 1px solid var(--_border); color: var(--_text-2);
      }
      .breakdown-pill b { color: var(--_accent); font-weight: 700; margin-left: 4px; }

      .intervention-list { display: flex; flex-direction: column; gap: 14px; }
      /* --- Speaker grouping: one expandable card per speaker --- */
      .speaker-group-list { display: flex; flex-direction: column; gap: 12px; }
      .lsg { border: 1px solid var(--_border); border-radius: var(--_radius-sm); background: rgba(255,255,255,0.015); overflow: hidden; }
      .lsg-toggle { width: 100%; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; cursor: pointer; text-align: left; background: transparent; border: none; color: inherit; font: inherit; transition: background 0.15s ease; }
      .lsg-toggle:hover { background: rgba(56,189,248,0.04); }
      .lsg-icon { font-size: 1.3em; flex-shrink: 0; line-height: 1.2; }
      .lsg-headline { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
      .lsg-name-row { font-size: 0.95em; color: var(--_text); }
      .lsg-name { font-weight: 700; }
      .lsg-role { color: var(--_text-3); font-weight: 400; font-size: 0.85em; }
      .lsg-teaser { font-size: 0.85em; color: var(--_text-2); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
      .lsg-commrow { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
      .lsg-commtag { font-size: 0.65em; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: rgba(251,191,36,0.12); color: #fbbf24; letter-spacing: 0.03em; }
      .lsg-commtag-more { background: rgba(255,255,255,0.05); color: var(--_text-3); }
      .lsg-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
      .lsg-count { font-size: 0.72em; font-weight: 700; white-space: nowrap; padding: 3px 10px; border-radius: 999px; background: rgba(56,189,248,0.1); color: var(--_accent); }
      .lsg-chevron { color: var(--_text-3); font-size: 0.9em; transition: color 0.15s ease; }
      .lsg-toggle:hover .lsg-chevron { color: var(--_accent); }
      .lsg-body { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out; padding: 0 14px; }
      .lsg.open .lsg-body { max-height: 6000px; transition: max-height 0.6s ease-in; padding: 0 14px 14px; }
      .intervention-wrapper { display: flex; flex-direction: column; }

      .intervention {
        display: block; text-decoration: none; color: inherit;
        padding: 12px 14px;
        border: 1px solid var(--_border);
        border-radius: var(--_radius-sm);
        background: rgba(255, 255, 255, 0.015);
        transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
      }
      .intervention.clickable { cursor: pointer; }
      .intervention.clickable:hover {
        border-color: var(--_accent);
        background: rgba(56, 189, 248, 0.04);
        transform: translateY(-1px);
      }

      .iv-top { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
      .iv-icon { font-size: 1.3em; flex-shrink: 0; line-height: 1.2; }
      .iv-headline-block { flex: 1; min-width: 0; }
      .iv-speaker { font-size: 0.95em; color: var(--_text); margin-bottom: 4px; }
      .iv-speaker strong { font-weight: 600; }
      .iv-role { color: var(--_text-3); font-weight: 400; font-size: 0.85em; }
      .iv-quote { font-size: 0.85em; color: var(--_text-2); line-height: 1.45; }

      .iv-meta-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
      .iv-date { font-size: 0.75em; color: var(--_text-3); }
      .iv-lang {
        font-size: 0.65em; font-weight: 700; padding: 1px 6px; border-radius: 3px;
        background: rgba(56, 189, 248, 0.1); color: var(--_accent); letter-spacing: 0.05em;
      }

      .iv-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; }
      .tag {
        font-size: 0.7em; padding: 2px 8px; border-radius: 999px;
        background: rgba(255, 255, 255, 0.05); color: var(--_text-2);
        letter-spacing: 0.03em; font-weight: 500;
      }
      .tag-country     { background: rgba(56, 189, 248, 0.12); color: var(--_accent); font-weight: 600; }
      .tag-commodity   { background: rgba(251, 191, 36, 0.12); color: #fbbf24; font-weight: 600; }
      .tag-direction   { font-weight: 600; }
      .tag-direction.tag-up      { background: rgba(34, 197, 94, 0.12);  color: #22c55e; }
      .tag-direction.tag-down    { background: rgba(239, 68, 68, 0.12);  color: #ef4444; }
      .tag-direction.tag-neutral { background: rgba(148, 163, 184, 0.12); color: #94a3b8; }
      .tag-rationale   { background: rgba(168, 85, 247, 0.10); color: #c084fc; }
      .tag-intensity   { font-weight: 700; letter-spacing: 0.06em; }
      .intensity-strong   { background: rgba(239, 68, 68, 0.15);   color: #f87171; }
      .intensity-moderate { background: rgba(251, 191, 36, 0.12);  color: #fbbf24; }
      .intensity-mild     { background: rgba(148, 163, 184, 0.10); color: #94a3b8; }
      .tag-price.tag-up      { background: rgba(34, 197, 94, 0.10);  color: #4ade80; }
      .tag-price.tag-down    { background: rgba(239, 68, 68, 0.10);  color: #f87171; }
      .tag-price.tag-neutral { background: rgba(148, 163, 184, 0.10); color: #94a3b8; }
      .tag-verbal { background: rgba(148, 163, 184, 0.08); color: var(--_text-3); }

      .iv-source { font-size: 0.7em; color: var(--_text-3); }
      .iv-source-label { opacity: 0.7; margin-right: 4px; }
      .iv-source-name { color: var(--_text-2); }

      /* Compact card — used in regional roll-ups (detail="compact") */
      .intervention.is-compact { padding: 8px 12px; }
      .intervention.is-compact .iv-top { margin-bottom: 0; }

      /* Drill-in link for BLUF mode (detail="bluf") */
      .sw-drillin {
        display: inline-block;
        margin-top: 6px;
        font-size: 0.78em;
        color: var(--_text-3);
        text-decoration: none;
        letter-spacing: 0.02em;
        transition: color 0.15s ease;
      }
      .sw-drillin:hover { color: var(--_accent); }
      .sw-drillin strong { color: var(--_text-2); font-weight: 600; }
      .sw-drillin:hover strong { color: var(--_accent); }

      /* BLUF-mode So What — no expandable, just BLUF + drill-in */
      .so-what-bluf .sw-bluf { margin-bottom: 4px; }

      /* Staleness banner — visually degrades trust as analysis ages */
      .sw-staleness {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        margin: 4px 0 8px 0;
        border-radius: var(--_radius-sm);
        font-size: 0.75em;
        line-height: 1.4;
      }
      .sw-staleness-icon { font-size: 1.05em; flex-shrink: 0; }
      .sw-staleness-text { color: var(--_text-2); }
      .sw-staleness-aging {
        background: rgba(56, 189, 248, 0.06);
        border-left: 2px solid var(--_accent);
      }
      .sw-staleness-aging .sw-staleness-text { color: var(--_text-2); }
      .sw-staleness-stale {
        background: rgba(251, 191, 36, 0.08);
        border-left: 2px solid #fbbf24;
      }
      .sw-staleness-stale .sw-staleness-text { color: #fde68a; font-weight: 500; }

      /* SO WHAT BLOCK */
      .so-what {
        margin-top: -1px;
        padding: 14px 14px 12px 16px;
        border: 1px solid var(--_border);
        border-top: none;
        border-left: 3px solid var(--_accent);
        border-radius: 0 0 var(--_radius-sm) var(--_radius-sm);
        background: rgba(56, 189, 248, 0.025);
      }
      .sw-header {
        display: flex; align-items: center; justify-content: space-between;
        gap: 8px; flex-wrap: wrap; margin-bottom: 8px;
      }
      .sw-badge { font-size: 0.7em; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; border-radius: 999px; }
      .sw-badge-defensive  { background: rgba(56, 189, 248, 0.15); color: var(--_accent); }
      .sw-badge-offensive  { background: rgba(239, 68, 68, 0.15);  color: #ef4444; }
      .sw-badge-mixed      { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
      .sw-badge-neutral    { background: rgba(148, 163, 184, 0.12); color: #94a3b8; }
      .sw-confidence { font-size: 0.7em; color: var(--_text-3); }
      .sw-bluf { font-size: 0.88em; color: var(--_text-2); line-height: 1.55; margin-bottom: 8px; }
      .sw-toggle {
        background: none; border: none; padding: 4px 0;
        color: var(--_accent); font-size: 0.8em; font-weight: 600;
        cursor: pointer; letter-spacing: 0.02em; font-family: inherit;
      }
      .sw-toggle:hover { text-decoration: underline; }

      .sw-expanded { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out; }
      .so-what.open .sw-expanded { max-height: 4000px; transition: max-height 0.6s ease-in; margin-top: 8px; }

      .sw-section { margin: 14px 0; padding-top: 12px; border-top: 1px dashed rgba(56, 189, 248, 0.18); }
      .sw-section:first-child { border-top: none; padding-top: 0; }
      .sw-section-title {
        font-size: 0.78em; font-weight: 700;
        color: var(--_text); letter-spacing: 0.04em;
        margin-bottom: 10px;
      }
      .sw-current-rung { font-size: 0.85em; color: var(--_accent); font-weight: 700; margin-left: 4px; }

      .sw-stressor {
        padding: 8px 10px; margin-bottom: 6px;
        background: rgba(56, 189, 248, 0.04);
        border-radius: var(--_radius-sm);
        border-left: 2px solid var(--_accent);
      }
      .sw-stressor-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
      .sw-stressor-theater {
        font-size: 0.7em; font-weight: 700; letter-spacing: 0.04em;
        padding: 1px 7px; border-radius: 999px;
        background: rgba(56, 189, 248, 0.15); color: var(--_accent);
      }
      .sw-stressor-mech { font-size: 0.8em; color: var(--_text-2); font-weight: 500; }
      .sw-stressor-contrib { margin-left: auto; font-size: 0.7em; color: var(--_text-3); font-weight: 700; }
      .sw-stressor-note { font-size: 0.78em; color: var(--_text-3); line-height: 1.5; }

      .sw-chain { display: flex; flex-direction: column; gap: 6px; }
      .sw-chain-step { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
      .sw-chain-num {
        flex-shrink: 0; width: 22px; height: 22px;
        display: inline-flex; align-items: center; justify-content: center;
        border-radius: 50%;
        background: rgba(56, 189, 248, 0.10); color: var(--_accent);
        font-size: 0.7em; font-weight: 700;
      }
      .sw-chain-step-iv .sw-chain-num { background: var(--_accent); color: var(--_bg); }
      .sw-chain-label { font-size: 0.83em; color: var(--_text-2); line-height: 1.4; }
      .sw-chain-step-iv .sw-chain-label { color: var(--_text); font-weight: 600; }

      .sw-rungs { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-bottom: 10px; }
      .sw-rung {
        padding: 8px 10px;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--_border);
        border-radius: var(--_radius-sm);
      }
      .sw-rung-name { font-size: 0.72em; font-weight: 700; color: var(--_text); letter-spacing: 0.05em; margin-bottom: 4px; }
      .sw-rung-desc { font-size: 0.78em; color: var(--_text-2); line-height: 1.4; margin-bottom: 6px; }
      .sw-rung-meta { display: flex; justify-content: space-between; font-size: 0.7em; color: var(--_text-3); }
      .sw-rung-prob { color: var(--_accent); font-weight: 700; }

      .sw-triggers {
        padding: 8px 10px; margin: 8px 0;
        background: rgba(251, 191, 36, 0.04);
        border-left: 2px solid #fbbf24;
        border-radius: var(--_radius-sm);
      }
      .sw-triggers-label { font-size: 0.75em; font-weight: 700; color: #fbbf24; margin-bottom: 4px; }
      .sw-triggers ul { list-style: none; padding: 0; margin: 0; font-size: 0.78em; color: var(--_text-2); }
      .sw-triggers li { padding: 2px 0; }
      .sw-triggers li::before { content: '▸ '; color: #fbbf24; }
      .sw-analyst-note { font-size: 0.75em; color: var(--_text-3); font-style: italic; line-height: 1.5; margin-top: 6px; }

      .sw-analog {
        padding: 8px 10px;
        background: rgba(168, 85, 247, 0.04);
        border-left: 2px solid #c084fc;
        border-radius: var(--_radius-sm);
      }
      .sw-analog-event { font-size: 0.85em; color: var(--_text); margin-bottom: 4px; }
      .sw-analog-detail { font-size: 0.78em; color: var(--_text-2); line-height: 1.5; margin-top: 2px; }

      .sw-long-prose p { font-size: 0.85em; color: var(--_text-2); line-height: 1.6; margin: 0 0 10px 0; }
      .sw-long-prose p:last-child { margin-bottom: 0; }

      .sw-attribution {
        margin-top: 14px; padding-top: 10px;
        border-top: 1px dashed rgba(56, 189, 248, 0.18);
        font-size: 0.7em; color: var(--_text-3);
      }
      .sw-attr-label { opacity: 0.7; }
      .sw-attr-name { color: var(--_text-2); margin-left: 4px; font-weight: 500; }
      .sw-attr-source { margin-left: 6px; font-style: italic; opacity: 0.7; }

      .state-loading { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
      .skeleton {
        height: 56px; border-radius: var(--_radius-sm);
        background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        background-size: 200% 100%;
        animation: shimmer 1.6s linear infinite;
      }
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .state-empty, .state-error { padding: 20px 12px; text-align: center; }
      .state-empty-icon, .state-error-icon { font-size: 2em; margin-bottom: 8px; opacity: 0.8; }
      .state-empty-msg, .state-error-msg { font-size: 0.95em; color: var(--_text); font-weight: 500; margin-bottom: 6px; }
      .state-empty-hint, .state-error-hint { font-size: 0.8em; color: var(--_text-3); line-height: 1.5; max-width: 420px; margin: 0 auto; }

      .footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--_border); text-align: right; }
      .footer-text { font-size: 0.68em; color: var(--_text-3); letter-spacing: 0.04em; }

      @media (max-width: 600px) {
        .card { padding: 16px 14px; }
        .iv-top { flex-wrap: wrap; }
        .iv-meta-right { flex-direction: row; gap: 8px; width: 100%; justify-content: space-between; margin-top: 4px; }
        .sw-rungs { grid-template-columns: 1fr; }
      }
    `;
  }
}

if (!customElements.get('leader-signals-card')) {
  customElements.define('leader-signals-card', LeaderSignalsCard);
}
