//Ailes générées par un modèle de nervation paramétrique (plan de Comstock-Needham) :
//une cellule discale près de la base, des nervures en éventail jusqu'au bord,
//et des membranes = cellules comprises entre deux nervures voisines.
//Le SVG produit a le même format que les ailes extraites des planches
//(contours + cellules fermées + ellipses, attache au corps sur le bord droit).
//Un modèle généré se note "genere:<graine>" : la même graine redonne la même aile.
//Des réglages peuvent s'y ajouter : "genere:<graine>?ep=4&oc=6" (cf. REGLAGES),
//ainsi que des ocelles placés à la main : "of=x,y,r;x,y,r" (coordonnées de l'aile, unité = longueur 1).
const AilesGenerees = (function () {
    const PREFIXE = "genere:",
        TAILLE = 300,           //unités SVG pour une aile de longueur 1
        STYLE = "fill:none;stroke:#e10000;stroke-width:1;stroke-dasharray:none;stroke-opacity:1";

    //-- géométrie --------------------------------------------------------------
    const P = (x, y) => ({ x, y }),
        add = (a, b) => P(a.x + b.x, a.y + b.y),
        sub = (a, b) => P(a.x - b.x, a.y - b.y),
        mul = (a, k) => P(a.x * k, a.y * k),
        lerp = (a, b, t) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t),
        len = a => Math.hypot(a.x, a.y);

    //spline de Catmull-Rom échantillonnée (ouverte ou fermée)
    function spline(pts, fermee, pas) {
        const n = pts.length, out = [],
            g = i => fermee ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))],
            m = fermee ? n : n - 1;
        for (let i = 0; i < m; i++) {
            const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
            for (let s = 0; s < pas; s++) {
                const t = s / pas, t2 = t * t, t3 = t2 * t,
                    c = k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2
                        + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
                out.push(P(c("x"), c("y")));
            }
        }
        if (!fermee) out.push(pts[n - 1]);
        return out;
    }
    //point à la fraction f de la longueur d'une polyligne (et indice du segment)
    function le_long(pl, f) {
        let L = 0;
        const c = [0];
        for (let i = 1; i < pl.length; i++) { L += len(sub(pl[i], pl[i - 1])); c.push(L); }
        const t = f * L;
        let i = 1;
        while (i < pl.length - 1 && c[i] < t) i++;
        const u = (t - c[i - 1]) / ((c[i] - c[i - 1]) || 1);
        return { p: lerp(pl[i - 1], pl[i], u), i };
    }
    function troncon(pl, f0, f1) {
        const a = le_long(pl, f0), b = le_long(pl, f1);
        return [a.p, ...pl.slice(a.i, b.i), b.p];
    }
    //nervure : courbe légèrement arquée de a vers b
    function nervure(a, b, arc) {
        const m = lerp(a, b, 0.5), n = P(-(b.y - a.y), b.x - a.x);
        return spline([a, add(m, mul(n, arc)), b], false, 8);
    }
    //décale les bords d'une membrane de d vers l'intérieur pour laisser la place de la nervure
    //(chaque sommet glisse sur la bissectrice des normales intérieures de ses deux côtés)
    function retrait(poly, d) {
        //points régulièrement espacés : supprime les points confondus qui fausseraient les normales
        const pts = reechantillonner(poly, d / 2);
        let signe = 0;
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i], q = pts[(i + 1) % pts.length];
            signe += p.x * q.y - q.x * p.y;
        }
        signe = signe > 0 ? 1 : -1;
        const normale = (a, b) => {
            const e = sub(b, a), l = len(e) || 1;
            return P(-e.y / l * signe, e.x / l * signe);
        };
        let res = pts.map((p, i) => {
            const prec = pts[(i - 1 + pts.length) % pts.length], suiv = pts[(i + 1) % pts.length],
                n1 = normale(prec, p), n2 = normale(p, suiv),
                b = add(n1, n2), lb = len(b);
            if (lb < 1e-6) return add(p, mul(n1, d));
            const bis = mul(b, 1 / lb),
                cos = Math.max(0.5, bis.x * n1.x + bis.y * n1.y);
            return add(p, mul(bis, d / cos));
        });
        //lissage : efface les éperons laissés aux angles aigus
        for (let k = 0; k < 3; k++)
            res = res.map((p, i) => lerp(p, lerp(res[(i - 1 + res.length) % res.length], res[(i + 1) % res.length], 0.5), 0.5));
        return res;
    }
    //polygone fermé rééchantillonné à pas constant
    function reechantillonner(poly, pas) {
        const ferme = [...poly, poly[0]];
        let L = 0;
        for (let i = 1; i < ferme.length; i++) L += len(sub(ferme[i], ferme[i - 1]));
        const n = Math.max(8, Math.round(L / pas)), out = [];
        for (let k = 0; k < n; k++) out.push(le_long(ferme, k / n).p);
        return out;
    }
    function aire(poly) {
        let a = 0;
        for (let i = 0; i < poly.length; i++) {
            const p = poly[i], q = poly[(i + 1) % poly.length];
            a += p.x * q.y - q.x * p.y;
        }
        return Math.abs(a / 2);
    }

    //-- hasard reproductible ---------------------------------------------------
    function hasard(graine) {
        let s = graine >>> 0;
        return () => {
            s = s + 0x6D2B79F5 | 0;
            let t = Math.imul(s ^ s >>> 15, 1 | s);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    //réglages modifiables (outil de réglage de la page) : clé, libellé, bornes, pas
    const REGLAGES = [
        { cle: "nf", nom: "Nervures (aile antérieure)", min: 3, max: 14, pas: 1 },
        { cle: "nh", nom: "Nervures (aile postérieure)", min: 3, max: 12, pas: 1 },
        { cle: "ep", nom: "Épaisseur des nervures", min: 1, max: 20, pas: 0.5 },
        { cle: "dc", nom: "Cellule discale", min: 0.2, max: 0.7, pas: 0.01 },
        { cle: "ap", nom: "Pointe de l'apex", min: 0, max: 1, pas: 0.01 },
        { cle: "sc", nom: "Festons", min: 0, max: 1, pas: 0.01 },
        { cle: "tl", nom: "Queue", min: 0, max: 1, pas: 0.01 },
        { cle: "oc", nom: "Ocelles", min: 0, max: 16, pas: 1 },
        { cle: "ot", nom: "Taille des ocelles", min: 0.3, max: 2.5, pas: 0.05 }
    ];
    //paramètres de l'aile tirés à partir de la graine
    function parametres(graine) {
        const r = hasard(graine), entre = (a, b) => a + (b - a) * r();
        return {
            nf: Math.round(entre(5, 11)),       //nervures de l'aile antérieure
            nh: Math.round(entre(4, 9)),        //nervures de l'aile postérieure
            dc: entre(0.3, 0.62),               //taille de la cellule discale
            ap: entre(0, 1),                    //pointe de l'apex
            sc: entre(0, 1),                    //festons du bord postérieur
            tl: r() < 0.3 ? entre(0.4, 1) : 0,  //queue (machaons)
            oc: r() < 0.6 ? Math.round(entre(2, 8)) : 0,   //nombre d'ocelles
            ep: 7,                              //demi-épaisseur des nervures entre les membranes
            ot: 1,                              //taille relative des ocelles
            graine
        };
    }
    //"genere:42?ep=4" -> paramètres de la graine 42, épaisseur remplacée par 4
    function lire(modele) {
        const [g, q] = String(modele).replace(PREFIXE, "").split("?"),
            o = parametres(parseInt(g, 10) >>> 0);
        o.of = null;
        new URLSearchParams(q || "").forEach((v, k) => {
            const r = REGLAGES.find(x => x.cle == k);
            if (r && isFinite(parseFloat(v))) o[k] = Math.min(r.max, Math.max(r.min, parseFloat(v)));
            //ocelles placés à la main : remplacent les ocelles automatiques
            if (k == "of") o.of = v ? v.split(";").map(t => t.split(",").map(Number))
                .filter(t => t.length == 3 && t.every(isFinite))
                .map(([x, y, r]) => ({ c: P(x, y), r: Math.min(0.2, Math.max(0.005, r)) })).slice(0, 64) : [];
        });
        o.nf = Math.round(o.nf); o.nh = Math.round(o.nh); o.oc = Math.round(o.oc);
        return o;
    }
    //modèle correspondant à une graine et des réglages (seuls ceux qui diffèrent sont notés)
    //ocelles : liste [{x, y, r}] placée à la main (null = ocelles automatiques)
    function modele(graine, reglages, ocelles) {
        const base = parametres(graine),
            //un écart inférieur au pas du curseur n'est pas un réglage (arrondi)
            q = REGLAGES.filter(r => reglages && reglages[r.cle] !== undefined
                    && Math.abs(reglages[r.cle] - base[r.cle]) > r.pas / 2)
                .map(r => r.cle + "=" + (r.pas < 1 ? String(+(+reglages[r.cle]).toFixed(2)) : Math.round(reglages[r.cle])));
        if (ocelles) q.push("of=" + ocelles.map(t => [t.x, t.y, t.r].map(v => +v.toFixed(4)).join(",")).join(";"));
        return PREFIXE + graine + (q.length ? "?" + q.join("&") : "");
    }

    //-- construction -------------------------------------------------------------
    function construire(o) {
        const R = P(0, 0),
            apex = P(-1.0 - 0.12 * o.ap, -0.62 - 0.08 * o.ap),
            //aile antérieure : base, côte, apex, bord externe, angle interne, bord interne
            fw = [R, P(-0.5, -0.5), apex, P(-0.92 + 0.1 * o.ap, -0.25), P(-0.78, 0.0),
                P(-0.62, 0.12), P(-0.3, 0.1), P(-0.02, 0.04)],
            hw = [P(-0.04, 0.05), P(-0.45, 0.06), P(-0.72, 0.22), P(-0.74, 0.45)];
        //aile postérieure : bord festonné, avec une queue éventuelle
        const festons = 6;
        for (let i = 1; i <= festons; i++) {
            const t = i / (festons + 1),
                b = lerp(P(-0.74, 0.45), P(-0.28, 0.86), t),
                dir = sub(b, P(-0.2, 0.25)),
                k = (i % 2 ? 1 : -1) * 0.03 * o.sc;
            let q = add(b, mul(dir, k / len(dir)));
            if (o.tl > 0 && i === 4) q = add(q, mul(dir, 0.55 * o.tl / len(dir)));
            hw.push(q);
        }
        hw.push(P(-0.28, 0.86), P(-0.12, 0.55), P(-0.02, 0.22));

        const ailes = [];
        [[fw, o.nf, 0.95], [hw, o.nh, 0.8]].forEach(([ctrl, n, echelle], post) => {
            const contour = spline(ctrl, true, 24),
                iC = Math.round(contour.length * (post ? 0.05 : 0.06)),
                iI = Math.round(contour.length * 0.93),
                bord = contour.slice(iC, iI),
                dc = o.dc * echelle,
                //cellule discale : bord supérieur, bord distal, bord inférieur
                Q = post
                    ? [P(-0.06, 0.08), P(-0.06 - dc * 0.95, 0.14), P(-0.06 - dc * 0.85, 0.3), P(-0.05, 0.18)]
                    : [P(-0.08, -0.03), P(-0.06 - dc, -0.27 - 0.1 * dc), P(-0.07 - dc * 1.02, -0.08), P(-0.07, 0.02)],
                //les nervures partent surtout du bord externe de la cellule discale :
                //de la fin de son bord supérieur au début de son bord inférieur
                lq = [len(sub(Q[1], Q[0])), len(sub(Q[2], Q[1])), len(sub(Q[3], Q[2]))],
                lt = lq[0] + lq[1] + lq[2],
                q0 = 0.65 * lq[0] / lt, q1 = (lq[0] + lq[1] + 0.35 * lq[2]) / lt,
                fb = k => 0.04 + 0.92 * (k + 0.5) / n,     //arrivée de la nervure k sur le bord
                fq = k => q0 + (q1 - q0) * (k + 0.5) / n,  //départ sur la cellule discale
                nervures = [];
            for (let k = 0; k < n; k++)
                nervures.push(nervure(le_long(Q, fq(k)).p, le_long(bord, fb(k)).p, ((k + 0.5) / n - 0.5) * 0.12));
            //membranes : entre deux nervures voisines, le bord et la cellule discale
            const cellules = [Q];
            cellules.push([...contour.slice(0, iC), ...troncon(bord, 0, fb(0)), ...[...nervures[0]].reverse(),
                ...troncon(Q, 0, fq(0)).reverse(), R]);
            for (let k = 0; k < n - 1; k++)
                cellules.push([...nervures[k], ...troncon(bord, fb(k), fb(k + 1)), ...[...nervures[k + 1]].reverse(),
                    ...troncon(Q, fq(k), fq(k + 1)).reverse()]);
            cellules.push([...nervures[n - 1], ...troncon(bord, fb(n - 1), 1), ...contour.slice(iI),
                ...troncon(Q, fq(n - 1), 1).reverse()]);
            //emplacements possibles des ocelles : près du bord, entre deux nervures
            const places = [];
            for (let k = 0; k < n - 1; k++) {
                const b = le_long(bord, (fb(k) + fb(k + 1)) / 2).p,
                    c = lerp(b, lerp(le_long(Q, fq(k)).p, le_long(Q, fq(k + 1)).p, 0.5), 0.2),
                    larg = len(sub(le_long(bord, fb(k)).p, le_long(bord, fb(k + 1)).p));
                places.push({ c, r: Math.min(0.05, larg * 0.22) });
            }
            ailes.push({ contour, cellules, places, taches: [] });
        });
        //ocelles : les oc premiers emplacements dans un ordre fixé par la graine
        //(augmenter oc ajoute des ocelles sans déplacer les autres)
        const r = hasard(o.graine ^ 0x5bd1e995), places = [];
        ailes.forEach(a => a.places.forEach(p => places.push({ a, p, tri: r() })));
        if (o.of)
            //ocelles placés à la main, dessinés sur l'aile antérieure (au-dessus)
            o.of.forEach(t => ailes[0].taches.push(t));
        else
            places.sort((x, y) => x.tri - y.tri).slice(0, o.oc).forEach(x => x.a.taches.push(x.p));
        //l'aile postérieure est dessinée sous l'aile antérieure
        return ailes.reverse();
    }

    //-- SVG ------------------------------------------------------------------------
    function cheminFerme(pts) {
        const s = spline(pts, true, 4);
        return "M " + s.map(p => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" L ") + " Z";
    }
    function svg(m) {
        const o = lire(m), ailes = construire(o), RETRAIT = o.ep,
            vers = p => mul(p, TAILLE),
            elements = [];
        ailes.forEach(a => {
            elements.push({ d: "M " + a.contour.map(vers).map(p => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" L ") + " Z" });
            a.cellules.forEach(c => {
                const pts = retrait(c.map(vers), RETRAIT);
                if (pts.length >= 3 && aire(pts) > 60) elements.push({ d: cheminFerme(pts) });
            });
            a.taches.forEach(t => elements.push({ ellipse: vers(t.c), r: t.r * o.ot * TAILLE, base: t }));
        });
        //cadrage : tout en coordonnées positives, l'attache au corps sur le bord droit
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        ailes.forEach(a => a.contour.map(vers).forEach(p => {
            x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
        }));
        const w = (x1 - x0 + 4).toFixed(2), h = (y1 - y0 + 4).toFixed(2),
            tx = (2 - x0).toFixed(2), ty = (2 - y0).toFixed(2);
        const corps = elements.map((e, i) => e.d
            ? `<path style="${STYLE}" d="${e.d}" id="path${i + 1}"/>`
            //class/data-* : l'ocelle peut être déplacé ou supprimé dans la page (coordonnées d'origine)
            : `<ellipse style="${STYLE}" id="path${i + 1}" class="ocelle" data-x="${e.base.c.x.toFixed(4)}" data-y="${e.base.c.y.toFixed(4)}" data-r="${e.base.r.toFixed(4)}" cx="${e.ellipse.x.toFixed(2)}" cy="${e.ellipse.y.toFixed(2)}" rx="${e.r.toFixed(2)}" ry="${(e.r * 0.85).toFixed(2)}"/>`
        ).join("");
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" version="1.1">`
            + `<g id="layer1" transform="translate(${tx} ${ty})">${corps}</g></svg>`;
    }

    return {
        PREFIXE,
        REGLAGES,
        estGeneree: m => typeof m === "string" && m.startsWith(PREFIXE),
        graine: m => parseInt(String(m).replace(PREFIXE, ""), 10) >>> 0,
        nouvelle: () => PREFIXE + Math.floor(Math.random() * 1e9),
        svg,
        //aperçu utilisable comme src d'une image
        url: m => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg(m)),
        nom: m => "aile générée n° " + lire(m).graine + (String(m).includes("?") ? " (modifiée)" : ""),
        TAILLE,
        parametres: lire,
        modele
    };
})();
