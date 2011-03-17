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
		var rTop=Math.floor(Math.random()*600);
		var rLeft=Math.floor(Math.random()*600);
		div.setAttribute("style", 'position:absolute;visibility:visible;top:'+rTop+'px; left:'+rLeft+'px');
		doc.appendChild(div);	
		AppendSVG("CreaPapiDynaAnim.php?larg="+taille+"&haut="+taille+"&id=id"+iter,document.getElementById("id"+iter),true);
		//setInterval('moveAlea(\"id'+iter+'\");',100);
	}	
}

function moveAlea (id) {
	var obj = document.getElementById(id);
	var top = parseInt(obj.style.top);
	var left = parseInt(obj.style.left); 		
	var opTop = Math.floor(Math.random()*30);
	var opLeft = Math.floor(Math.random()*30);

	if(opTop>15)
		rTop=top+opTop;
	else
		rTop=top-opTop;

	if(opLeft>15)
		rLeft=left+opLeft;
	else
		rLeft=left-opLeft;

	if(rTop>520)rTop=0;
	if(rLeft>1000)rLeft=0;
	if(rTop<-80)rTop=520;
	if(rLeft<-80)rLeft=1000;

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
	      alert("Réception erreur " + p.status);
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
