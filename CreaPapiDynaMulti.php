<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
"http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
<title>Foule de papillon dynamique</title>
<script type="text/javascript">

function init(){
	var taille = 100;
	var doc = document.getElementById("svg_papi");
	for (var iter = 0; iter < 100; iter++) {
		var div = document.createElement('div');
		div.setAttribute("id", "id"+iter);
		var rTop=Math.floor(Math.random()*window.innerHeight);
		var rLeft=Math.floor(Math.random()*window.innerWidth);
		div.setAttribute("style", 'position:absolute;visibility:visible;top:'+rTop+'px; left:'+rLeft+'px');
		doc.appendChild(div);	
		AppendSVG("CreaPapiDynaAnim.php?anim=0&larg="+taille+"&haut="+taille+"&id=id"+iter,document.getElementById("id"+iter),true);
		setInterval('moveAlea(\"id'+iter+'\");',100);
	}	
}

function moveAlea (id) {
	var vitesse = 40;
	var obj = document.getElementById(id);
	var top = parseInt(obj.style.top);
	var left = parseInt(obj.style.left); 		
	var opTop = Math.floor(Math.random()*vitesse);
	var opLeft = Math.floor(Math.random()*vitesse);
	var larg = window.innerWidth;
	var haut = window.innerHeight;
	
	if(opTop >= vitesse/2){
		rTop=top+opTop;
		//console.log(rTop+"="+top+"+"+opTop);		
	}else{
		rTop=top-opTop;
		//console.log(rTop+"="+top+"-"+opTop);		
	}
		
	if(opLeft >= vitesse/2)
		rLeft=left+opLeft;
	else
		rLeft=left-opLeft;

	if(rTop>haut)rTop=0;
	if(rLeft>larg)rLeft=0;
	if(rTop<-80)rTop=haut;
	if(rLeft<-80)rLeft=larg;

	obj.setAttribute("style", 'position: absolute;visibility:visible; top:'+rTop+'px; left:'+rLeft+'px');
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
	      alert("R�ception erreur " + p.status);
	}else{

	    var response = p.responseText;
		var parser=new DOMParser();
		var resultDoc=parser.parseFromString(response,"text/xml");
		var nodeToImport = document.importNode(resultDoc.documentElement, true); 
		doc.appendChild(nodeToImport);

	}
   } catch(ex2){alert("AppendSVG::"+ex2+":"+url);}

}

</script>
</head>
<body onload="init();">
	<div id="svg_papi" style="height:80px;width:80px;">
	</div>
</body>
</html>
