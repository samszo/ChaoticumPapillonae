class chaoticumPapillonae {
    constructor(params) {
        var me = this;
        this.cont = params.cont ? params.cont : d3.select("#"+params.idCont);
        this.width = params.width ? params.width : 400;
        this.height = params.height ? params.height : 400;
        let svg, container, defs, randoms, vbSize = 600, head, body, tail;

        this.init = function () {

            randoms = {
                'gradStop':d3.randomInt(4, 10),
                'gradOffset':d3.randomUniform(),
                'gradOrientation':() => Math.random() >= 0.5,
                'headTop':d3.randomInt(242, 252),
                'headWidth':d3.randomInt(8, 25),
                'bodyTop':d3.randomInt(32, 96),
                'bodyWidth':d3.randomInt(24, 64),
                'tailTop':d3.randomInt(32, 96),
                'tailWidth':d3.randomInt(16, 32),
            }

            svg = this.cont.append("svg")
                .attr("width", me.width)
                .attr("height", me.height)
                .attr("preserveAspectRatio","xMidYMid meet")
                .attr("viewbox",'0 0 '+vbSize+' '+vbSize);
            container = svg.append("g");
            defs = svg.append('defs');

            setHead();
            setBody();
            setTail();

            //affiche la totalité du papillon
            //let bb = container.node().getBBox();
            //svg.attr("viewbox",bb.x+' '+bb.y+' '+bb.width+' '+bb.height);
            //svg.attr("viewbox",'0 0 '+vbSize+' '+(Number(tail.attr('cx'))+Number(tail.attr('rx'))));
            svg.node().setAttribute("viewbox",'0 0 '+vbSize+' '+vbSize);
        }
            
        function setHead(){

            // Creation de la téte
            let id='cpHead'
            , rx = randoms.headWidth(), ry = randoms.headWidth(), cx = (vbSize/2)-(rx/2), cy = randoms.headTop();
            head = container.append('g').attr('class',id).append('ellipse')
                .attr('cx',cx)
                .attr('cy',cy)
                .attr('rx',rx)
                .attr('ry',ry)
                .attr('fill','url(#'+id+'Grad)')
                .attr('stroke-width',3)
                .attr('stroke',getRndRGBColor(1))
            setDegrad({'id':id+'Grad','type':'radialGradient','cx':cx,'cy':cy,'r':rx > ry ? rx : ry});
        }

        function setBody(){

            // Creation du corps
            let id='cpBody'
            , rx = randoms.bodyWidth(), ry = randoms.bodyTop()
            , cx =  Number(head.attr('cx')), cy = Number(head.attr('cy'))+ry+3 ;
            body = container.append('g').attr('class',id).append('ellipse')
                .attr('cx',cx)
                .attr('cy',cy)
                .attr('rx',rx)
                .attr('ry',ry)
                .attr('fill','url(#'+id+'Grad)')
                .attr('stroke-width',3)
                .attr('stroke',getRndRGBColor(1))
            setDegrad({'id':id+'Grad','type':'radialGradient','cx':cx,'cy':cy,'r':rx > ry ? rx : ry});
        }
        function setTail(){

            // Creation de la queue
            let id='cpTail'
            , rx = randoms.tailWidth(), ry = randoms.tailTop()
            , cx =  Number(head.attr('cx')), cy = Number(body.attr('cy'))+ry+6 ;
            tail = container.append('g').attr('class',id).append('ellipse')
                .attr('cx',cx)
                .attr('cy',cy)
                .attr('rx',rx)
                .attr('ry',ry)
                .attr('fill','url(#'+id+'Grad)')
                .attr('stroke-width',3)
                .attr('stroke',getRndRGBColor(1))
            setDegrad({'id':id+'Grad','type':'radialGradient','cx':cx,'cy':cy,'r':rx > ry ? rx : ry});
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


