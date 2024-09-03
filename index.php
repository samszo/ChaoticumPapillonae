<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
"http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
<title>Papillon Chaotique</title>
    <script src="asset/js/rgbcolor.js"></script>
    <script src="asset/js/canvg.js"></script>
    <script src="asset/js/svgenie.js"></script>

<script type="text/javascript">

var idSvg="papi",params;

function init(){
	params = extractUrlParams();
	//gestion des icones pour pwa
	if(params.pwa)params.taille=512;
	var taille = params.taille ? params.taille : 300;
	var doc = document.getElementById("svg_papi");
	doc.setAttribute("style", 'height:'+taille+'px;width:'+taille+'px;');
	var div = document.createElement('div');
	div.setAttribute("id", "div"+idSvg);
	var rTop=0;
	var rLeft=0;
	div.setAttribute("style", 'position:absolute;visibility:visible;top:'+rTop+'px; left:'+rLeft+'px');
	doc.appendChild(div);	
	AppendSVG("CreaPapiDynaAnim.php?anim=0&larg="+taille+"&haut="+taille+"&id="+idSvg,document.getElementById("div"+idSvg),true);
}

function AppendSVG(url,doc, InSvg) {
  try {
	if(!InSvg){
		//vide le conteneur
		while(doc.hasChildNodes())
			doc.removeChild(doc.firstChild);
	}

	var p = new XMLHttpRequest();
	p.onload = null;
	p.open("GET", url, false);
	p.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	p.send(null);

	if (p.status != "200" ){
	      alert("Réception erreur " + p.status);
	}else{
	    var response = p.responseText;
		var parser=new DOMParser();
		var resultDoc=parser.parseFromString(response,"text/xml");
		var nodeToImport = document.importNode(resultDoc.documentElement, true); 
		doc.appendChild(nodeToImport);		
		var svg = document.getElementById(idSvg);
        svgenie.save(svg,{ name:"papi.png" }); 
		if(params.pwa){
			//création des autres tailles
			svg.setAttribute("width", 192);
			svg.setAttribute("height", 192);
			svgenie.save(svg,{ name:"papi-192.png" }); 
			svg.setAttribute("width", 48);
			svg.setAttribute("height", 48);
			svgenie.save(svg,{ name:"papi-48.ico" }); 

		}
	}
   } catch(ex2){alert("AppendSVG::"+ex2+":"+url);}

}
/**
 * Fonction de récupération des paramètres GET de la page
 * @return Array Tableau associatif contenant les paramètres GET
 */
function extractUrlParams(){	
	var t = location.search.substring(1).split('&');
	var f = [];
	for (var i=0; i<t.length; i++){
		var x = t[ i ].split('=');
		f[x[0]]=x[1];
	}
	return f;
}
</script>
</head>
<body onload="init();">
	<div id="svg_papi" style="height:300px;width:300px;">
	</div>
</body>
</html>
