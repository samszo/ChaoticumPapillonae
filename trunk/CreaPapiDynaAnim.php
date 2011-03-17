<?php

// *** Define the path to the SVG class dir. ***
/*
define("SVG_CLASS_BASE", 
        $_SERVER["DOCUMENT_ROOT"]."/param/ClassPHP/SVG/");
*/
define("SVG_CLASS_BASE", 
        "../evalactisem/library/svg/");

// récupération des variables
if(isset($_GET['larg'])){
	$larg = $_GET['larg'];
}else{
	$larg = "100%";
}
if(isset($_GET['haut'])){
	$haut = $_GET['haut'];
}else{
	$haut = "100%";
}
if(isset($_GET['id'])){
	$id = $_GET['id'];
}else{
	$id = "id0";
}

// Stoppe 1 seconde pour changer l'aléa
//lors de HTTPREQUEST multiples
//sleep(1);

//initialise le random
mt_srand(make_seed());

// Include the class files.
require_once(SVG_CLASS_BASE."Svg.php");

// Create an instance of SvgDocument. All other objects will be added to this
// instance for printing.
// Set the height and width of the viewport. xMidYMid meet
$svg =& new SvgDocument($larg, $haut,"","34 -80 504 600","none",$id);

// Création du groupe des dégradés
	$gDegrad =& new SvgGroup("", "");

// Creation de la tête
	$gTet =& new SvgGroup("", "");
	//tête
	//tirage du point le plus haut
	$x2 = mt_rand(242, 252);
	//tirage de la largeur
	$x3 = mt_rand(8,25);
	//tirage de la hauteur
	$x4 = mt_rand(8,25);
	//centrage de l'objet
	$x1 = 298.5 - ($x3 / 2);

	// Creation du dégradé
	$nomDeg = "DegTete";
	$gDegrad->addChild(GetDegrad($nomDeg,10,1000,"radial"));
	$gTet =& new SvgGroup("", "");

	//traçage de l'objet
	$tete = new SvgEllipse($x1, $x2, $x3, $x4, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\"");

	// Make the circle a child of g.
	$gTet->addChild($tete);

	//traçage des antennes
	$y = $x2 + 6;
	$x = 302;
	$a  = mt_rand(500,301);
	$b = mt_rand(400 - 30 + 1,30);
	$c = mt_rand(500 - 301 + 1,301);
	$d = mt_rand(400 - 30 + 1,30);
	$e = mt_rand(500 - 301 + 1,301);
	$f = mt_rand(400 - 30 + 1,30);
	
	// Creation de la couleur
	$colo = GetRndRGBColor(1);
	//$g->addChild(GetDegrad($nomDeg,60,1000));

	//traçage de l'objet
	$path ="M ".$x." ".$y 
			." Q".$a." ".$b 
			." ".$c." ".$d 
			." T".$e." ".$f." ";
	$ant1 = new SvgPath($path,"stroke-width:3","","fill=\"none\" stroke=\"".$colo."\" ");
	// ajoute un graphique
	$gAnt1 =& new SvgGroup("", "");
	$gAnt1->addChild($ant1);
	// ajoute un graphique
	$gAnt2 =& new SvgGroup("", "matrix(-1 0 0 1 ".(2*$x1)." 0)");
	$ant2 = new SvgPath($path,"stroke-width:3","","fill=\"none\" stroke=\"".$colo."\" ");
	$gAnt2->addChild($ant2);
	
// Creation du corps
	$gCor =& new SvgGroup("", "");
	//tirage de la largeur
	$x3 = mt_rand(64, 24);
	//tirage de la hauteur
	$hautCor = mt_rand(96, 32);
	//tirage du point le plus haut
	$xhautCor = $x2 + $hautCor + 3;

	// Creation du dégradé animé
	$nomDeg = "DegCorps";
	$gDegrad->addChild(GetRndAniDegrad("all",$nomDeg,10,1000,"radial"));
	
	//traçage de l'objet
	$corps = new SvgEllipse($x1, $xhautCor, $x3, $hautCor, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\"");

	// Make the circle a child of g.
	$gCor->addChild($corps);

//traçage de la queue
	$gQue =& new SvgGroup("", "");
	//tirage de la largeur
	$x3 = mt_rand(32, 16);
	//tirage de la hauteur
	$x4 = mt_rand(96, 32);
	//tirage du point le plus haut
	$x2 = $xhautCor + $x4 + 6;
	// Creation du dégradé
	$nomDeg = "DegQueue";
	$gDegrad->addChild(GetRndAniDegrad("all",$nomDeg,10,1000,"radial"));
	//traçage de l'objet
	$queue = new SvgEllipse($x1, $x2, $x3, $x4, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\"");
	// Make the circle a child of g.
	$gQue->addChild($queue);

//traçage des ailes
	$gAileD =& new SvgGroup("", "");
	$gAileG =& new SvgGroup("", "matrix(-1 0 0 1 ".(2*$x1)." 0)");

	// Creation du dégradé
	$nomDeg = "DegAile";
	$gDegrad->addChild(GetRndAniDegrad("all",$nomDeg,10,1000,"radial"));

	$path="M408.929 201.27 
	C470.112 182.913 531.295 164.557 528.055 147.279 
	C524.457 130.002 415.767 87.53 388.055 97.249 
	C359.983 106.967 360.702 156.278 361.062 205.229";
/*
	$path=ModifAleaPath("M408.929 201.27 C470.112 182.913 531.295 164.557 528.055 147.279 C524.457 130.002 415.767 87.53 388.055 97.249 C359.983 106.967 360.702 156.278 361.062 205.229",10);
	$path="M".mt_rand(400, 500)." ".mt_rand(200, 300)." 
		C".mt_rand(400, 500)." ".mt_rand(200, 300)." ".mt_rand(500, 600)." ".mt_rand(100, 200)." ".mt_rand(500, 600)." ".mt_rand(100, 200)." 
		C".mt_rand(500, 600)." ".mt_rand(100, 200)." ".mt_rand(400, 500)." ".mt_rand(100, 200)." ".mt_rand(300, 400)." ".mt_rand(100, 200)." 
		C".mt_rand(300, 400)." ".mt_rand(100, 200)." ".mt_rand(300, 400)." ".mt_rand(100, 200)." ".mt_rand(300, 400)." ".mt_rand(200, 300)." ";
*/	
	$aile1 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile1);
	$gAileG->addChild($aile1);

	/*
	$path="M".mt_rand(400, 500)." ".mt_rand(200, 300)." 
		C".mt_rand(400, 500)." ".mt_rand(200, 300)." ".mt_rand(400, 500)." ".mt_rand(200, 300)." ".mt_rand(500, 600)." ".mt_rand(200, 300)." 
		C".mt_rand(500, 600)." ".mt_rand(100, 200)." ".mt_rand(500, 600)." ".mt_rand(100, 200)." ".mt_rand(500, 600)." ".mt_rand(100, 200)." 
		C".mt_rand(500, 600)." ".mt_rand(100, 200)." ".mt_rand(400, 500)." ".mt_rand(100, 200)." ".mt_rand(400, 500)." ".mt_rand(200, 300)." ";
	*/
	$path="M437.001 218.187 
		C465.073 231.864 492.786 245.182 507.901 233.304 
		C523.017 221.426 544.611 152.679 528.055 147.279 
		C511.5 141.88 460.394 171.755 408.929 201.27";
	$aile2 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile2);
	$gAileG->addChild($aile2);

	$path="M397.052 257.42 C428.723 251.301 460.394 245.182 479.109 241.223 C497.464 237.264
			515.099 237.264 507.901 233.305 C501.063 229.346 469.032 223.947 437.001 218.188";
	$aile3 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile3);
	$gAileG->addChild($aile3);

	$path="M303.118 284.775 C357.103 296.293 411.448 307.451 440.96 300.252 C470.472 293.054
			486.308 248.421 479.109 241.223 C471.551 234.384 434.122 245.902 397.052 257.42";
	$aile4 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile4);
	$gAileG->addChild($aile4);

	$path="M303.118 284.775 C316.434 283.695 374.738 268.578 397.052 257.42 C419.366 246.262
			434.842 227.545 437.001 218.187 C438.801 208.829 421.525 203.43 408.929 201.27
			C396.332 199.11 376.178 194.791 361.062 205.229 C345.586 215.667 326.512 252.021
			317.154 264.259 C307.437 276.497 289.802 285.854 303.118 284.775 z";
	$aile5 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile5);
	$gAileG->addChild($aile5);

	$path="M326.152 290.174 C367.901 295.933 410.009 301.693 429.083 303.132 C448.158 304.932
			461.834 303.852 440.96 300.252 C420.086 297.013 361.422 289.814 303.118 282.976";
	$aile6 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile6);
	$gAileG->addChild($aile6);

	//courbe intérieure basse
	$path="M339.108 302.412 C407.849 331.207 476.95 360.002 492.066 360.361 C506.822 360.361
			456.795 315.009 429.083 303.132 C401.371 291.614 363.582 290.894 326.152 290.174";
	$aile7 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile7);
	$gAileG->addChild($aile7);

	$path="M383.016 338.405 C407.849 367.92 432.683 397.795 451.037 401.394 C469.032 404.993
			510.421 376.918 492.066 360.361 C473.351 343.804 406.049 322.927 339.108 302.412";
	$aile8 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile8);
	$gAileG->addChild($aile8);

	$path="M374.019 368.28 C392.014 402.114 410.009 435.948 422.965 441.346 C435.922 446.745
			457.516 418.311 451.037 401.394 C444.199 384.117 413.608 361.441 383.016 338.405";
	$aile9 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile9);
	$gAileG->addChild($aile9);

	$path="M357.104 390.236 C355.664 421.91 354.225 453.944 365.021 462.223 C376.178 470.861
			421.525 456.824 422.965 441.346 C424.404 425.509 399.212 397.075 374.019 368.28";
	$aile10 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile10);
	$gAileG->addChild($aile10);

	$path="M303.118 288.015 C314.635 353.163 326.152 418.312 331.91 447.466 C338.029 476.261
			339.468 460.064 338.029 462.224 C336.589 464.744 319.674 461.144 323.993 461.144
			C328.672 461.144 359.623 474.102 365.021 462.224 C370.419 450.346 363.941
			420.471 357.104 390.237";
	$aile11 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile11);
	$gAileG->addChild($aile11);

	$path="M303.118 287.654 C308.157 304.571 345.226 376.919 357.103 390.236 C368.98 403.554
			369.7 376.919 374.019 368.28 C378.338 359.641 388.775 349.203 383.017 338.405
			C377.259 327.247 348.467 310.33 339.109 302.412 C329.392 294.134 331.911 293.413
			326.152 290.174 C320.034 286.935 298.08 271.098 303.118 287.654 z";
	$aile12 = new SvgPath($path, "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// Make the circle a child of g.
	$gAileD->addChild($aile12);
	$gAileG->addChild($aile12);

// Place les graphiques dans l'ordre des niveaux
$gDegrad->addParent($svg);
$gAileD->addParent($svg);
$gAileG->addParent($svg);
$gQue->addParent($svg);
$gCor->addParent($svg);
$gTet->addParent($svg);
$gAnt1->addParent($svg);
$gAnt2->addParent($svg);

// Send a message to the svg instance to start printing.
$svg->printElement();

function ModifAleaPath($Path,$nbAlea)
{
	//modification aléatoire d'un path
	$newPath= "";
	/*$path="M408.929 201.27 
		C470.112 182.913 531.295 164.557 528.055 147.279 
		C524.457 130.002 415.767 87.53 388.055 97.249 
		C359.983 106.967 360.702 156.278 361.062 205.229";
	*/
	//récupération des coordonnées M
	$posi = strpos($Path, " C");
	$partPath = substr($Path, 1,$posi); 
	$arrCoorM = split( " ", $partPath);
	// recalcul des coordonnées M
	$newPath= "M".($arrCoorM[0]+mt_rand(0, $nbAlea));
	$newPath= $newPath." ".($arrCoorM[1]+mt_rand(0, $nbAlea));
	//récupération des coordonnées C
	$partPath = substr($Path, $posi+2);
	$arrCoorC = split( " C", $partPath);
	// recalcul des coordonnées M
	for ($i = 0; $i <= count($arrCoorC)-1; $i++) {
		$newPath= $newPath." C";
		$strCoor = $arrCoorC[$i];
		$strCoor = substr($strCoor, 1); 
		$arrCoor = split( " ", $strCoor);
		foreach ( $arrCoor as $Coor ){
			$newPath= $newPath." ".($Coor+mt_rand(0, $nbAlea));
		}
	}
	//retourne le nouveau Path
	return $newPath;
}

function GetRndAnimate($nomAni,$type)
{
	//initialise le random
	//mt_srand(make_seed());
	switch ($nomAni) {
		case "fx":
			// animation fx
			//<animate attributeName="fx" attributeType="XML" begin="0s" dur="10s" fill="freeze" from="0" to="100"/>
			$from = mt_rand(0,255);
			$to = mt_rand(0,255);
			$begin = mt_rand(0,10)."s";
			$dur = mt_rand(0,255)."s";
			$ani =& new SvgAnimate($nomAni,"indefinite", "XML", $from, $to, $begin, $dur,"freeze");
			break;
		case "fy":
			// animation fy
			//<animate attributeName="fx" attributeType="XML" begin="0s" dur="10s" fill="freeze" from="0" to="100"/>
			$from = mt_rand(0,255);
			$to = mt_rand(0,255);
			$begin = mt_rand(0,10)."s";
			$dur = mt_rand(0,255)."s";
			$ani =& new SvgAnimate($nomAni,"indefinite", "XML", $from, $to, $begin, $dur,"freeze");
			break;
		case "stop-color":
			//<animateColor attributeName="stop-color" attributeType="XML" from="rgb(254,167,29)" to="rgb(105,84,91)" begin="0s" dur="10s" fill="freeze"/>
			$from = GetRndRGBColor(1);
			$to = GetRndRGBColor(1);
			$begin = mt_rand(0,10)."s";
			$dur = mt_rand(0,255)."s";
			$ani =& new SvgAnimateColor($nomAni,"indefinite", "XML", $from, $to, $begin, $dur,"freeze");
			break;
		case "gradientTransform":
			//<animateTransform repeatCount="indefinite" attributeName="gradientTransform" attributeType="XML" type="translate" from="-10,-10" to="30,30" dur="10s" additive="replace" fill="freeze"/>
			$from = -100;
			$to = 100;
			$begin = mt_rand(0,10)."s";
			$dur = mt_rand(0,255)."s";
			$ani =& new SvgAnimateTransform($nomAni,"indefinite", "XML", $from, $to, $begin, $dur,"freeze",$type,"replace");
			break;
	}
	//renvoie l'animation créé
	return $ani;
}
function GetRndAniDegrad($nomAni,$nomDeg,$nbColor,$nbDim,$TypeDegrad)
{
	// Creation du dégradé
	$def =& new SvgDefs("", "");
	//tirage des couleurs du dégradé
	$couleurs = GetRndRGBColor($nbColor);
	//tirage des offset du dégradé
	$offset = GetRndOffset($nbColor,$nbDim);
	//construction du dégradé
	if ($TypeDegrad=="radial"){
		$degrad =& new SvgRadialGradient($nomDeg, $offset, $couleurs);
	} else {
		$degrad =& new SvgLinearGradient($nomDeg, $offset, $couleurs);
	}
	switch ($nomAni) {
		case "all":
			$degrad->addChild(GetRndAnimate("fx",""));
			$degrad->addChild(GetRndAnimate("fy",""));		
			$degrad->addChild(GetRndAnimate("gradientTransform","rotate"));
			$degrad->addChild(GetRndAnimate("gradientTransform","translate"));
			break;
		case "fy":
			$degrad->addChild(GetRndAnimate("fx",""));
			break;
	}
	$def->addChild($degrad);
	return $def;
}
function GetDegrad($nomDeg,$nbColor,$nbDim,$TypeDegrad)
{
	// Creation du dégradé
	$def =& new SvgDefs("", "");
	//tirage des couleurs du dégradé
	$couleurs = GetRndRGBColor($nbColor);
	//tirage des offset du dégradé
	$offset = GetRndOffset($nbColor,$nbDim);
	//construction du dégradé
	if ($TypeDegrad=="radial"){
		$degrad =& new SvgRadialGradient($nomDeg, $offset, $couleurs);
	} else {
		$degrad =& new SvgLinearGradient($nomDeg, $offset, $couleurs);
	}
	$def->addChild($degrad);
	return $def;
}
function GetRndRGBColor($nbColor)
{
	//initialise le random
	//mt_srand(make_seed());
	$Colors = "";
	if ($nbColor==1){
		$c1 = mt_rand(0,255);
		$c2 = mt_rand(0,255);
		$c3 = mt_rand(0,255);
		$Colors = "rgb(" .$c1 ."," .$c2 ."," .$c3 .")";
		return $Colors;
	} else {
		for ($i = 1; $i <= $nbColor; $i++) {
			$c1 = mt_rand(0,255);
			$c2 = mt_rand(0,255);
			$c3 = mt_rand(0,255);
			$Colors = $Colors ."rgb(" .$c1 ."," .$c2 ."," .$c3 .")/";
		}
		$arrColors = split( "/", $Colors);
		$lastSep = array_pop($arrColors);
		return $arrColors;
	}
}
function GetRndOffset($nbOffset=1,$maxOffset=100)
{
	//initialise le random
	//mt_srand(make_seed());
	$Offset="";
	for ($i = 1; $i <= $nbOffset-1; $i++) {
		$n1 = mt_rand(1, $maxOffset);
		$Offset= $Offset."0.".$n1 ."/";
		$maxOffset = $maxOffset - $n1;
	}
	$Offset= $Offset .$maxOffset ."/";
	$arrOffset = split( "/", $Offset);
	$lastSep = array_pop($arrOffset);
	sort($arrOffset);
	return $arrOffset;
}

function make_seed()
{
  list($usec, $sec) = explode(' ', microtime());
  return (float) $sec + ((float) $usec * 100000);
}
?>
