<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
"http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
<title>Papillon Chaotique</title>
    <script src="../public/js/rgbcolor.js"></script>
    <script src="../public/js/canvg.js"></script>
    <script src="../public/js/svgenie.js"></script>

<script type="text/javascript">

var idSvg="papi";

function init(){
	var taille = 300;
	var doc = document.getElementById("svg_papi");
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
        svgenie.save(document.getElementById(idSvg),{ name:"papi.png" }); 
	}
   } catch(ex2){alert("AppendSVG::"+ex2+":"+url);}

}

</script>
</head>
<body onload="init();">
	<div id="svg_papi" style="height:300px;width:300px;">
	</div>
</body>
</html>
