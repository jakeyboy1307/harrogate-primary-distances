// The map view: sticker pins numbered by list order, plain dots for the rest, the search ring and the open school's catchment.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { chipText, esc, MI, type Area, type LatLng, type Mode, type School } from './engine';
import { addToList, ordinal, rankOf } from './store';
import { distTxt, toast, vOf } from './ui';

export interface MapCtx { mode: () => Mode; onOpen: (s: School) => void }

export class SchoolMap {
  map: L.Map;
  private pins = L.layerGroup();
  private scene = L.layerGroup();
  private catchLayer = L.layerGroup();
  private home: LatLng | null = null;
  private ring: L.Circle | null = null;
  private selected: number | null = null;
  private shown: School[] = [];
  private popup: L.Popup | null = null;

  constructor(el: HTMLElement, private catches: Area[], private ctx: MapCtx) {
    this.map = L.map(el, { zoomControl: false, attributionControl: true }).setView([54.05, -1.62], 11);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles © Esri, HERE, Garmin, © OpenStreetMap contributors · walking routes: FOSSGIS OSRM · postcodes: postcodes.io · catchments: North Yorkshire Council',
    }).addTo(this.map);
    this.map.createPane('catch').style.zIndex = '350';
    this.catchLayer.addTo(this.map); this.scene.addTo(this.map); this.pins.addTo(this.map);
    this.map.on('popupopen', (e) => {
      const el = e.popup.getElement();
      el?.querySelector<HTMLButtonElement>('[data-see]')?.addEventListener('click', () => {
        const s = this.shown.find((x) => x.id === +el.querySelector<HTMLElement>('[data-see]')!.dataset.see!);
        if (s) this.ctx.onOpen(s);
      });
      el?.querySelector<HTMLButtonElement>('[data-add]')?.addEventListener('click', (ev) => {
        const s = this.shown.find((x) => x.id === +(ev.currentTarget as HTMLElement).dataset.add!);
        if (!s) return;
        const r = addToList(s.dfe);
        toast(r === 'full' ? 'Your list is full. Remove a school to add another.' : `Added as your ${ordinal(rankOf(s.dfe)!)} choice`);
        this.map.closePopup();
      });
    });
    // opening another school's popup closes this one first, so only reset when the current popup closes
    this.map.on('popupclose', (e) => {
      if (e.popup !== this.popup) return;
      this.popup = null; this.selected = null; this.catchLayer.clearLayers(); this.draw();
    });
  }

  zoomIn() { this.map.zoomIn(); }
  zoomOut() { this.map.zoomOut(); }
  refresh() { this.map.invalidateSize(); }
  recentre() { if (this.ring) this.map.fitBounds(this.ring.getBounds(), { padding: [30, 30] }); }

  setScene(home: LatLng, radiusMi: number, shown: School[]) {
    this.home = home; this.shown = shown;
    this.scene.clearLayers();
    this.ring = L.circle(home, { radius: radiusMi * MI, color: '#2747D8', weight: 2, dashArray: '2 9', fillColor: '#2747D8', fillOpacity: .03, interactive: false }).addTo(this.scene);
    // label the ring at its lower right
    const b = this.ring.getBounds();
    const at: LatLng = [home[0] - (home[0] - b.getSouth()) * 0.7071, home[1] + (b.getEast() - home[1]) * 0.7071];
    L.marker(at, { interactive: false, keyboard: false, icon: L.divIcon({ className: '', html: `<span class="ring-label">${radiusMi} mile${radiusMi === 1 ? '' : 's'}</span>`, iconSize: [70, 24], iconAnchor: [35, 12] }) }).addTo(this.scene);
    L.marker(home, { keyboard: false, interactive: false, zIndexOffset: 1000,
      icon: L.divIcon({ className: '', html: '<div class="you-pin"><b>you!</b><i></i><s></s></div>', iconSize: [70, 64], iconAnchor: [35, 60] }) }).addTo(this.scene);
    this.draw();
    this.recentre();
  }

  draw() {
    this.pins.clearLayers();
    const mode = this.ctx.mode();
    for (const s of this.shown) {
      const rank = rankOf(s.dfe), v = vOf(s), sel = this.selected === s.id;
      const html = rank
        ? `<div class="pin p-${v}${sel ? ' big' : ''}">${rank}</div>`
        : `<div class="dot p-${v}${sel ? ' big' : ''}"></div>`;
      const size = rank ? (sel ? 48 : 36) : sel ? 30 : 22;
      const m = L.marker(s.ll, { icon: L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }), zIndexOffset: rank ? 500 : 0, title: `${s.name}: ${chipText(s.result, mode)}` });
      m.on('click', () => this.select(s.id));
      this.pins.addLayer(m);
    }
  }

  select(id: number) {
    const s = this.shown.find((x) => x.id === id);
    if (!s) return;
    this.selected = id;
    this.catchLayer.clearLayers();
    for (const i of s.cz || [])
      L.polygon(this.catches[i].p as unknown as L.LatLngExpression[][][], { pane: 'catch', color: '#2747D8', weight: 3, fillColor: '#2747D8', fillOpacity: .09, interactive: false }).addTo(this.catchLayer);
    this.draw();
    const rank = rankOf(s.dfe), mode = this.ctx.mode();
    const why = s.result ? s.result.label + '.' : '';
    const html = `<div class="pop">
      <div class="pop-top"><span class="chip chip-sm v-${vOf(s)}">${esc(chipText(s.result, mode))}</span><span>${esc(distTxt(s))}</span></div>
      <h3>${esc(s.name.replace(/,.*$/, ''))}</h3>
      <p>${esc(why)}${s.cz?.length ? ' The blue outline is its catchment.' : ''}</p>
      <div class="pop-acts"><button type="button" class="btn btn-sm btn-dark" data-see="${s.id}">See everything</button>
      ${rank ? `<span class="rank-pill">${ordinal(rank)} on your list</span>` : `<button type="button" class="btn btn-sm" data-add="${s.id}">Add to list</button>`}</div></div>`;
    const p = L.popup({ className: 'map-pop', maxWidth: 340, minWidth: 260, autoPanPadding: [40, 40], offset: [0, -10] }).setLatLng(s.ll).setContent(html);
    this.popup = p;
    p.openOn(this.map);
  }
}
