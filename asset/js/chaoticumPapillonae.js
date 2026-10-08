class chaoticumPapillonae {
    constructor(params) {
        var me = this;
        this.cont = params.cont ? params.cont : d3.select("#"+params.idCont);
        this.idSvg = params.idSvg ? params.idSvg : "chaoticumPapillonaeSVG";
        this.width = params.width ? params.width : 400;
        this.height = params.height ? params.height : 400;
        this.scaleColors = params.scaleColors ? params.scaleColors : false;
        //graine : la même graine (avec les mêmes options) redonne le même papillon
        this.graine = params.graine !== undefined && params.graine !== null && params.graine !== "" && Number.isFinite(+params.graine)
            ? (+params.graine >>> 0) : Math.floor(Math.random() * 1e9);
        const alea = d3.randomLcg(this.graine);
        //facteurs de taille du corps et de la queue (1 = taille calculée)
        this.prop = Object.assign({'corpsL':1, 'corpsH':1, 'queueL':1, 'queueH':1}, params.proportions || {});
        //appelée quand un ocelle d'une aile générée est déplacé ou supprimé : reçoit [{x, y, r}]
        this.onOcelles = params.onOcelles ? params.onOcelles : false;
        this.modelesWing = params.modelesWing ? params.modelesWing : chaoticumPapillonae.modelesWing;
        //modèle d'aile imposé, sinon tirage aléatoire dans modelesWing
        this.modeleWing = params.modeleWing ? params.modeleWing
            : this.modelesWing[d3.randomInt.source(alea)(this.modelesWing.length)()];
        //nom de la palette (sert au nom du papillon) et fonction appelée quand le papillon est terminé
        this.nomPalette = params.nomPalette ? params.nomPalette : (this.scaleColors ? "" : "RVB");
        this.onReady = params.onReady ? params.onReady : false;
        this.nom = "";
        let svg, defs, randoms, scales, 
            posis={
                'head':{'cx':0,'cy':0,'rx':0,'ry':0},
                'body':{'cx':0,'cy':0,'rx':0,'ry':0},
                'tail':{'cx':0,'cy':0,'rx':0,'ry':0},
            },
            vParts, hParts, recou, size = 600, head, body, tail, wingL, wingR, posisInitiales, posisAjustees,
            queueMin = 30;  //longueur minimale de queue visible sous le corps

        this.init = function () {
            vParts = [
                "wing1","wing2","wing3",
                "head", 
                "body1", "body2", 
                "tail1", "tail2", "tail3"];
            hParts = [
                    "wing1","wing2","wing3",
                    "body1", 
                    "head-tail", 
                    "body2", 
                    "wing4","wing5","wing6"];
            scales = {
                'vBand':d3.scaleBand(vParts, [0, size])
                    .padding(0.32)//définition du chevauchement
                    .align(0.5),//centrer
                'hBand':d3.scaleBand(hParts, [0, size])
                    .padding(0.64)//définition du chevauchement
                    .align(0.5)//centrer
            };
            recou = {
                'v':scales.vBand.step()-scales.vBand.bandwidth(), 
                'h':scales.hBand.step()-scales.hBand.bandwidth() 
            } 
            randoms = {
                'headCenter':d3.randomInt.source(alea)(scales.vBand("head"), scales.vBand("head")+scales.vBand.bandwidth()),
                'headWidth':d3.randomInt.source(alea)(scales.hBand.bandwidth()/2, scales.hBand.bandwidth()),
                'headHeight':d3.randomInt.source(alea)(scales.vBand.bandwidth()/2, scales.vBand.bandwidth()),
                'bodyCenter':d3.randomInt.source(alea)(scales.vBand("body1")+scales.vBand.bandwidth(), scales.vBand("body2")),
                'bodyWidth':d3.randomInt.source(alea)(scales.hBand.bandwidth(), scales.hBand.step()),
                'tailCenter':d3.randomInt.source(alea)(scales.vBand("tail1"), scales.vBand("tail2")),
                'tailWidth':d3.randomInt.source(alea)(scales.hBand.bandwidth(), scales.hBand.step()),
                //antenne gauche : tous les points de contrôle restent à gauche du centre de la tête
                //(la courbe reste dans leur enveloppe convexe, donc les deux antennes ne se croisent pas)
                'antennaeLxQ1':d3.randomInt.source(alea)(scales.hBand('body1'), scales.hBand('head-tail')),
                'antennaeLyQ1':d3.randomInt.source(alea)(scales.vBand('wing3'), scales.vBand('wing3')+scales.vBand.step()),
                'antennaeLxQ2':d3.randomInt.source(alea)(scales.hBand('wing3'), scales.hBand('wing3')+scales.hBand.step()),
                'antennaeLyQ2':d3.randomInt.source(alea)(scales.vBand('wing2'), scales.vBand('wing2')+scales.vBand.step()),
                'antennaeLxT':d3.randomInt.source(alea)(scales.hBand('body1'), scales.hBand('head-tail')),
                'antennaeLyT':d3.randomInt.source(alea)(scales.vBand('wing1'), scales.vBand('wing1')+scales.vBand.step()),
            };
            svg = this.cont.append("svg")
                .attr("id", me.idSvg)
                .attr("width", me.width)
                .attr("height", me.height)
                .attr("preserveAspectRatio","xMidYMid meet");
            defs = svg.append('defs');
            /*pour les tests de dégradé
            svg.append('rect')
                .attr('x',0).attr('y',0)
                .attr("width", me.width)
                .attr("height", me.height)
                .attr("stroke",4)                
                .attr("fill","white");
            */

            /*pour tester les positions
            setGrille();
            */

            getHeadPosis();
            getBodyPosis();
            setWings();
            setHead();
            setBody();
            setTail();
            setAntennae();


            body.raise();
            //dimensions du corps et de la queue avant leur ajustement aux ailes (cf. changerAile)
            posisInitiales = {'body': {...posis.body}, 'tail': {...posis.tail}};

            //affiche la totalité du papillon
            let bb = svg.node().getBBox();
            //svg.attr("viewbox",bb.x+' '+bb.y+' '+bb.width+' '+bb.height);
            //svg.attr("viewbox",'0 0 '+size+' '+(Number(tail.attr('cx'))+Number(tail.attr('rx'))));
            svg.attr("viewBox",'0 0 '+size+' '+size);
        }
            
        function polygon(sides) {
            var length = sides,
              s = 1,
              phase = 0;
            const radial = d3
              .lineRadial()
              .curve(d3.curveLinearClosed)
              .angle((_, i) => (i / length) * 2 * Math.PI + phase)
              .radius(() => s);
            const poly = function() {
              return radial(Array.from({ length }));
            };
            poly.context = function(_) {
              return arguments.length ? (radial.context(_), poly) : radial.context();
            };
            poly.n = function(_) {
              return arguments.length ? ((length = +_), poly) : length;
            };
            poly.rotate = function(_) {
              return arguments.length ? ((phase = +_), poly) : phase;
            };
            poly.scale = function(_) {
              return arguments.length ? ((s = +_), poly) : s;
            };
            poly.curve = function(_) {
              return arguments.length ? (radial.curve(_), poly) : radial.curve();
            };
            poly.radius = radial.radius;
            poly.angle = radial.angle;
            return poly;
          }

        function setAntennae(){               
            let xT=randoms.antennaeLxT() , yT =randoms.antennaeLyT(), 
                xQ1=randoms.antennaeLxQ1() , yQ1 =randoms.antennaeLyQ1(), 
                xQ2=randoms.antennaeLxQ2() , yQ2 =randoms.antennaeLyQ2(), 
            path ="M "+(posis.head.cx-6)+" "+(posis.head.cy-6) 
                +" Q"+xQ1+" "+yQ1 
                +" "+xQ2+" "+yQ2 
                +" T"+xT+" "+yT+" ",
            ant = svg.append("g").attr('id','antenneL');
            ant.append('path').attr('d',path)
                .attr("stroke","black").attr("fill","transparent")
                .attr("stroke-width","2");
            ant.append('circle').attr('cx',xT).attr('cy',yT).attr('r',4).attr("fill","black");
            ant = svg.append("g").attr('id','antenneR')
                .attr("transform","matrix(-1 0 0 1 "+(2*(posis.head.cx))+" 0)");
            ant.append('path').attr('d',path)
                .attr("stroke","black").attr("fill","transparent")
                .attr("stroke-width","2");
            ant.append('circle').attr('cx',xT).attr('cy',yT).attr('r',4).attr("fill","black");
        }

        function setWings(){
            wingL = svg.append("g").attr('id','wingL');
            wingR = svg.append("g").attr('id','wingR')
                .attr("transform","matrix(-1 0 0 1 "+(2*(posis.head.cx))+" 0)")
                .append("g");
            chargerAile();
        }

        //remplace les ailes du papillon affiché (réglage en temps réel d'une aile générée) :
        //tête, antennes et couleurs déjà tirées sont conservées
        this.changerAile = function (modele) {
            me.modeleWing = modele;
            //le corps et la queue repartent de leurs dimensions d'avant l'ajustement aux ailes
            if (posisInitiales) {
                Object.assign(posis.body, posisInitiales.body);
                Object.assign(posis.tail, posisInitiales.tail);
                body.select('ellipse').attr('cy', posis.body.cy).attr('rx', posis.body.rx).attr('ry', posis.body.ry);
                tail.attr('cy', posis.tail.cy).attr('ry', posis.tail.ry);
            }
            chargerAile();
        };

        function chargerAile(){
            let modele = me.modeleWing;
            //aile générée (ailesGenerees.js) ou fichier SVG d'un modèle
            let chargement = typeof AilesGenerees !== "undefined" && AilesGenerees.estGeneree(modele)
                ? Promise.resolve(new DOMParser().parseFromString(AilesGenerees.svg(modele), "image/svg+xml"))
                : d3.xml(modele);
            chargement.then(data => {
                //un autre modèle a été demandé entre-temps
                if (modele !== me.modeleWing) return;
                let modeleWingL = document.importNode(data.documentElement, true),
                modeleWingR = document.importNode(data.documentElement, true);
                wingL.html("");
                wingR.html("");
                wingL.node().appendChild(modeleWingL);
                wingR.node().appendChild(modeleWingR);
                //même placement pour les deux ailes (l'aile droite est le miroir de la gauche)
                wingR.attr('transform', placeWing(wingL));
                tailleSvgModele(wingR);
                //corps et queue ajustés aux ailes, puis redimensionnés selon les proportions choisies
                posisAjustees = {'body': {...posis.body}, 'tail': {...posis.tail}};
                appliquerProportions();
                //calcule les dégradés pour chaque élément
                wingL.select('svg').selectAll('path').each(setPathDegrad);
                wingL.select('svg').selectAll('ellipse').each(setPathDegrad);
                wingL.select('svg').selectAll('circle').each(setPathDegrad);
                wingR.select('svg').selectAll('path').each(setPathDegrad);
                wingR.select('svg').selectAll('ellipse').each(setPathDegrad);
                wingR.select('svg').selectAll('circle').each(setPathDegrad);
                activerOcelles();
                //le papillon est terminé : on peut le nommer
                nommer();
            });
        }
        //redimensionne le corps et la queue en temps réel (facteurs, 1 = taille calculée)
        this.proportions = function (p) {
            Object.assign(me.prop, p);
            if (!posisAjustees) return;
            appliquerProportions();
            nommer();
        };
        function appliquerProportions(){
            let b = posisAjustees.body, t = posisAjustees.tail,
                haut = b.cy - b.ry,                                 //le haut du corps reste sous la tête
                visible = (t.cy + t.ry) - (b.cy + b.ry);            //queue visible sous le corps
            posis.body.rx = b.rx * me.prop.corpsL;
            posis.body.ry = b.ry * me.prop.corpsH;
            posis.body.cy = haut + posis.body.ry;
            body.select('ellipse').attr('cy', posis.body.cy).attr('rx', posis.body.rx).attr('ry', posis.body.ry);
            defs.select('#cpBodyGrad').attr('cy', posis.body.cy)
                .attr('r', Math.max(posis.body.rx, posis.body.ry));
            posis.tail.rx = t.rx * me.prop.queueL;
            let tHaut = posis.body.cy,
                tBas = Math.min(posis.body.cy + posis.body.ry + Math.max(0, visible) * me.prop.queueH, size - 5);
            posis.tail.cy = (tHaut + tBas) / 2;
            posis.tail.ry = Math.max(1, (tBas - tHaut) / 2);
            tail.attr('cy', posis.tail.cy).attr('rx', posis.tail.rx).attr('ry', posis.tail.ry);
            defs.select('#cpTailGrad').attr('cy', posis.tail.cy)
                .attr('r', Math.max(posis.tail.rx, posis.tail.ry));
        }
        function nommer(){
            me.nom = genererNom();
            svg.attr('data-nom', me.nom);
            let titre = svg.select(':scope > title');
            (titre.empty() ? svg.insert('title', ':first-child') : titre).text(me.nom);
            if (me.onReady) me.onReady(me);
        }

        //ocelles des ailes générées : glisser pour déplacer, double-clic pour supprimer
        function activerOcelles(){
            if (!me.onOcelles) return;
            //les deux ailes (merge de d3 ne réunit pas deux sélections de même taille)
            const deuxAiles = sel => d3.selectAll([...wingL.selectAll(sel).nodes(), ...wingR.selectAll(sel).nodes()]);
            let ocelles = deuxAiles('ellipse.ocelle');
            ocelles.style('cursor', 'move')
                .each(function(){
                    d3.select(this).append('title').text("Glisser pour déplacer, double-cliquer pour supprimer");
                });
            //même ocelle dans les deux ailes (l'aile droite est le miroir de la gauche)
            const jumeaux = el => deuxAiles('[id="' + el.id + '"]');
            ocelles.call(d3.drag()
                .on('drag', function(e){
                    //position du pointeur dans le repère de l'ocelle (miroir compris)
                    let p = new DOMPoint(e.sourceEvent.clientX, e.sourceEvent.clientY)
                        .matrixTransform(this.getScreenCTM().inverse());
                    jumeaux(this).attr('cx', p.x).attr('cy', p.y).classed('deplace', true);
                    defs.select('#WingGrad' + this.id).attr('cx', p.x).attr('cy', p.y);
                })
                .on('end', function(){
                    if (wingL.selectAll('ellipse.deplace').size()) signalerOcelles();
                }));
            ocelles.on('dblclick', function(e){
                e.stopPropagation();
                jumeaux(this).remove();
                signalerOcelles();
            });
        }
        function signalerOcelles(){
            const T = typeof AilesGenerees !== "undefined" ? AilesGenerees.TAILLE : 300;
            let liste = [];
            wingL.selectAll('ellipse.ocelle').each(function(){
                let el = d3.select(this);
                liste.push({'x': +el.attr('cx') / T, 'y': +el.attr('cy') / T, 'r': +el.attr('data-r')});
            });
            me.onOcelles(liste);
        }

        function tailleSvgModele(g){
            //le svg du modèle est affiché à sa taille réelle : 1 unité = 1 unité du viewBox
            let m = g.select('svg'),
                vb = m.node().viewBox.baseVal;
            m.attr('x',0).attr('y',0)
                .attr('width',vb && vb.width ? vb.width : m.attr('width'))
                .attr('height',vb && vb.height ? vb.height : m.attr('height'));
            return m;
        }

        function placeWing(g){
            let m = tailleSvgModele(g);

            //points des contours exprimés dans le repère du groupe g
            let pts = [], gInv = g.node().getScreenCTM().inverse();
            m.selectAll('path').each(function(){
                let len = this.getTotalLength(),
                    mat = gInv.multiply(this.getScreenCTM());
                for (let l = 0; l <= len; l += len/200)
                    pts.push(this.getPointAtLength(l).matrixTransform(mat));
            });
            if(!pts.length) return null;
            let x0 = d3.min(pts, p=>p.x), x1 = d3.max(pts, p=>p.x),
                y0 = d3.min(pts, p=>p.y), y1 = d3.max(pts, p=>p.y),
                ax = x1;

            //zone d'attache = bande du bord droit de l'aile, qui doit être dans le corps
            let zone = pts.filter(p => p.x >= ax - (ax-x0)*0.06),
                zt = d3.min(zone, p=>p.y),
                cx = posis.body.cx, rx0 = posis.body.rx,
                haut = posis.head.cy,           //le haut du corps reste sous la tête
                bx = cx - rx0*0.5,              //l'attache est à mi-chemin entre bord et centre du corps
                sMax = (bx - 5)/(ax - x0),
                choix = null;

            //cherche la plus grande aile, puis le plus petit décalage vers le bas,
            //pour lesquels une ellipse de corps (haut fixé sous la tête) contient l'attache
            for (let i = 0; i < 12 && !choix; i++) {
                let s = sMax * Math.pow(0.92, i);
                for (let off = posis.head.ry*0.3; off < size/3 && !choix; off += 10) {
                    let tx = bx - s*ax, ty = haut + off - s*zt;
                    if (ty + s*y0 < 5 || ty + s*y1 > size - 5) continue;
                    let z = zone.map(p => ({'x':tx + s*p.x, 'y':ty + s*p.y})),
                        corps = corpsPourAttache(z, cx, rx0, haut);
                    if (corps) choix = {'s':s, 'tx':tx, 'ty':ty, 'corps':corps};
                }
            }
            if (choix) ajusteBody(choix.corps);
            //aucune solution : aile réduite placée sous la tête, corps inchangé
            else choix = {'s':sMax/2, 'tx':bx - sMax/2*ax, 'ty':haut - sMax/2*zt};
            let t = 'translate('+choix.tx+' '+choix.ty+') scale('+choix.s+')';
            g.attr('transform', t);
            return t;
        }

        //ellipse de corps (haut fixé) contenant tous les points de la zone d'attache
        function corpsPourAttache(z, cx, rx0, haut){
            let rx = Math.max(rx0, (cx - d3.min(z, p=>p.x))/0.8),
                //laisse de la place pour la queue sous le corps
                ryMax = (size - 5 - queueMin - haut)/2;
            for (let ry = Math.max(posis.body.ry, (d3.max(z, p=>p.y) - haut)/2); ry <= ryMax; ry += 4) {
                let cy = haut + ry;
                if (z.every(p => ((p.x-cx)/rx)**2 + ((p.y-cy)/ry)**2 <= 1))
                    return {'cy':cy, 'rx':rx, 'ry':ry};
            }
            return null;
        }

        function ajusteBody(corps){
            //longueur de queue visible sous le corps avant ajustement
            let visible = Math.max(queueMin,
                (posis.tail.cy + posis.tail.ry) - (posis.body.cy + posis.body.ry));
            posis.body.cy = corps.cy;
            posis.body.rx = corps.rx;
            posis.body.ry = corps.ry;
            body.select('ellipse').attr('cy', corps.cy).attr('rx', corps.rx).attr('ry', corps.ry);
            defs.select('#cpBodyGrad').attr('cy', corps.cy)
                .attr('r', corps.rx > corps.ry ? corps.rx : corps.ry);
            ajusteTail(visible);
        }

        //recale la queue : elle part du centre du corps et dépasse sous le corps
        function ajusteTail(visible){
            let haut = posis.body.cy,
                bas = Math.min(posis.body.cy + posis.body.ry + visible, size - 5);
            posis.tail.cy = (haut + bas)/2;
            posis.tail.ry = (bas - haut)/2;
            tail.attr('cy', posis.tail.cy).attr('ry', posis.tail.ry);
            defs.select('#cpTailGrad').attr('cy', posis.tail.cy)
                .attr('r', posis.tail.rx > posis.tail.ry ? posis.tail.rx : posis.tail.ry);
        }

        function setPathDegrad(e,d){
            let bb = this.getBBox(),
                s = d3.select(this),
                degradId = 'WingGrad'+s.attr('id');
            if(defs.select("#"+degradId).size()==0){
                switch (this.nodeName) {
                    case "ellipse":
                    case "circle":
                        setDegrad({'id':degradId,'type':'radialGradient',
                            'cx':bb.x+bb.width/2,'cy':bb.y+bb.height/2,
                            'r':bb.width>bb.height?bb.width/2:bb.height/2})                            
                        break;
                    default:
                        setDegrad({'id':degradId,'type':'radialGradient','cx':bb.x,'cy':bb.y,
                            'r':bb.width>bb.height?bb.width:bb.height})
                        break;
                }
            }
            s.attr('style',"").attr('fill','url(#'+degradId+')');
        }

        function setGrille(){
            //affiche la grille
            let grille = svg.append("g").attr('id','grille'),
            gV = grille.selectAll(".gv").data(vParts).enter().append('g').attr('class','gv');
            gV.append('rect')
                .attr('x',0)
                .attr('y',v=>scales.vBand(v))
                .attr('fill','#ff000047')
                .attr('stroke','red')
                .attr('stroke-width',1)
                .attr('width',size)
                .attr('height',scales.vBand.bandwidth());
            gV.append('text')
                .attr('x',size)
                .attr('y',v=>scales.vBand(v)+10)
                .attr('text-anchor',"end")
                .attr('fill','red')
                .text(v=>"V"+v);
            let gH = grille.selectAll(".gh").data(hParts).enter().append('g').attr('class','gh');
            gH.append('rect')
                .attr('x',h=>scales.hBand(h))
                .attr('y',0)
                .attr('fill','#00800040')
                .attr('stroke','green')
                .attr('stroke-width',1)
                .attr('width',scales.hBand.bandwidth())
                .attr('height',size);
            gH.append('text')
                .attr('x',h=>scales.hBand(h))
                .attr('y',20)
                .attr('text-anchor',"start")
                .attr('fill','green')
                .text(h=>"H"+h);            
        }

        function getHeadPosis(){
            posis.head.rx = randoms.headWidth();
            posis.head.ry = randoms.headHeight(); 
            posis.head.cx = scales.hBand("head-tail")+scales.hBand.bandwidth()/2; 
            posis.head.cy = randoms.headCenter();
        }

        function setHead(){

            let id='cpHead'; 
            head = svg.append('g').attr('class',id);
            //création des yeux
            head.append('circle')
                .attr('cx',posis.head.cx-posis.head.rx)
                .attr('cy',posis.head.cy-posis.head.rx)
                .attr('r',posis.head.rx/2)
                .attr('fill','black');
            head.append('circle')
                .attr('cx',posis.head.cx+posis.head.rx)
                .attr('cy',posis.head.cy-posis.head.rx)
                .attr('r',posis.head.rx/2)
                .attr('fill','black');
            //ceéation de la téte
            head.append('ellipse')
                .attr('cx',posis.head.cx)
                .attr('cy',posis.head.cy)
                .attr('rx',posis.head.rx)
                .attr('ry',posis.head.ry)
                .attr('fill','url(#'+id+'Grad)')
                /*
                .attr('stroke-width',3)
                .attr('stroke',getRndRGBColor(1))
                */
            setDegrad({'id':id+'Grad','type':'radialGradient'
                ,'cx':posis.head.cx,'cy':posis.head.cy,'r':posis.head.rx > posis.head.ry ? posis.head.rx : posis.head.ry});
            
        }

        function getBodyPosis(){
            posis.body.cy = randoms.bodyCenter();
            posis.body.ry = posis.body.cy-posis.head.cy;
            posis.body.rx = randoms.bodyWidth();
            posis.body.cx = posis.head.cx;
        }

        function setBody(){

            // Creation du corps
            let id='cpBody';
            body = svg.append('g').attr('class',id);
            body.append('ellipse')
                .attr('cx',posis.body.cx)
                .attr('cy',posis.body.cy)
                .attr('rx',posis.body.rx)
                .attr('ry',posis.body.ry)
                .attr('fill','url(#'+id+'Grad)')
                /*
                .attr('stroke-width',3)
                .attr('stroke',getRndRGBColor(1))
                */
            setDegrad({'id':id+'Grad','type':'radialGradient',
                'cx':posis.body.cx,'cy':posis.body.cy,
                'r':posis.body.rx > posis.body.ry ? posis.body.rx : posis.body.ry});
        }
        function setTail(){

            // Creation de la queue
            let id='cpTail';
            posis.tail.cy = randoms.tailCenter();
            posis.tail.ry = posis.tail.cy+posis.body.cy < size ? posis.tail.cy-posis.body.cy : size-posis.tail.cy-10 ;
            posis.tail.rx = randoms.tailWidth();
            posis.tail.cx =  posis.body.cx;
            tail = svg.append('g').attr('class',id).append('ellipse')
                .attr('cx',posis.tail.cx)
                .attr('cy',posis.tail.cy)
                .attr('rx',posis.tail.rx)
                .attr('ry',posis.tail.ry)
                .attr('fill','url(#'+id+'Grad)')
                /*
                .attr('stroke-width',3)
                .attr('stroke',getRndRGBColor(1))
                */
            setDegrad({'id':id+'Grad','type':'radialGradient',
                'cx':posis.tail.cx,'cy':posis.tail.cy,'r':posis.tail.rx > posis.tail.ry ? posis.tail.rx : posis.tail.ry});
        }


        //nom pseudo-latin construit à partir des paramètres de création :
        //genre = modèle d'aile, espèce = palette, sous-espèce = proportions du corps et des ailes,
        //code = empreinte de toutes les dimensions tirées au hasard
        function genererNom(){
            let aile = me.modeleWing.split('/').pop().replace('.svg',''),
                genre = nomGenre(aile),
                espece = nomEspece(me.nomPalette),
                ssp = nomSousEspece(),
                dims = [posis.head, posis.body, posis.tail]
                    .map(p => [p.cx, p.cy, p.rx, p.ry].map(Math.round).join(',')).join(';'),
                code = (hash(aile + '|' + me.nomPalette + '|' + dims) % 0xFFFF).toString(16).toUpperCase().padStart(4,'0');
            return genre + ' ' + espece + ' ' + ssp + ' ' + code;
        }
        function hash(str){
            //FNV-1a 32 bits : même chaîne => même nombre
            let h = 0x811c9dc5;
            for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0;
            return h;
        }
        function nomGenre(aile){
            const syllabes = ["pa","pi","lo","ne","mo","ri","ta","ve","chao","ti","cu","se","ra","do",
                    "li","na","phi","the","xa","lu","me","so","zy","ca"],
                suffixes = ["ia","us","ella","opsis","ides","ina","optera","ura"];
            let h = hash(aile), nom = "";
            for (let i = 0; i < 3; i++) { nom += syllabes[h % syllabes.length]; h = Math.floor(h / syllabes.length); }
            nom += suffixes[h % suffixes.length];
            return nom.charAt(0).toUpperCase() + nom.slice(1);
        }
        function nomEspece(palette){
            const noms = {
                "RVB":"versicolor", "Rainbow":"iridescens", "Sinebow":"sinuosa", "Spectral":"spectralis",
                "Blues":"caerulea", "Greens":"viridula", "Greys":"grisea", "Oranges":"aurantiaca",
                "Purples":"purpurea", "Reds":"rubra", "Viridis":"viridis", "Inferno":"infernalis",
                "Magma":"magmatica", "Plasma":"plasmatica", "Cividis":"civica", "Turbo":"turbida",
                "Warm":"calida", "Cool":"frigida", "CubehelixDefault":"helicoidea",
                "Category10":"decemcolor", "Accent":"accentuata", "Dark2":"obscura", "Observable10":"observabilis",
                "Paired":"gemina", "Pastel1":"pallida", "Pastel2":"pallidula", "Set1":"varia",
                "Set2":"variabilis", "Set3":"varietas", "Tableau10":"tabularis"
            },
                //racines latines des codes de couleur ColorBrewer (YlOrRd, BuPu, PiYG...)
                racines = {"Yl":"flavo","Or":"aurantio","Rd":"rubro","Bu":"caeruleo","Pu":"purpureo",
                    "Gn":"viridi","Br":"brunneo","BG":"glauco","PR":"purpureo","Pi":"roseo","YG":"chloro","Gy":"griseo"};
            if (noms[palette]) return noms[palette];
            let parts = palette.match(/BG|PR|YG|[A-Z][a-z]/g);
            if (!parts || !parts.every(p => racines[p])) return "incognita";
            //la dernière racine prend la terminaison -a, les autres sont reliées par un tiret
            return parts.map(p => racines[p]).join('-').replace(/o$/, 'a').replace(/i$/, 'is');
        }
        function nomSousEspece(){
            //forme du corps (allongement) + envergure des ailes dans le cadre
            let allonge = posis.body.ry / posis.body.rx,
                corps = allonge > 4 ? "graci" : allonge > 2.5 ? "medi" : "crassi",
                w = svg.select('#wingL').node(),
                bb = w.getBBox(),
                //coin gauche de l'aile ramené dans le repère du papillon
                coin = new DOMPoint(bb.x, bb.y).matrixTransform(svg.node().getScreenCTM().inverse().multiply(w.getScreenCTM())),
                envergure = 2 * (posis.body.cx - coin.x) / size,
                ailes = envergure > 0.95 ? "pennis" : envergure > 0.8 ? "alis" : "pterus";
            return corps + ailes;
        }

        function setDegrad(params)
        {
            //création du degradé
            let defGrad = params.def ? params.def : defs,
                degrad = defGrad.append(params.type)
                    .attr('id', params.id)
                    .attr('gradientUnits', "userSpaceOnUse");
            //couleurs tirées d'après la graine et l'id du dégradé : une forme garde ses couleurs
            //quelles que soient les modifications faites aux autres
            let r = d3.randomLcg(hash(me.graine + '|' + params.id) / 4294967296);
            //ajoute l'orientation verticale ou horizontale
            if(params.type== 'linearGradient' && r() >= 0.5)
                degrad.attr('x1', "0").attr('y1', "0").attr('x2', "0").attr('y2', "1");
            //ajoute la taille et la position du radial
            if(params.type== 'radialGradient')
                degrad.attr('cx', params.cx).attr('cy', params.cy).attr('r', params.r);
            
            //ajoute les stops
            degrad.selectAll('stop').data(getRndStop(r)).enter()
                .append('stop').attr('offset', s=>s.o).attr('stop-color', s=>s.c);
        }
        
        function getRndStop(r)
        {
            //4 à 9 arrêts de couleur
            return getRndOffset(r, 4 + Math.floor(r() * 6)).map(o=>{
                return {'o':o,'c':getRndRGBColor(r)}
            })
        }

        function getRndRGBColor(r)
        {
            return me.scaleColors ? me.scaleColors(r())
                : '#' + Math.floor(r() * 0x1000000).toString(16).padStart(6, '0');
        }
        function getRndOffset(r, nb)
        {
            let offset=[];
            for (let i = 0; i < nb; i++) {
                offset.push(r());
            }
            return offset.sort();
        }
        
        me.init();
    }

    //modèles d'aile disponibles : exemples dessinés, complétés par chargerModeles()
    static ailesDessinees = ["asset/svg/papiAile.svg", "asset/svg/papiAile1.svg"];
    static modelesWing = [...chaoticumPapillonae.ailesDessinees];
    //ailes extraites des planches (cf. extractPapillons.py), groupées par planche source
    static planches = [];
    //image détourée du papillon dont chaque aile a été extraite (fichier svg -> png)
    static images = {};
    static symMin = 0.8;

    //lit le manifeste produit par extractPapillons.py et ajoute les ailes symétriques
    static chargerModeles(url = "papillons_svg/modeles.json") {
        return d3.json(url).then(data => {
            let ailes = data.modeles.filter(m => m.axe && m.sym >= chaoticumPapillonae.symMin),
                planches = d3.groups(ailes, m => m.prefixe).map(([prefixe, ms]) => ({
                    'prefixe': prefixe,
                    'source': ms[0].source,
                    'modeles': ms.map(m => m.fichier)
                }));
            chaoticumPapillonae.planches = planches;
            chaoticumPapillonae.images = Object.fromEntries(ailes.map(m => [m.fichier, m.image]));
            chaoticumPapillonae.modelesWing = [...chaoticumPapillonae.ailesDessinees,
                ...planches.flatMap(p => p.modeles)];
            return chaoticumPapillonae.modelesWing;
        }).catch(e => {
            console.warn("Manifeste des modèles d'aile illisible : " + url, e);
            return chaoticumPapillonae.modelesWing;
        });
    }

}
