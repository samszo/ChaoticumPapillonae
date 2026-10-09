//Méthode de génération « anatomique » : le papillon est construit avec le vocabulaire
//des schémas de Wikimédia Commons « Schéma d'un lépidoptère » (tête, œil, palpe, trompe,
//antenne, thorax, abdomen, pattes : fémur, tibia, tarse ; ailes antérieure et postérieure,
//queue) et « Ailes de lépidoptères » (base, côte, apex, marge, angle externe / tornus,
//bord interne, bord anal, angle anal, cellule, nervures numérotées 1 à 12 et 1a à 8,
//aires basale à apicale, ocelle, dessins marginaux, cils, indices sexuels).
//Chaque élément SVG porte le nom de l'élément du schéma (id / classe).
//Indépendante de chaoticumPapillonae (la méthode par modèles d'aile reste disponible).
class PapillonAnatomique {
    constructor(params) {
        const me = this;
        this.cont = params.cont;
        this.idSvg = params.idSvg || "papillonAnatomique";
        this.width = params.width || 400;
        this.height = params.height || 400;
        this.scaleColors = params.scaleColors || false;
        this.nomPalette = params.nomPalette || (this.scaleColors ? "" : "RVB");
        this.graine = params.graine !== undefined && params.graine !== null && params.graine !== "" && Number.isFinite(+params.graine)
            ? (+params.graine >>> 0) : Math.floor(Math.random() * 1e9);
        //corps (thorax + abdomen) et queue (de l'aile postérieure) : facteurs de taille
        this.prop = Object.assign({ corpsL: 1, corpsH: 1, queueL: 1, queueH: 1 }, params.proportions || {});
        this.onReady = params.onReady || false;
        //réglages imposés (outil de réglage en temps réel), qui remplacent les traits tirés de la graine
        this.reglages = Object.assign({}, params.reglages || {});
        //forme des dégradés (cf. chaoticumPapillonae.MODES_DEGRADE)
        this.modeDegrade = chaoticumPapillonae.MODES_DEGRADE.some(m => m[0] == params.modeDegrade) ? params.modeDegrade : "radial";
        this.modeleWing = "anatomique";     //pour l'affichage et le partage
        this.nom = "";

        const TAILLE = 600, CX = TAILLE / 2;
        let svg, defs, traits, couleurTrait;

        //-- outils géométriques ---------------------------------------------------
        const P = (x, y) => ({ x, y }),
            add = (a, b) => P(a.x + b.x, a.y + b.y),
            sub = (a, b) => P(a.x - b.x, a.y - b.y),
            mul = (a, k) => P(a.x * k, a.y * k),
            lerp = (a, b, t) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t),
            len = a => Math.hypot(a.x, a.y),
            unit = a => mul(a, 1 / (len(a) || 1)),
            f = n => (+n).toFixed(4);
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
        //point (et tangente) à la fraction t de la longueur d'une polyligne
        function surLigne(pl, t) {
            let L = 0;
            const c = [0];
            for (let i = 1; i < pl.length; i++) { L += len(sub(pl[i], pl[i - 1])); c.push(L); }
            const d = Math.max(0, Math.min(1, t)) * L;
            let i = 1;
            while (i < pl.length - 1 && c[i] < d) i++;
            const u = (d - c[i - 1]) / ((c[i] - c[i - 1]) || 1);
            return { p: lerp(pl[i - 1], pl[i], u), tan: unit(sub(pl[i], pl[i - 1])) };
        }
        const chemin = (pts, ferme) => "M" + pts.map(p => f(p.x) + "," + f(p.y)).join("L") + (ferme ? "Z" : "");
        //nervure : courbe légèrement arquée
        const courbe = (a, b, arc) => {
            const m = lerp(a, b, 0.5), n = P(-(b.y - a.y), b.x - a.x);
            return spline([a, add(m, mul(n, arc)), b], false, 10);
        };

        //-- couleurs ----------------------------------------------------------------
        const estCouleur = v => /^#[0-9a-fA-F]{6}$/.test(String(v));
        //remplissage d'une partie du corps : couleur pleine choisie, sinon dégradé de la palette
        const remplir = (choix, id, cx, cy, r) => estCouleur(choix) ? choix : degrade(id, cx, cy, r);
        function hasard(cle) {
            return d3.randomLcg(PapillonAnatomique.hash(me.graine + "|" + cle) / 4294967296);
        }
        const couleur = r => me.scaleColors ? me.scaleColors(r())
            : "#" + Math.floor(r() * 0x1000000).toString(16).padStart(6, "0");
        //dégradé radial dont les couleurs dépendent de la graine et de l'élément
        function degrade(id, cx, cy, rayon) {
            const r = hasard(id), n = 3 + Math.floor(r() * 4),
                offsets = Array.from({ length: n }, () => r()).sort();
            const g = chaoticumPapillonae.ajouterDegrade(defs, "grad-" + id, me.modeDegrade, cx, cy, rayon, me.graine);
            g.selectAll("stop").data(offsets).join("stop")
                .attr("offset", o => o).attr("stop-color", () => couleur(r));
            chaoticumPapillonae.finaliserDegrade(g);
            return "url(#grad-" + id + ")";
        }
        //trait des nervures et contours : la teinte la plus sombre de la palette, assombrie
        function teinteTrait() {
            if (!me.scaleColors) return "#2a2320";
            const c = [0, 1].map(t => d3.color(me.scaleColors(t))).filter(Boolean)
                .sort((a, b) => d3.hsl(a).l - d3.hsl(b).l)[0];
            return c ? c.darker(1.6).formatHex() : "#2a2320";
        }

        //-- traits du papillon tirés de la graine ---------------------------------------
        function tirerTraits() {
            const r = d3.randomLcg(me.graine), entre = (a, b) => a + (b - a) * r();
            return {
                apex: entre(0, 1),              //apex plus ou moins pointu
                festonsAnt: entre(0, 0.4),      //marge de l'aile antérieure
                festonsPost: entre(0, 1),       //marge de l'aile postérieure
                cellule: entre(0.44, 0.58),     //longueur de la cellule
                queue: r() < 0.45 ? entre(0.35, 1) : 0,  //queue de l'aile postérieure
                ocelle: r() < 0.7,
                dessinsMarginaux: r() < 0.75,
                indicesSexuels: r() < 0.4,
                nervure: entre(0.006, 0.012),   //épaisseur des nervures (unité d'aile)
                tete: entre(13, 17),
                thoraxL: entre(17, 23), thoraxH: entre(30, 38),
                abdomenL: entre(13, 18), abdomenH: entre(110, 150), anneaux: Math.round(entre(7, 9)),
                antenne: entre(120, 165), ecartAntenne: entre(0.5, 1),
                patte: entre(0.85, 1.15),
                //traits ajoutés ensuite : tirés à part, pour que les graines déjà partagées ne changent pas
                ...tirerTraitsSupplementaires()
            };
        }
        function tirerTraitsSupplementaires() {
            const r = hasard("traits-2"), entre = (a, b) => a + (b - a) * r(),
                x = r();
            return {
                //types d'antennes (schéma « Les différents types d'antennes »)
                antenneType: x < 0.45 ? "massue" : x < 0.65 ? "epaisse" : x < 0.85 ? "filiforme" : "plumeuse",
                articles: Math.round(entre(16, 28)),    //nombre d'articles de l'antenne
                yeux: 1,                                 //taille relative des yeux
                ecartYeux: 0.62,                         //écart des yeux (relatif au rayon de la tête)
                tailleAiles: 1,                          //taille relative des ailes
                courbure: 0.5,                           //arrondi de la forme des ailes
                ecailles: true,                          //ailes couvertes d'écailles colorées
                tailleEcailles: 0.032,                   //longueur d'une écaille (unité d'aile)
                pattes: false,                           //pattes masquées par défaut
                //marge : bande le long du bord externe des ailes
                marge: true, largeurMarge: 0.05, ondulationMarge: 0.3, couleurMarge: "degrade", opaciteMarge: 1,
                //couleur de la tête, du thorax (corps) et de l'abdomen (queue) : dégradé ou couleur pleine
                couleurTete: "degrade", couleurThorax: "degrade", couleurAbdomen: "degrade"
            };
        }
        //traits du papillon : tirés de la graine, puis remplacés par les réglages imposés
        function traitsRegles() {
            const t = tirerTraits();
            PapillonAnatomique.REGLAGES.forEach(r => {
                if (me.reglages[r.cle] === undefined) return;
                let v = me.reglages[r.cle];
                if (r.type == "booleen") v = v === true || v === 1 || v === "1";
                else if (r.type == "choix") v = r.options.some(o => o[0] == v) ? v : t[r.cle];
                else if (r.type == "couleur") v = estCouleur(v) ? v : "degrade";
                else v = Math.min(r.max, Math.max(r.min, +v));
                t[r.cle] = v;
            });
            return t;
        }

        //-- ailes ---------------------------------------------------------------------
        //aile antérieure (base en 0,0 ; l'aile s'étend vers la gauche)
        function aileAnterieure(t) {
            const B = P(0, 0), c = t.courbure, ap = t.apex,
                //contour : une seule courbe fermée (pas d'angle vif à l'apex ni à l'angle externe) ;
                //la courbure bombe la côte, la marge et le bord interne, et émousse l'apex
                A = P(-0.98 - 0.1 * ap + 0.04 * c, -0.62 - 0.08 * ap + 0.03 * c),   //apex
                T = P(-0.66, 0.07),                                                 //angle externe (tornus)
                { cote, marge: margeBase, bord: bordInterne } = decouper([
                    B, P(-0.22 - 0.03 * c, -0.24 - 0.06 * c), P(-0.58 - 0.05 * c, -0.52 - 0.09 * c),
                    A, P(-0.97 + 0.06 * ap - 0.08 * c, -0.36), P(-0.86 - 0.06 * c, -0.1 + 0.02 * c),
                    T, P(-0.38, 0.1 + 0.05 * c), P(-0.1, 0.05)], 3, 6),
                lc = t.cellule,
                cel = [P(-0.05, -0.06), P(-lc, -0.72 * lc - 0.02), P(-lc - 0.04, -0.46 * lc), P(-0.06, -0.01)];
            //nervures : départ (cellule ou base) -> arrivée (côte, marge ou bord interne)
            const surC = (a, b, u) => lerp(cel[a], cel[b], u),
                arrivees = { 7: 0.03, 6: 0.18, 5: 0.34, 4: 0.51, 3: 0.68, 2: 0.85 },
                fin = n => surLigne(margeBase, arrivees[n]).p,
                nerv = [
                    { n: 12, a: P(-0.02, -0.035), b: surLigne(cote, 0.55).p, arc: 0.03 },
                    { n: 11, a: surC(0, 1, 0.75), b: surLigne(cote, 0.73).p, arc: 0.03 },
                    { n: 10, a: surC(0, 1, 0.95), b: surLigne(cote, 0.87).p, arc: 0.03 },
                    { n: 7, a: cel[1], b: fin(7), arc: 0.02 },
                    { n: 6, a: surC(1, 2, 0.3), b: fin(6), arc: 0.02 },
                    { n: 5, a: surC(1, 2, 0.7), b: fin(5), arc: 0.01 },
                    { n: 4, a: cel[2], b: fin(4), arc: 0 },
                    { n: 3, a: surC(2, 3, 0.15), b: fin(3), arc: -0.03 },
                    { n: 2, a: surC(2, 3, 0.45), b: fin(2), arc: -0.05 },
                    { n: 1, a: P(-0.03, 0.02), b: surLigne(bordInterne, 0.1).p, arc: -0.04 }
                ];
            //marge légèrement festonnée entre les nervures
            const marge = festonner(margeBase, [0, ...lelong(arrivees), 1], t.festonsAnt * 0.025, B, null);
            return { cote, marge, bord: bordInterne, cellule: cel, nervures: nerv, base: B, apex: A, angle: T, arrivees, margeBase };
        }
        //aile postérieure (base en 0,0)
        function ailePosterieure(t) {
            const B = P(0, 0), c = t.courbure,
                //apex et côte remontés : le haut de l'aile postérieure passe sous l'aile antérieure
                //(pas de trou entre les deux ailes au bord externe)
                A = P(-0.8, 0.0),                                         //apex
                AA = P(-0.3, 0.8),                                        //angle anal
                { cote, marge: margeBase, bord: bordAnal } = decouper([
                    B, P(-0.4, -0.08 - 0.05 * c), A, P(-0.86 - 0.07 * c, 0.28), P(-0.72 - 0.07 * c, 0.55 + 0.03 * c),
                    P(-0.5 - 0.04 * c, 0.75 + 0.05 * c), AA, P(-0.12, 0.58 + 0.02 * c), P(-0.03, 0.24)], 2, 6),
                cel = [P(-0.05, 0.03), P(-0.4, 0.1), P(-0.42, 0.27), P(-0.07, 0.14)];
            const surC = (a, b, u) => lerp(cel[a], cel[b], u),
                arrivees = { 7: 0.03, 6: 0.18, 5: 0.35, 4: 0.52, 3: 0.68, 2: 0.83, 1: 0.97 },
                fin = n => surLigne(margeBase, arrivees[n]).p,
                nerv = [
                    { n: 8, a: P(-0.02, -0.01), b: surLigne(cote, 0.78).p, arc: 0.02 },
                    { n: 7, a: cel[1], b: fin(7), arc: 0.02 },
                    { n: 6, a: surC(1, 2, 0.35), b: fin(6), arc: 0.01 },
                    { n: 5, a: surC(1, 2, 0.7), b: fin(5), arc: 0 },
                    { n: 4, a: cel[2], b: fin(4), arc: -0.01 },
                    { n: 3, a: surC(2, 3, 0.2), b: fin(3), arc: -0.03 },
                    { n: 2, a: surC(2, 3, 0.5), b: fin(2), arc: -0.04 },
                    { n: 1, a: P(-0.03, 0.05), b: fin(1), arc: -0.05 },
                    { n: "1a", a: P(-0.01, 0.06), b: surLigne(bordAnal, 0.12).p, arc: -0.03 }
                ];
            const queue = t.queue * me.prop.queueH,
                marge = festonner(margeBase, [0, ...lelong(arrivees), 1], t.festonsPost * 0.04, B,
                    queue > 0 ? { t: arrivees[4], long: 0.45 * queue, larg: 0.035 * me.prop.queueL } : null);
            return { cote, marge, bord: bordAnal, cellule: cel, nervures: nerv, base: B, apex: A, angle: AA, arrivees, margeBase };
        }
        //positions des arrivées de nervures, dans l'ordre le long de la marge (de l'apex à l'angle) ;
        //Object.values seul les rendrait dans l'ordre des numéros de nervure (2, 3… 7), à l'envers
        const lelong = arrivees => Object.values(arrivees).sort((x, y) => x - y);
        //contour fermé lisse découpé en trois bords : de la base à l'apex (côte),
        //de l'apex à l'angle externe ou anal (marge), puis retour à la base (bord interne ou anal)
        function decouper(ctrl, iApex, iAngle) {
            const pas = 16, c = spline(ctrl, true, pas);
            return {
                cote: c.slice(0, iApex * pas + 1),
                marge: c.slice(iApex * pas, iAngle * pas + 1),
                bord: [...c.slice(iAngle * pas), c[0]]
            };
        }
        //marge : passe par l'extrémité des nervures et se creuse entre elles (festons) ;
        //la queue prolonge la marge au bout d'une nervure
        function festonner(base, fractions, creux, B, queue) {
            const pts = [];
            for (let i = 0; i < fractions.length; i++) {
                const t = fractions[i];
                if (queue && Math.abs(t - queue.t) < 1e-6) {
                    const q = surLigne(base, t), dir = unit(sub(q.p, B));
                    pts.push(add(q.p, mul(q.tan, -queue.larg)));
                    pts.push(add(add(q.p, mul(dir, queue.long)), mul(q.tan, -queue.larg * 0.3)));
                    pts.push(add(add(q.p, mul(dir, queue.long)), mul(q.tan, queue.larg * 0.3)));
                    pts.push(add(q.p, mul(q.tan, queue.larg)));
                } else pts.push(surLigne(base, t).p);
                if (i < fractions.length - 1 && creux > 0) {
                    const u = (t + fractions[i + 1]) / 2, m = surLigne(base, u),
                        //festons atténués près des extrémités de la marge (apex, angle externe ou anal) :
                        //c'est là que les ailes antérieure et postérieure se touchent, il ne faut pas y creuser
                        attenuation = Math.min(1, u / 0.25, (1 - u) / 0.25);
                    pts.push(add(m.p, mul(unit(sub(B, m.p)), creux * attenuation)));
                }
            }
            return spline(pts, false, 6);
        }

        //-- dessin d'une aile -------------------------------------------------------
        function dessinerAile(g, nomAile, a, t, posterieure) {
            //contour arrondi aux angles (apex, angle externe ou anal) selon la courbure
            //(toujours un peu adouci, davantage avec la courbure)
            const contour = arrondir([...a.cote, ...a.marge.slice(1), ...a.bord.slice(1)], 0.2 + 0.8 * t.courbure),
                idClip = me.idSvg + "-clip-" + nomAile,
                R = Math.max(...contour.map(p => len(p))),
                trait = t.nervure;
            defs.append("clipPath").attr("id", idClip).append("path").attr("d", chemin(contour, true));
            //fond de l'aile
            g.append("path").attr("id", nomAile).attr("class", "aile " + nomAile)
                .attr("d", chemin(contour, true)).attr("fill", degrade(nomAile, 0, 0, R));
            if (t.ecailles) {
                dessinerEcailles(g.append("g").attr("clip-path", "url(#" + idClip + ")"), nomAile, a, contour, R, t, posterieure);
                //cellule : ses bords seulement (les écailles la colorent)
                g.append("path").attr("id", nomAile + "-cellule").attr("class", "cellule")
                    .attr("d", chemin(spline(a.cellule, true, 4), true)).attr("fill", "none")
                    .attr("stroke", couleurTrait).attr("stroke-width", trait);
            } else {
                //aires : bandes concentriques autour de la base, découpées à la forme de l'aile
                const aires = g.append("g").attr("class", "aires").attr("clip-path", "url(#" + idClip + ")"),
                    bandes = [["aire-basale", 0, 0.2], ["aire-post-basale", 0.2, 0.34], ["aire-mediane", 0.34, 0.54],
                        ["aire-post-mediane", 0.54, 0.74]];
                bandes.forEach(([nom, r0, r1]) => {
                    const id = nomAile + "-" + nom;
                    aires.append("path").attr("id", id).attr("class", "aire " + nom).attr("fill-rule", "evenodd")
                        .attr("d", anneau(R * r1, R * r0)).attr("fill", degrade(id, 0, 0, R * r1)).attr("opacity", 0.85);
                });
                if (!posterieure) {
                    //aires apicale et sub-apicale : autour de l'apex de l'aile antérieure
                    [["aire-sub-apicale", 0.34], ["aire-apicale", 0.18]].forEach(([nom, k]) => {
                        const id = nomAile + "-" + nom;
                        aires.append("circle").attr("id", id).attr("class", "aire " + nom)
                            .attr("cx", f(a.apex.x)).attr("cy", f(a.apex.y)).attr("r", f(R * k))
                            .attr("fill", degrade(id, a.apex.x, a.apex.y, R * k)).attr("opacity", 0.85);
                    });
                }
                //cellule
                g.append("path").attr("id", nomAile + "-cellule").attr("class", "cellule")
                    .attr("d", chemin(spline(a.cellule, true, 4), true))
                    .attr("fill", degrade(nomAile + "-cellule", a.cellule[1].x, a.cellule[1].y, 0.5))
                    .attr("stroke", couleurTrait).attr("stroke-width", trait);
            }
            //marge : bande collée au bord externe réel de l'aile (de l'apex à l'angle externe ou anal)
            const bordExterne = portionMarge(contour, a);
            if (t.marge) dessinerMarge(g.append("g").attr("clip-path", "url(#" + idClip + ")"), nomAile, bordExterne, contour, a, t, R);
            //indices sexuels : traits en écailles près du bord interne (aile antérieure)
            if (!posterieure && t.indicesSexuels) {
                const ind = g.append("g").attr("class", "indices-sexuels");
                [0, 1, 2].forEach(i => {
                    const a0 = P(-0.22 - i * 0.05, 0.0 + i * 0.012), b0 = P(-0.38 - i * 0.05, -0.035 + i * 0.012);
                    ind.append("path").attr("d", chemin([a0, b0, add(b0, P(0.012, 0.014)), add(a0, P(0.012, 0.014))], true))
                        .attr("fill", couleurTrait).attr("opacity", 0.45);
                });
            }
            //dessins marginaux : lunules entre les nervures, le long de la marge
            if (t.dessinsMarginaux) {
                const dm = g.append("g").attr("class", "dessins-marginaux"),
                    fr = [0, ...lelong(a.arrivees), 1];
                for (let i = 1; i < fr.length - 1; i++) {
                    const m = surLigne(a.margeBase, (fr[i] + fr[i + 1]) / 2),
                        n = unit(sub(a.base, m.p)), c = add(m.p, mul(n, 0.06)),
                        e = 0.022 + 0.012 * (posterieure ? 1 : 0),
                        p1 = add(c, mul(m.tan, -e)), p2 = add(c, mul(m.tan, e));
                    dm.append("path").attr("id", nomAile + "-lunule-" + i).attr("class", "dessin-marginal")
                        .attr("d", "M" + f(p1.x) + "," + f(p1.y)
                            + "Q" + f(c.x + n.x * 0.05) + "," + f(c.y + n.y * 0.05) + " " + f(p2.x) + "," + f(p2.y)
                            + "Q" + f(c.x + n.x * 0.018) + "," + f(c.y + n.y * 0.018) + " " + f(p1.x) + "," + f(p1.y) + "Z")
                        .attr("fill", degrade(nomAile + "-lunule-" + i, c.x, c.y, e * 2));
                }
            }
            //ocelle : près de l'angle anal, entre les nervures 1 et 2 (aile postérieure)
            if (posterieure && t.ocelle) {
                const m = surLigne(a.margeBase, (a.arrivees[1] + a.arrivees[2]) / 2),
                    c = add(m.p, mul(unit(sub(a.base, m.p)), 0.11)),
                    oc = g.append("g").attr("class", "ocelle").attr("id", nomAile + "-ocelle");
                oc.append("circle").attr("cx", f(c.x)).attr("cy", f(c.y)).attr("r", 0.05).attr("fill", couleurTrait);
                oc.append("circle").attr("cx", f(c.x)).attr("cy", f(c.y)).attr("r", 0.036)
                    .attr("fill", degrade(nomAile + "-ocelle", c.x, c.y, 0.036));
                oc.append("circle").attr("class", "pupille").attr("cx", f(c.x + 0.008)).attr("cy", f(c.y - 0.008))
                    .attr("r", 0.011).attr("fill", "#fff");
            }
            //nervures numérotées
            const nv = g.append("g").attr("class", "nervures");
            a.nervures.forEach(n => nv.append("path").attr("id", nomAile + "-nervure-" + n.n)
                .attr("class", "nervure nervure-" + n.n).attr("d", chemin(courbe(n.a, n.b, n.arc)))
                .attr("fill", "none").attr("stroke", couleurTrait).attr("stroke-width", trait).attr("stroke-linecap", "round"));
            //contour : côte, marge, bord interne (ou anal)
            g.append("path").attr("class", "contour").attr("d", chemin(contour, true))
                .attr("fill", "none").attr("stroke", couleurTrait).attr("stroke-width", trait * 1.3);
            //cils : frange de petits traits le long de la marge
            let cils = "";
            const nc = 90;
            for (let i = 0; i <= nc; i++) {
                const m = surLigne(bordExterne, i / nc), n = unit(sub(m.p, a.base));
                cils += "M" + f(m.p.x) + "," + f(m.p.y) + "l" + f(n.x * 0.014) + "," + f(n.y * 0.014);
            }
            g.append("path").attr("class", "cils").attr("d", cils).attr("fill", "none")
                .attr("stroke", couleurTrait).attr("stroke-width", trait * 0.5).attr("opacity", 0.7);
        }
        //arrondit un contour fermé : rééchantillonnage grossier puis coupe des coins (Chaikin)
        function arrondir(pts, c) {
            if (c <= 0) return pts;
            const pas = 0.015 + 0.05 * c;
            let L = 0;
            for (let i = 1; i < pts.length; i++) L += len(sub(pts[i], pts[i - 1]));
            let q = [];
            for (let k = 0, n = Math.max(12, Math.round(L / pas)); k < n; k++) q.push(surLigne(pts, k / n).p);
            for (let it = 0; it < 3; it++) {
                const r = [];
                q.forEach((p, i) => {
                    const s2 = q[(i + 1) % q.length];
                    r.push(lerp(p, s2, 0.25), lerp(p, s2, 0.75));
                });
                q = r;
            }
            return q;
        }
        //point dans un polygone (lancer de rayon)
        function dedans(p, poly) {
            let x = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const a = poly[i], b = poly[j];
                if ((a.y > p.y) != (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) x = !x;
            }
            return x;
        }
        //écailles : rangées décalées autour de la base, pointe vers la marge, chacune d'une couleur
        //tirée de la palette selon sa zone (aire, cellule, marge) avec une petite variation propre ;
        //les écailles d'une même rangée et d'une même couleur forment un seul tracé
        function dessinerEcailles(g, nomAile, a, contour, R, t, posterieure) {
            const l = t.tailleEcailles, w = l * 0.72,
                r = hasard(nomAile + "-ecailles"),
                valeurs = {},
                valeurZone = z => valeurs[z] !== undefined ? valeurs[z] : (valeurs[z] = hasard(nomAile + "-zone-" + z)()),
                cellule = spline(a.cellule, true, 4),
                marge = a.marge,
                zone = p => {
                    if (dedans(p, cellule)) return "cellule";
                    if (Math.min(...marge.map(m => len(sub(m, p)))) < 0.05) return "marge";
                    if (!posterieure) {
                        const da = len(sub(p, a.apex)) / R;
                        if (da < 0.18) return "aire-apicale";
                        if (da < 0.34) return "aire-sub-apicale";
                    }
                    const rho = len(p) / R;
                    return rho < 0.2 ? "aire-basale" : rho < 0.34 ? "aire-post-basale" : rho < 0.54 ? "aire-mediane"
                        : rho < 0.74 ? "aire-post-mediane" : "aire-externe";
                },
                //répartition des couleurs selon le mode de dégradé : par zones (radial), en bandes droites
                //(linéaire), en rayures ou en anneaux autour de la base ; la zone garde la moitié du poids
                mode = chaoticumPapillonae.modeElement(me.modeDegrade, me.graine, nomAile + "-ecailles"),
                angle = (PapillonAnatomique.hash(me.graine + "|angle|" + nomAile) % 360) * Math.PI / 180,
                dir = P(Math.cos(angle), Math.sin(angle)),
                champ = (p, vz) => {
                    if (mode == "radial") return vz;
                    const proj = (p.x * dir.x + p.y * dir.y) / R,
                        x = mode == "lineaire" ? 0.5 + proj / 2
                            : mode == "rayures" ? 0.5 + 0.5 * Math.sin(proj * Math.PI * 7)
                            : 0.5 + 0.5 * Math.cos(len(p) / R * Math.PI * 8);
                    return 0.5 * vz + 0.5 * x;
                },
                angles = contour.map(p => Math.atan2(p.y, p.x)),
                aMin = Math.min(...angles), aMax = Math.max(...angles),
                groupes = new Map(),
                NIVEAUX = 48;
            for (let k = 1, rho = l * 0.6; rho < R + l; k++, rho += l * 0.62) {
                const pasA = w * 0.92 / rho, decal = (k % 2) * pasA / 2;
                for (let ang = aMin + decal; ang <= aMax; ang += pasA) {
                    const d = P(Math.cos(ang), Math.sin(ang)), c = mul(d, rho);
                    if (!dedans(c, contour)) continue;
                    const v = Math.max(0, Math.min(1, champ(c, valeurZone(zone(c))) + (r() - 0.5) * 0.14)),
                        q = Math.round(v * NIVEAUX),
                        n = P(-d.y, d.x),
                        base = add(c, mul(d, -l / 2)), bout = add(c, mul(d, l / 2)),
                        epaule = add(c, mul(d, l * 0.12)),
                        e = "M" + f(base.x + n.x * w * 0.28) + "," + f(base.y + n.y * w * 0.28)
                            + "L" + f(epaule.x + n.x * w / 2) + "," + f(epaule.y + n.y * w / 2)
                            + "Q" + f(bout.x + n.x * w / 2) + "," + f(bout.y + n.y * w / 2) + " " + f(bout.x) + "," + f(bout.y)
                            + "Q" + f(bout.x - n.x * w / 2) + "," + f(bout.y - n.y * w / 2) + " "
                            + f(epaule.x - n.x * w / 2) + "," + f(epaule.y - n.y * w / 2)
                            + "L" + f(base.x - n.x * w * 0.28) + "," + f(base.y - n.y * w * 0.28) + "Z",
                        cle = k + "|" + q;
                    groupes.set(cle, (groupes.get(cle) || "") + e);
                }
            }
            const couleurEcaille = q => me.scaleColors ? me.scaleColors(q / NIVEAUX) : d3.interpolateSinebow(q / NIVEAUX),
                ec = g.append("g").attr("class", "ecailles");
            //des rangées externes vers la base : le bout arrondi d'une écaille recouvre la base de la suivante
            [...groupes.entries()].sort((x, y) => (+y[0].split("|")[0]) - (+x[0].split("|")[0])).forEach(([cle, d]) => {
                const c = d3.color(couleurEcaille(+cle.split("|")[1]));
                ec.append("path").attr("class", "ecaille").attr("d", d).attr("fill", c.formatHex())
                    .attr("stroke", c.darker(0.7).formatHex()).attr("stroke-width", f(l * 0.04));
            });
        }
        //partie du contour (arrondi) qui forme la marge : du point le plus proche de l'apex
        //au point le plus proche de l'angle externe (ou anal)
        function portionMarge(contour, a) {
            const proche = q => contour.reduce((m, p, i) => len(sub(p, q)) < len(sub(contour[m], q)) ? i : m, 0);
            let i0 = proche(a.apex), i1 = proche(a.angle);
            if (i1 < i0) [i0, i1] = [i1, i0];
            return contour.slice(i0, i1 + 1);
        }
        //bande de marge : son bord externe EST le contour de l'aile (aucun espace), son bord interne
        //est décalé vers l'intérieur de la largeur choisie, ondulé entre les nervures si demandé
        function dessinerMarge(g, nomAile, bord, contour, a, t, R) {
            if (bord.length < 3) return;
            //sens de parcours du contour (aire signée) : donne le côté intérieur de chaque bord
            let aireSignee = 0;
            contour.forEach((p, i) => {
                const q = contour[(i + 1) % contour.length];
                aireSignee += p.x * q.y - q.x * p.y;
            });
            const signe = aireSignee > 0 ? 1 : -1,
                n = bord.length, ondes = Object.keys(a.arrivees).length + 1,
                interieur = bord.map((p, i) => {
                    const tg = unit(sub(bord[Math.min(n - 1, i + 1)], bord[Math.max(0, i - 1)])),
                        //normale tournée vers l'intérieur de l'aile
                        nrm = P(-tg.y * signe, tg.x * signe);
                    const u = i / (n - 1),
                        //la bande s'amincit aux extrémités et ondule entre les nervures
                        w = t.largeurMarge * Math.min(1, u * 8, (1 - u) * 8)
                            * (1 - t.ondulationMarge * 0.6 * (0.5 + 0.5 * Math.cos(u * ondes * 2 * Math.PI)));
                    return add(p, mul(nrm, w));
                }),
                lisse = spline(interieur.filter((p, i) => i % 3 == 0 || i == n - 1), false, 3),
                fond = estCouleur(t.couleurMarge) ? t.couleurMarge
                    : degrade(nomAile + "-marge", a.apex.x, a.apex.y, R);
            g.append("path").attr("id", nomAile + "-marge").attr("class", "marge")
                .attr("d", chemin([...bord, ...lisse.reverse()], true))
                .attr("fill", fond).attr("opacity", t.opaciteMarge);
        }
        //couronne entre deux cercles centrés sur la base
        const anneau = (r1, r0) => {
            const c = r => `M${f(-r)},0a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0Z`;
            return c(r1) + (r0 > 0 ? c(r0) : "");
        };

        //-- corps -------------------------------------------------------------------------
        function dessinerPattes(g, t, thorax) {
            //trois paires : antérieure, médiane, postérieure ; chacune fémur, tibia, tarse
            [["anterieure", -0.55, -0.9], ["mediane", 0, -0.15], ["posterieure", 0.5, 0.55]].forEach(([nom, dy, sens]) => {
                const k = t.patte,
                    attache = P(CX - thorax.rx * 0.55, thorax.cy + dy * thorax.ry),
                    genou = add(attache, P(-28 * k, sens * 14 * k)),
                    cheville = add(genou, P(-16 * k, (sens + 1.1) * 22 * k)),
                    bout = add(cheville, P(-8 * k, (sens + 1) * 12 * k + 6));
                const patte = g.append("g").attr("class", "patte patte-" + nom);
                [["femur", attache, genou, 3.2], ["tibia", genou, cheville, 2.4], ["tarse", cheville, bout, 1.6]]
                    .forEach(([seg, a, b, ep]) => patte.append("path").attr("class", seg)
                        .attr("d", chemin([a, b])).attr("stroke", couleurTrait).attr("stroke-width", ep)
                        .attr("stroke-linecap", "round").attr("fill", "none"));
                //articles du tarse
                [0.33, 0.66].forEach(u => {
                    const p = lerp(cheville, bout, u);
                    patte.append("circle").attr("class", "article-tarse").attr("cx", f(p.x)).attr("cy", f(p.y))
                        .attr("r", 1.4).attr("fill", couleurTrait);
                });
            });
        }
        //antenne articulée, selon le schéma « Les différents types d'antennes » :
        //en massue (articles qui s'élargissent jusqu'au bout arrondi), épaisse (gros articles,
        //pointe recourbée), filiforme (articles fins, soies aux articulations), plumeuse (axe et barbes)
        function dessinerAntenne(g, t, tete) {
            const base = P(CX - 5, tete.cy - tete.r * 0.6),
                hautAnt = Math.min(t.antenne, tete.cy - 14),        //l'antenne reste dans le cadre
                bout = P(CX - 20 - 55 * t.ecartAntenne, tete.cy - hautAnt),
                ctrl = P(CX - 8, tete.cy - hautAnt * 0.6),
                axe = spline([base, ctrl, bout], false, 40),
                n = Math.round(t.articles), type = t.antenneType,
                remplissage = degrade("antenne", bout.x, bout.y, hautAnt),
                ant = g.append("g").attr("class", "antenne antenne-" + type);
            //largeur d'un article selon sa position (0 = base, 1 = bout)
            const largeur = u => type == "massue" ? 1.2 + 4.2 * Math.pow(Math.max(0, (u - 0.55) / 0.45), 1.6)
                : type == "epaisse" ? 2 + 2.6 * Math.sin(Math.PI * Math.min(1, u * 1.15))
                : type == "filiforme" ? 1.1 : 0.8;
            for (let i = 0; i < n; i++) {
                const u0 = i / n, u1 = (i + 0.85) / n,
                    a = surLigne(axe, u0), b = surLigne(axe, u1),
                    //pointe recourbée de l'antenne épaisse
                    crochet = type == "epaisse" && i >= n - 2,
                    w0 = crochet ? largeur(u0) * 0.6 : largeur(u0), w1 = crochet ? 0.6 : largeur(u1),
                    na = P(-a.tan.y, a.tan.x), nb = P(-b.tan.y, b.tan.x),
                    pb = crochet ? add(b.p, mul(nb, -3)) : b.p,
                    article = [add(a.p, mul(na, w0)), add(pb, mul(nb, w1)), add(pb, mul(nb, -w1)), add(a.p, mul(na, -w0))];
                ant.append("path").attr("class", "article").attr("d", chemin(article, true))
                    .attr("fill", remplissage).attr("stroke", couleurTrait).attr("stroke-width", 0.6);
                if (type == "filiforme" && i % 2 == 0) {
                    //soies aux articulations
                    [-1, 1].forEach(sg => {
                        const q = add(b.p, mul(nb, sg * 1.1));
                        ant.append("path").attr("class", "soie")
                            .attr("d", chemin([q, add(q, add(mul(nb, sg * 3.5), mul(b.tan, 1.5)))]))
                            .attr("stroke", couleurTrait).attr("stroke-width", 0.5);
                    });
                }
                if (type == "plumeuse") {
                    //barbes : plus longues au milieu (forme de feuille), inclinées vers le bout
                    const lb = 3 + 13 * Math.sin(Math.PI * Math.min(1, u0 * 1.05));
                    [-1, 1].forEach(sg => ant.append("path").attr("class", "barbe")
                        .attr("d", chemin([a.p, add(a.p, add(mul(na, sg * lb), mul(a.tan, lb * 0.7)))]))
                        .attr("stroke", remplissage).attr("stroke-width", 1.1).attr("stroke-linecap", "round"));
                }
            }
            //bout arrondi de la massue
            if (type == "massue") {
                const fin = surLigne(axe, 1);
                ant.append("ellipse").attr("class", "massue").attr("cx", f(fin.p.x)).attr("cy", f(fin.p.y))
                    .attr("rx", f(largeur(1))).attr("ry", f(largeur(1) * 0.7))
                    .attr("transform", `rotate(${f(Math.atan2(fin.tan.y, fin.tan.x) * 180 / Math.PI + 90)} ${f(fin.p.x)} ${f(fin.p.y)})`)
                    .attr("fill", remplissage).attr("stroke", couleurTrait).attr("stroke-width", 0.6);
            }
        }
        function dessinerTete(g, t, tete) {
            //parties paires (antenne à massue, palpe, œil) : côté gauche puis son miroir
            const paire = (classe, dessin) => {
                const gg = g.append("g").attr("class", classe);
                dessin(gg);
                miroir(gg);
            };
            //trompe : spirale enroulée devant la tête
            let s = "";
            for (let i = 0; i <= 40; i++) {
                const a = i / 40 * Math.PI * 4, r = 1 + i * 0.16;
                s += (i ? "L" : "M") + f(CX + r * Math.cos(a)) + "," + f(tete.cy - tete.r - 9 + r * Math.sin(a));
            }
            g.append("path").attr("class", "trompe").attr("d", s).attr("fill", "none")
                .attr("stroke", couleurTrait).attr("stroke-width", 1.2);
            paire("antennes", gg => dessinerAntenne(gg, t, tete));
            paire("palpes", gg => gg.append("ellipse").attr("class", "palpe")
                .attr("cx", CX - 4).attr("cy", f(tete.cy - tete.r * 0.95)).attr("rx", 2.5).attr("ry", 7)
                .attr("transform", `rotate(-15 ${CX - 4} ${f(tete.cy - tete.r * 0.95)})`)
                .attr("fill", degrade("palpe", CX, tete.cy - tete.r, 8)));
            g.append("circle").attr("id", "tete").attr("class", "tete").attr("cx", CX).attr("cy", f(tete.cy))
                .attr("r", f(tete.r)).attr("fill", remplir(t.couleurTete, "tete", CX, tete.cy, tete.r));
            paire("yeux", gg => {
                const c = P(CX - tete.r * t.ecartYeux, tete.cy - tete.r * 0.2), r = tete.r * 0.42 * t.yeux;
                gg.append("circle").attr("class", "oeil").attr("cx", f(c.x)).attr("cy", f(c.y))
                    .attr("r", f(r)).attr("fill", couleurTrait);
                //reflet
                gg.append("circle").attr("class", "reflet").attr("cx", f(c.x - r * 0.3)).attr("cy", f(c.y - r * 0.35))
                    .attr("r", f(r * 0.25)).attr("fill", "#fff").attr("opacity", 0.7);
            });
        }

        //côté droit : copie en miroir des éléments du côté gauche (pas de <use>, que l'export PNG ignore)
        function miroir(sel) {
            const copie = sel.node().cloneNode(true);
            copie.removeAttribute("id");
            copie.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
            //les éléments copiés sont ceux du côté droit
            [copie, ...copie.querySelectorAll("[class]")].forEach(e =>
                e.setAttribute("class", (e.getAttribute("class") || "").replace(/-gauche\b/g, "-droite")));
            const g = d3.select(sel.node().parentNode).insert("g", () => sel.node().nextSibling)
                .attr("class", "miroir").attr("transform", `matrix(-1 0 0 1 ${2 * CX} 0)`);
            g.node().appendChild(copie);
            return g;
        }

        //-- construction -----------------------------------------------------------------
        this.init = function () {
            me.cont.select("#" + me.idSvg).remove();
            svg = me.cont.append("svg").attr("id", me.idSvg).attr("xmlns", "http://www.w3.org/2000/svg")
                .attr("width", me.width).attr("height", me.height)
                .attr("viewBox", `0 0 ${TAILLE} ${TAILLE}`).attr("preserveAspectRatio", "xMidYMid meet");
            defs = svg.append("defs");
            traits = traitsRegles();
            me.traits = traits;
            couleurTrait = teinteTrait();
            const t = traits,
                tete = { cy: 150, r: t.tete },
                thorax = { cy: 150 + t.tete + t.thoraxH * 0.85 * me.prop.corpsH, rx: t.thoraxL * me.prop.corpsL, ry: t.thoraxH * me.prop.corpsH },
                abdomen = { haut: thorax.cy + thorax.ry * 0.8, l: t.abdomenL * me.prop.corpsL, h: Math.min(t.abdomenH * me.prop.corpsH, TAILLE - 20 - thorax.cy - thorax.ry * 0.8) };
            //échelle des ailes : l'aile antérieure tient dans le cadre
            const baseAnt = P(CX - thorax.rx * 0.55, thorax.cy - thorax.ry * 0.35),
                baseAP = P(CX - thorax.rx * 0.5, thorax.cy + thorax.ry * 0.25),
                ant = aileAnterieure(t), post = ailePosterieure(t),
                largAnt = Math.max(...[...ant.cote, ...ant.marge].map(p => -p.x)),
                hautAnt = Math.max(...[...ant.cote, ...ant.marge].map(p => -p.y)),
                basPost = Math.max(...post.marge.map(p => p.y)),
                S = t.tailleAiles * Math.min((baseAnt.x - 8) / largAnt, (baseAnt.y - 8) / hautAnt, (TAILLE - 8 - baseAP.y) / (basPost * 0.85), 300),
                papillon = svg.append("g").attr("class", "papillon");
            //ailes gauches puis leur miroir ; l'aile postérieure passe sous l'aile antérieure
            const cote = nom => {
                const g = papillon.append("g").attr("class", "cote-" + nom);
                dessinerAile(g.append("g").attr("class", "aile-posterieure-g")
                    .attr("transform", `translate(${f(baseAP.x)} ${f(baseAP.y)}) scale(${f(S * 0.85)})`),
                    "aile-posterieure-" + nom, post, t, true);
                dessinerAile(g.append("g").attr("class", "aile-anterieure-g")
                    .attr("transform", `translate(${f(baseAnt.x)} ${f(baseAnt.y)}) scale(${f(S)})`),
                    "aile-anterieure-" + nom, ant, t, false);
                return g;
            };
            //les deux côtés partagent les mêmes dégradés (mêmes id d'éléments à droite et à gauche)
            miroir(cote("gauche")).classed("cote-droite", true);
            //corps : pattes, abdomen (anneaux), thorax, tête
            const corps = papillon.append("g").attr("class", "corps");
            const pattes = corps.append("g").attr("class", "pattes");
            if (t.pattes) {
                const pattesGauche = pattes.append("g").attr("class", "pattes-gauche");
                dessinerPattes(pattesGauche, t, thorax);
                miroir(pattesGauche);
            }
            const abd = corps.append("g").attr("class", "abdomen");
            for (let i = 0; i < t.anneaux; i++) {
                const u = i / t.anneaux, h = abdomen.h / t.anneaux,
                    larg = abdomen.l * (1 - 0.55 * u * u);
                abd.append("ellipse").attr("class", "anneau").attr("cx", CX).attr("cy", f(abdomen.haut + h * (i + 0.6)))
                    .attr("rx", f(larg)).attr("ry", f(h * 0.75))
                    .attr("fill", remplir(t.couleurAbdomen, "anneau-" + i, CX, abdomen.haut + h * (i + 0.6), larg))
                    .attr("stroke", couleurTrait).attr("stroke-width", 0.6);
            }
            corps.append("ellipse").attr("id", "thorax").attr("class", "thorax").attr("cx", CX).attr("cy", f(thorax.cy))
                .attr("rx", f(thorax.rx)).attr("ry", f(thorax.ry))
                .attr("fill", remplir(t.couleurThorax, "thorax", CX, thorax.cy, Math.max(thorax.rx, thorax.ry)))
                .attr("stroke", couleurTrait).attr("stroke-width", 0.8);
            dessinerTete(corps.append("g").attr("class", "tete-g"), t, tete);
            me.nom = nommer(t);
            svg.insert("title", ":first-child").text(me.nom);
            svg.attr("data-nom", me.nom);
            if (me.onReady) Promise.resolve().then(() => me.onReady(me));
        };
        function nommer(t) {
            const genre = chaoticumPapillonae.nomGenre("anatomique-" + me.graine),
                espece = chaoticumPapillonae.nomEspece(me.nomPalette),
                //sous-espèce d'après les traits du schéma : queue, ocelle, apex
                ssp = (t.queue * me.prop.queueH > 0 ? "caudata" : t.ocelle ? "ocellata" : "simplex")
                    + (t.apex > 0.6 ? "-acuta" : ""),
                code = (PapillonAnatomique.hash(JSON.stringify([me.graine, me.nomPalette, me.prop])) % 0xFFFF)
                    .toString(16).toUpperCase().padStart(4, "0");
            return genre + " " + espece + " " + ssp + " " + code;
        }
        //corps et queue redimensionnés : le papillon est reconstruit (même graine, mêmes couleurs)
        this.proportions = function (p) {
            Object.assign(me.prop, p);
            me.init();
        };
        //réglages des ailes, des yeux et des antennes en temps réel (null : revenir à la graine)
        this.regler = function (r) {
            if (r === null) me.reglages = {};
            else Object.assign(me.reglages, r);
            me.init();
        };

        me.init();
    }

    //réglages modifiables en temps réel : clé (trait), libellé, groupe, type et bornes
    static REGLAGES = [
        { cle: "tailleAiles", nom: "Taille des ailes", groupe: "Ailes", min: 0.5, max: 1, pas: 0.01 },
        { cle: "courbure", nom: "Courbure des ailes", groupe: "Ailes", min: 0, max: 1, pas: 0.01 },
        { cle: "ecailles", nom: "Écailles", groupe: "Ailes", type: "booleen" },
        { cle: "tailleEcailles", nom: "Taille des écailles", groupe: "Ailes", min: 0.015, max: 0.07, pas: 0.001 },
        { cle: "apex", nom: "Apex pointu", groupe: "Ailes", min: 0, max: 1, pas: 0.01 },
        { cle: "cellule", nom: "Longueur de la cellule", groupe: "Ailes", min: 0.38, max: 0.64, pas: 0.01 },
        { cle: "festonsAnt", nom: "Festons (aile antérieure)", groupe: "Ailes", min: 0, max: 1, pas: 0.01 },
        { cle: "festonsPost", nom: "Festons (aile postérieure)", groupe: "Ailes", min: 0, max: 1.5, pas: 0.01 },
        { cle: "queue", nom: "Queue", groupe: "Ailes", min: 0, max: 1, pas: 0.01 },
        { cle: "nervure", nom: "Épaisseur des nervures", groupe: "Ailes", min: 0.002, max: 0.025, pas: 0.001 },
        { cle: "ocelle", nom: "Ocelle", groupe: "Ailes", type: "booleen" },
        { cle: "dessinsMarginaux", nom: "Dessins marginaux", groupe: "Ailes", type: "booleen" },
        { cle: "indicesSexuels", nom: "Indices sexuels", groupe: "Ailes", type: "booleen" },
        { cle: "marge", nom: "Marge", groupe: "Marge", type: "booleen" },
        { cle: "largeurMarge", nom: "Largeur", groupe: "Marge", min: 0.01, max: 0.2, pas: 0.005 },
        { cle: "ondulationMarge", nom: "Ondulation du bord intérieur", groupe: "Marge", min: 0, max: 1, pas: 0.01 },
        { cle: "couleurMarge", nom: "Couleur", groupe: "Marge", type: "couleur" },
        { cle: "opaciteMarge", nom: "Opacité", groupe: "Marge", min: 0.1, max: 1, pas: 0.01 },
        { cle: "couleurTete", nom: "Tête", groupe: "Corps", type: "couleur" },
        { cle: "couleurThorax", nom: "Corps (thorax)", groupe: "Corps", type: "couleur" },
        { cle: "couleurAbdomen", nom: "Queue (abdomen)", groupe: "Corps", type: "couleur" },
        { cle: "pattes", nom: "Pattes", groupe: "Corps", type: "booleen" },
        { cle: "yeux", nom: "Taille des yeux", groupe: "Yeux", min: 0.4, max: 1.8, pas: 0.01 },
        { cle: "ecartYeux", nom: "Écart des yeux", groupe: "Yeux", min: 0.3, max: 0.95, pas: 0.01 },
        { cle: "antenneType", nom: "Type d'antenne", groupe: "Antennes", type: "choix",
            options: [["massue", "En massue"], ["epaisse", "Épaisse"], ["filiforme", "Filiforme"], ["plumeuse", "Plumeuse"]] },
        { cle: "antenne", nom: "Longueur", groupe: "Antennes", min: 50, max: 170, pas: 1 },
        { cle: "ecartAntenne", nom: "Écartement", groupe: "Antennes", min: 0, max: 1, pas: 0.01 },
        { cle: "articles", nom: "Nombre d'articles", groupe: "Antennes", min: 8, max: 40, pas: 1 }
    ];
    //réglages <-> texte pour l'URL : "apex=0.8;ocelle=0;antenneType=plumeuse"
    static reglagesVersTexte(r) {
        return Object.entries(r || {}).map(([k, v]) => k + "=" + (v === true ? 1 : v === false ? 0 : v)).join(";");
    }
    static texteVersReglages(txt) {
        const r = {};
        String(txt || "").split(";").forEach(e => {
            const [k, v] = e.split("=");
            const spec = PapillonAnatomique.REGLAGES.find(x => x.cle == k);
            if (!spec || v === undefined) return;
            if (spec.type == "booleen") r[k] = v == "1" || v == "true";
            else if (spec.type == "couleur") { if (/^#[0-9a-fA-F]{6}$/.test(v) || v == "degrade") r[k] = v; }
            else if (spec.type == "choix") { if (spec.options.some(o => o[0] == v)) r[k] = v; }
            else if (isFinite(parseFloat(v))) r[k] = parseFloat(v);
        });
        return r;
    }

    static hash(str) {
        return chaoticumPapillonae.hash(String(str));
    }
}
