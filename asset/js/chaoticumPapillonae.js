class chaoticumPapillonae {
    constructor(params) {
        var me = this;
        this.cont = params.cont ? params.cont : d3.select("#"+params.idCont);
        this.width = params.width ? params.width : 400;
        this.height = params.height ? params.height : 400;
        let svg, container, defs, randoms, scales, 
            posis={
                'head':{'cx':0,'cy':0,'rx':0,'ry':0},
                'body':{'cx':0,'cy':0,'rx':0,'ry':0},
                'tail':{'cx':0,'cy':0,'rx':0,'ry':0},
            },
            vParts, hParts, recou, size = 600, head, body, tail;

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
                .attr("width", me.width)
                .attr("height", me.height)
                .attr("preserveAspectRatio","xMidYMid meet");
            container = svg.append("g");
            defs = svg.append('defs');

            setGrille();

            setHead();
            setBody();
            setTail();
            setAntennae();

            setWings();

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

            let wing = svg.append("g").attr('id','wingL'),
                d = polygon()
                .curve(d3.curveCardinalClosed)
                .scale(100)
                .n(3)();
            wing.append('path').attr('d',d)
                .attr("stroke","black").attr("fill","orange")
                .attr("stroke-width","2")
                .attr("transform","translate("+(posis.body.cx-100)+" "+posis.body.cy+") rotate(70)");
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

        function setHead(){

            let id='cpHead'; 
            posis.head.rx = randoms.headWidth();
            posis.head.ry = randoms.headHeight(); 
            posis.head.cx = scales.hBand("head-tail")+scales.hBand.bandwidth()/2; 
            posis.head.cy = randoms.headCenter();
            head = container.append('g').attr('class',id);
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
                .attr('stroke-width',3)
                .attr('stroke',getRndRGBColor(1))
            setDegrad({'id':id+'Grad','type':'radialGradient'
                ,'cx':posis.head.cx,'cy':posis.head.cy,'r':posis.head.rx > posis.head.ry ? posis.head.rx : posis.head.ry});
            
        }

        function setBody(){

            // Creation du corps
            let id='cpBody';
            posis.body.cy = randoms.bodyCenter();
            posis.body.ry = posis.body.cy-posis.head.cy;
            posis.body.rx = randoms.bodyWidth();
            posis.body.cx = posis.head.cx;
            body = container.append('g').attr('class',id);
            body.append('ellipse')
                .attr('cx',posis.body.cx)
                .attr('cy',posis.body.cy)
                .attr('rx',posis.body.rx)
                .attr('ry',posis.body.ry)
                .attr('fill','url(#'+id+'Grad)')
                .attr('stroke-width',3)
                .attr('stroke',getRndRGBColor(1))
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
            tail = container.append('g').attr('class',id).append('ellipse')
                .attr('cx',posis.tail.cx)
                .attr('cy',posis.tail.cy)
                .attr('rx',posis.tail.rx)
                .attr('ry',posis.tail.ry)
                .attr('fill','url(#'+id+'Grad)')
                .attr('stroke-width',3)
                .attr('stroke',getRndRGBColor(1))
            setDegrad({'id':id+'Grad','type':'radialGradient',
                'cx':posis.tail.cx,'cy':posis.tail.cy,'r':posis.tail.rx > posis.tail.ry ? posis.tail.rx : posis.tail.ry});
        }


        function setDegrad(params)
        {
            //création du degradé
            let degrad = defs.append(params.type)
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
                colors.push('#' + (Math.random() * 0xffffff | 0).toString(16));
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

}


