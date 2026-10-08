class chaoticumPapillonae {
    constructor(params) {
        var me = this;
        this.cont = params.cont ? params.cont : d3.select("#"+params.idCont);
        this.idSvg = params.idSvg ? params.idSvg : "chaoticumPapillonaeSVG";
        this.width = params.width ? params.width : 400;
        this.height = params.height ? params.height : 400;
        this.scaleColors = params.scaleColors ? params.scaleColors : false;
        this.modelesWing = params.modelesWing ? params.modelesWing : chaoticumPapillonae.modelesWing;
        //modèle d'aile imposé, sinon tirage aléatoire dans modelesWing
        this.modeleWing = params.modeleWing ? params.modeleWing
            : this.modelesWing[d3.randomInt(this.modelesWing.length)()];
        let svg, defs, randoms, scales, 
            posis={
                'head':{'cx':0,'cy':0,'rx':0,'ry':0},
                'body':{'cx':0,'cy':0,'rx':0,'ry':0},
                'tail':{'cx':0,'cy':0,'rx':0,'ry':0},
            },
            vParts, hParts, recou, size = 600, head, body, tail,
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
                'gradStop':d3.randomInt(4, 10),
                'gradOffset':d3.randomUniform(),
                'gradOrientation':() => Math.random() >= 0.5,
                'headCenter':d3.randomInt(scales.vBand("head"), scales.vBand("head")+scales.vBand.bandwidth()),
                'headWidth':d3.randomInt(scales.hBand.bandwidth()/2, scales.hBand.bandwidth()),
                'headHeight':d3.randomInt(scales.vBand.bandwidth()/2, scales.vBand.bandwidth()),
                'bodyCenter':d3.randomInt(scales.vBand("body1")+scales.vBand.bandwidth(), scales.vBand("body2")),
                'bodyWidth':d3.randomInt(scales.hBand.bandwidth(), scales.hBand.step()),
                'tailCenter':d3.randomInt(scales.vBand("tail1"), scales.vBand("tail2")),
                'tailWidth':d3.randomInt(scales.hBand.bandwidth(), scales.hBand.step()),
                'antennaeLxQ1':d3.randomInt(scales.hBand('head-tail'), scales.hBand('head-tail')+scales.hBand.step()),
                'antennaeLyQ1':d3.randomInt(scales.vBand('wing3'), scales.vBand('wing3')+scales.vBand.step()),
                'antennaeLxQ2':d3.randomInt(scales.hBand('wing3'), scales.hBand('wing3')+scales.hBand.step()),
                'antennaeLyQ2':d3.randomInt(scales.vBand('wing2'), scales.vBand('wing2')+scales.vBand.step()),
                'antennaeLxT':d3.randomInt(scales.hBand('body2'), scales.hBand('body2')+scales.hBand.step()),
                'antennaeLyT':d3.randomInt(scales.vBand('wing1'), scales.vBand('wing1')+scales.vBand.step()),
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
            let wingL = svg.append("g").attr('id','wingL'),
            wingR = svg.append("g").attr('id','wingR')
                .attr("transform","matrix(-1 0 0 1 "+(2*(posis.head.cx))+" 0)")
                .append("g");

            //charger le modèle d'aile
            d3.xml(me.modeleWing).then(data => {
                let modeleWingL = document.importNode(data.documentElement, true),
                modeleWingR = document.importNode(data.documentElement, true);
                wingL.node().appendChild(modeleWingL);
                wingR.node().appendChild(modeleWingR);
                //même placement pour les deux ailes (l'aile droite est le miroir de la gauche)
                wingR.attr('transform', placeWing(wingL));
                tailleSvgModele(wingR);
                //calcule les dégradés pour chaque élément
                wingL.select('svg').selectAll('path').each(setPathDegrad);
                wingL.select('svg').selectAll('ellipse').each(setPathDegrad);
                wingL.select('svg').selectAll('circle').each(setPathDegrad);
                wingR.select('svg').selectAll('path').each(setPathDegrad);
                wingR.select('svg').selectAll('ellipse').each(setPathDegrad);
                wingR.select('svg').selectAll('circle').each(setPathDegrad);
            });
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


        function setDegrad(params)
        {
            //création du degradé
            let defGrad = params.def ? params.def : defs,
                degrad = defGrad.append(params.type)
                    .attr('id', params.id)
                    .attr('gradientUnits', "userSpaceOnUse");
            //ajoute l'orientation verticale ou horizontale
            if(params.type== 'linearGradient' && randoms.gradOrientation())
                degrad.attr('x1', "0").attr('y1', "0").attr('x2', "0").attr('y2', "1");
            //ajoute la taille et la position du radial
            if(params.type== 'radialGradient')
                degrad.attr('cx', params.cx).attr('cy', params.cy).attr('r', params.r);
            
            //ajoute les stops
            degrad.selectAll('stop').data(getRndStop()).enter()
                .append('stop').attr('offset', s=>s.o).attr('stop-color', s=>s.c);
        }
        
        function getRndStop()
        {
            return getRndOffset(randoms.gradStop()).map(o=>{
                return {'o':o,'c':getRndRGBColor(1)}
            })
        }

        function getRndRGBColor(nb)
        {
            //initialise le random
            let colors = [];
            for (let i = 0; i < nb; i++) {
                colors.push(me.scaleColors ? me.scaleColors(Math.random()) : '#' + (Math.random() * 0xffffff | 0).toString(16));
            }
            return colors;
        }
        function getRndOffset(nb)
        {
            let offset=[];
            for (let i = 0; i < nb; i++) {
                offset.push(randoms.gradOffset());
            }
            return offset.sort();
        }
        
        me.init();
    }

    //modèles d'aile disponibles : exemples dessinés + ailes extraites par extractPapillons.py (symétrie > 0,80)
    static modelesWing = [
        "asset/svg/papiAile.svg",
        "asset/svg/papiAile1.svg",
        ...[1,2,3,4,5,7,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,
            31,32,33,34,35,36,37,38,39,40,41,42,43,45,46,47,48,49,50,51,52,56,57,58,59,60,
            61,62,63,64,66,67,68,69,71,72,73,74,75,78,80,82,83]
            .map(n => "papillons_svg/papillon_"+String(n).padStart(2,"0")+".svg")
    ];

}
