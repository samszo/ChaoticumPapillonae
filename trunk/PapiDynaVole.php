<?php

// *** Define the path to the SVG class dir. ***
define("SVG_CLASS_BASE", 
        $_SERVER["DOCUMENT_ROOT"]."/library/svg/");

// Include the class files.
require_once(SVG_CLASS_BASE."Svg.php");

// Create an instance of SvgDocument. All other objects will be added to this
// instance for printing.
// Set the height and width of the viewport.
$svg =& new SvgDocument("100%", "100%");

// Création du groupe des dégradés
	$gDegrad =& new SvgGroup("", "");

// Creation de la tête
	$gTet =& new SvgGroup("", "");
	//tête
	//tirage du point le plus haut
	srand(time());
	$x2 = rand(242, 252);
	//tirage de la largeur
	$x3 = rand(8,25);
	//tirage de la hauteur
	$x4 = rand(8,25);
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
	$a  = rand(500,301);
	$b = rand(400 - 30 + 1,30);
	$c = rand(500 - 301 + 1,301);
	$d = rand(400 - 30 + 1,30);
	$e = rand(500 - 301 + 1,301);
	$f = rand(400 - 30 + 1,30);
	
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
	$x3 = rand(64, 24);
	//tirage de la hauteur
	$hautCor = rand(96, 32);
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
	$x3 = rand(32, 16);
	//tirage de la hauteur
	$x4 = rand(96, 32);
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

/*
	$path=ModifAleaPath("M408.929 201.27 C470.112 182.913 531.295 164.557 528.055 147.279 C524.457 130.002 415.767 87.53 388.055 97.249 C359.983 106.967 360.702 156.278 361.062 205.229",10);
	$path="M".rand(400, 500)." ".rand(200, 300)." 
		C".rand(400, 500)." ".rand(200, 300)." ".rand(500, 600)." ".rand(100, 200)." ".rand(500, 600)." ".rand(100, 200)." 
		C".rand(500, 600)." ".rand(100, 200)." ".rand(400, 500)." ".rand(100, 200)." ".rand(300, 400)." ".rand(100, 200)." 
		C".rand(300, 400)." ".rand(100, 200)." ".rand(300, 400)." ".rand(100, 200)." ".rand(300, 400)." ".rand(200, 300)." ";
*/	
	$path="M408.929 201.27 
	C470.112 182.913 531.295 164.557 528.055 147.279 
	C524.457 130.002 415.767 87.53 388.055 97.249 
	C359.983 106.967 360.702 156.278 361.062 205.229";
	$aile1 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M408.929 201.27 
	C470.112 182.913 531.295 164.557 528.055 147.279 
	C524.457 130.002 415.767 87.53 388.055 97.249 
	C359.983 106.967 360.702 156.278 361.062 205.229;M287 341 
	C287 182.913 287 164.557 287 147.279 
	C287 130.002 287 87.53 287 97.249 
	C287 106.967 287 156.278 287 341;M408.929 201.27 
	C470.112 182.913 531.295 164.557 528.055 147.279 
	C524.457 130.002 415.767 87.53 388.055 97.249 
	C359.983 106.967 360.702 156.278 361.062 205.229";
	$aile1->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile1);
	$gAileG->addChild($aile1);

	$path="M437.001 218.187 
		C465.073 231.864 492.786 245.182 507.901 233.304 
		C523.017 221.426 544.611 152.679 528.055 147.279 
		C511.5 141.88 460.394 171.755 408.929 201.27";
	$aile2 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M437.001 218.187 
		C465.073 231.864 492.786 245.182 507.901 233.304 
		C523.017 221.426 544.611 152.679 528.055 147.279 
		C511.5 141.88 460.394 171.755 408.929 201.27;M287 341 
		C287 231.864 287 245.182 287 233.304 
		C287 221.426 287 152.679 287 147.279 
		C287 141.88 287 171.755 287 341;M437.001 218.187 
		C465.073 231.864 492.786 245.182 507.901 233.304 
		C523.017 221.426 544.611 152.679 528.055 147.279 
		C511.5 141.88 460.394 171.755 408.929 201.27";
	$aile2->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile2);
	$gAileG->addChild($aile2);

	$path="M397.052 257.42 C428.723 251.301 460.394 245.182 479.109 241.223 C497.464 237.264
			515.099 237.264 507.901 233.305 C501.063 229.346 469.032 223.947 437.001 218.188";
	$aile3 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M397.052 257.42 
			C428.723 251.301 460.394 245.182 479.109 241.223 
			C497.464 237.264 515.099 237.264 507.901 233.305 
			C501.063 229.346 469.032 223.947 437.001 218.188;M287 341
			C287 251.301 287 245.182 287 241.223 
			C287 237.264 287 237.264 287 233.305 
			C287 229.346 287 223.947 287 200;M397.052 257.42 
			C428.723 251.301 460.394 245.182 479.109 241.223 
			C497.464 237.264 515.099 237.264 507.901 233.305 
			C501.063 229.346 469.032 223.947 437.001 218.188";
	$aile3->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile3);
	$gAileG->addChild($aile3);

	$path="M303.118 284.775 C357.103 296.293 411.448 307.451 440.96 300.252 C470.472 293.054
			486.308 248.421 479.109 241.223 C471.551 234.384 434.122 245.902 397.052 257.42";
	$aile4 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M303.118 284.775 C357.103 296.293 411.448 307.451 440.96 300.252 C470.472 293.054
			486.308 248.421 479.109 241.223 C471.551 234.384 434.122 245.902 397.052 257.42;M287 341 
		C287 296.293 287 307.451 287 300.252 
		C287 293.054 287 248.421 287 241.223 
		C287 234.384 287 245.902 287 200;M303.118 284.775 C357.103 296.293 411.448 307.451 440.96 300.252 C470.472 293.054
			486.308 248.421 479.109 241.223 C471.551 234.384 434.122 245.902 397.052 257.42";
	$aile4->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile4);
	$gAileG->addChild($aile4);

	$path="M303.118 284.775 C316.434 283.695 374.738 268.578 397.052 257.42 C419.366 246.262
			434.842 227.545 437.001 218.187 C438.801 208.829 421.525 203.43 408.929 201.27
			C396.332 199.11 376.178 194.791 361.062 205.229 C345.586 215.667 326.512 252.021
			317.154 264.259 C307.437 276.497 289.802 285.854 303.118 284.775 z";
	$aile5 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M303.118 284.775 C316.434 283.695 374.738 268.578 397.052 257.42 C419.366 246.262
			434.842 227.545 437.001 218.187 C438.801 208.829 421.525 203.43 408.929 201.27
			C396.332 199.11 376.178 194.791 361.062 205.229 C345.586 215.667 326.512 252.021
			317.154 264.259 C307.437 276.497 289.802 285.854 303.118 284.775 z;M287 341 
		C287 283.695 287 268.578 287 257.42 
		C287 246.262 287 227.545 287 218.187 
		C287 208.829 287 203.43 287 201.27
		C287 199.11 287 194.791 287 205.229 
		C287 215.667 287 252.021 287 264.259 
		C287 276.497 287 285.854 287 341 z;M303.118 284.775 C316.434 283.695 374.738 268.578 397.052 257.42 C419.366 246.262
			434.842 227.545 437.001 218.187 C438.801 208.829 421.525 203.43 408.929 201.27
			C396.332 199.11 376.178 194.791 361.062 205.229 C345.586 215.667 326.512 252.021
			317.154 264.259 C307.437 276.497 289.802 285.854 303.118 284.775 z";
	$aile5->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile5);
	$gAileG->addChild($aile5);

	$path="M326.152 290.174 C367.901 295.933 410.009 301.693 429.083 303.132 C448.158 304.932
			461.834 303.852 440.96 300.252 C420.086 297.013 361.422 289.814 303.118 282.976";
	$aile6 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M326.152 290.174 C367.901 295.933 410.009 301.693 429.083 303.132 C448.158 304.932
			461.834 303.852 440.96 300.252 C420.086 297.013 361.422 289.814 303.118 282.976;M287 341 
		C287 295.933 287 301.693 287 303.132 
		C287 304.932 287 303.852 287 300.252 
		C287 297.013 287 289.814 287 341;M326.152 290.174 C367.901 295.933 410.009 301.693 429.083 303.132 C448.158 304.932
			461.834 303.852 440.96 300.252 C420.086 297.013 361.422 289.814 303.118 282.976";
	$aile6->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile6);
	$gAileG->addChild($aile6);

	//courbe intérieure basse
	$path="M339.108 302.412 C407.849 331.207 476.95 360.002 492.066 360.361 C506.822 360.361
			456.795 315.009 429.083 303.132 C401.371 291.614 363.582 290.894 326.152 290.174";
	$aile7 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M339.108 302.412 C407.849 331.207 476.95 360.002 492.066 360.361 C506.822 360.361
			456.795 315.009 429.083 303.132 C401.371 291.614 363.582 290.894 326.152 290.174;M287 341 
		C287 331.207 287 360.002 287 360.361 
		C287 360.361 287 315.009 287 303.132 
		C287 291.614 287 290.894 287 341;M339.108 302.412 C407.849 331.207 476.95 360.002 492.066 360.361 C506.822 360.361
			456.795 315.009 429.083 303.132 C401.371 291.614 363.582 290.894 326.152 290.174";
	$aile7->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile7);
	$gAileG->addChild($aile7);

	$path="M383.016 338.405 C407.849 367.92 432.683 397.795 451.037 401.394 C469.032 404.993
			510.421 376.918 492.066 360.361 C473.351 343.804 406.049 322.927 339.108 302.412";
	$aile8 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M383.016 338.405 C407.849 367.92 432.683 397.795 451.037 401.394 C469.032 404.993
			510.421 376.918 492.066 360.361 C473.351 343.804 406.049 322.927 339.108 302.412;M287 341 
		C287 367.92 287 397.795 287 401.394 
		C287 404.993 287 376.918 287 360.361 
		C287 343.804 287 322.927 287 341;M383.016 338.405 C407.849 367.92 432.683 397.795 451.037 401.394 C469.032 404.993
			510.421 376.918 492.066 360.361 C473.351 343.804 406.049 322.927 339.108 302.412";
	$aile8->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile8);
	$gAileG->addChild($aile8);

	$path="M374.019 368.28 C392.014 402.114 410.009 435.948 422.965 441.346 C435.922 446.745
			457.516 418.311 451.037 401.394 C444.199 384.117 413.608 361.441 383.016 338.405";
	$aile9 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M374.019 368.28 C392.014 402.114 410.009 435.948 422.965 441.346 C435.922 446.745
			457.516 418.311 451.037 401.394 C444.199 384.117 413.608 361.441 383.016 338.405;M287 341 
		C287 402.114 287 435.948 287 441.346 
		C287 446.745 287 418.311 287 401.394 
		C287 384.117 287 361.441 287 341;M374.019 368.28 C392.014 402.114 410.009 435.948 422.965 441.346 C435.922 446.745
			457.516 418.311 451.037 401.394 C444.199 384.117 413.608 361.441 383.016 338.405";
	$aile9->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile9);
	$gAileG->addChild($aile9);

	$path="M357.104 390.236 C355.664 421.91 354.225 453.944 365.021 462.223 C376.178 470.861
			421.525 456.824 422.965 441.346 C424.404 425.509 399.212 397.075 374.019 368.28";
	$aile10 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M357.104 390.236 C355.664 421.91 354.225 453.944 365.021 462.223 C376.178 470.861
			421.525 456.824 422.965 441.346 C424.404 425.509 399.212 397.075 374.019 368.28;M287 341 
	C287 421.91 287 453.944 287 462.223 
	C287 470.861 287 456.824 287 441.346 
	C287 425.509 287 397.075 287 341;M357.104 390.236 C355.664 421.91 354.225 453.944 365.021 462.223 C376.178 470.861
			421.525 456.824 422.965 441.346 C424.404 425.509 399.212 397.075 374.019 368.28";
	$aile10->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile10);
	$gAileG->addChild($aile10);

	$path="M303.118 288.015 C314.635 353.163 326.152 418.312 331.91 447.466 C338.029 476.261
			339.468 460.064 338.029 462.224 C336.589 464.744 319.674 461.144 323.993 461.144
			C328.672 461.144 359.623 474.102 365.021 462.224 C370.419 450.346 363.941
			420.471 357.104 390.237";
	$aile11 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M303.118 288.015 C314.635 353.163 326.152 418.312 331.91 447.466 C338.029 476.261
			339.468 460.064 338.029 462.224 C336.589 464.744 319.674 461.144 323.993 461.144
			C328.672 461.144 359.623 474.102 365.021 462.224 C370.419 450.346 363.941
			420.471 357.104 390.237;M287 341 
			C287 353.163 287 418.312 287 447.466 
			C287 476.261 287 460.064 287 462.224 
			C287 464.744 287 461.144 287 461.144
			C287 461.144 287 474.102 287 462.224 
			C287 450.346 287 420.471 287 341;M303.118 288.015 C314.635 353.163 326.152 418.312 331.91 447.466 C338.029 476.261
			339.468 460.064 338.029 462.224 C336.589 464.744 319.674 461.144 323.993 461.144
			C328.672 461.144 359.623 474.102 365.021 462.224 C370.419 450.346 363.941
			420.471 357.104 390.237";
	$aile11->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile11);
	$gAileG->addChild($aile11);

	$path="M303.118 287.654 C308.157 304.571 345.226 376.919 357.103 390.236 C368.98 403.554
			369.7 376.919 374.019 368.28 C378.338 359.641 388.775 349.203 383.017 338.405
			C377.259 327.247 348.467 310.33 339.109 302.412 C329.392 294.134 331.911 293.413
			326.152 290.174 C320.034 286.935 298.08 271.098 303.118 287.654 z";
	$aile12 = new SvgPath("", "stroke-width:3","", "fill=\"url(#".$nomDeg.")\" ");
	// anime l'aile
	$path = "M303.118 287.654 C308.157 304.571 345.226 376.919 357.103 390.236 C368.98 403.554
			369.7 376.919 374.019 368.28 C378.338 359.641 388.775 349.203 383.017 338.405
			C377.259 327.247 348.467 310.33 339.109 302.412 C329.392 294.134 331.911 293.413
			326.152 290.174 C320.034 286.935 298.08 271.098 303.118 287.654 z;M287 341 
			C287 304.571 287 376.919 287 390.236 
			C287 403.554 287 376.919 287 368.28 
			C287 359.641 287 349.203 287 338.405
			C287 327.247 287 310.33 287 302.412 
			C287 294.134 287 293.413 287 290.174 
			C287 286.935 287 271.098 287 341 z;M303.118 287.654 C308.157 304.571 345.226 376.919 357.103 390.236 C368.98 403.554
			369.7 376.919 374.019 368.28 C378.338 359.641 388.775 349.203 383.017 338.405
			C377.259 327.247 348.467 310.33 339.109 302.412 C329.392 294.134 331.911 293.413
			326.152 290.174 C320.034 286.935 298.08 271.098 303.118 287.654 z";
	$aile12->addChild(GetRndAnimate("d_aile_vole",$path));
	// Ajoute l'enfant
	$gAileD->addChild($aile12);
	$gAileG->addChild($aile12);

// Place les graphiques dans l'ordre des niveaux
$gDegrad->addParent($svg);
$gQue->addParent($svg);
$gCor->addParent($svg);
$gTet->addParent($svg);
$gAnt1->addParent($svg);
$gAnt2->addParent($svg);
$gAileD->addParent($svg);
$gAileG->addParent($svg);

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
	$newPath= "M".($arrCoorM[0]+rand(0, $nbAlea));
	$newPath= $newPath." ".($arrCoorM[1]+rand(0, $nbAlea));
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
			$newPath= $newPath." ".($Coor+rand(0, $nbAlea));
		}
	}
	//retourne le nouveau Path
	return $newPath;
}

function GetRndAnimate($nomAni,$type)
{
	switch ($nomAni) {		
		case "d_aile_vole":
			// animation d'un path
			/*<animate begin="0s" dur="3s" repeatCount="indefinite" attributeName="d" 
			values="M287 341 C287 461.144 287 474.102 287 462.224;
				M303.118 288.015 C314.635 353.163 326.152 418.312 331.91 447.466 " 
				additive="replace" fill="freeze"/>
			*/
			$from = "";
			$to = "";
			$begin = "0s";
			$dur = "3s";
			$values =" values=\"".$type;
			//création des valeurs de vole		
			$ani =& new SvgAnimate("d","indefinite", "XML", $from, $to, $begin, $dur,"freeze\" additive=\"replace\" ".$values);
			break;
		case "fx":
			// animation fx
			//<animate attributeName="fx" attributeType="XML" begin="0s" dur="10s" fill="freeze" from="0" to="100"/>
			$from = rand(0,255);
			$to = rand(0,255);
			$begin = rand(0,10)."s";
			$dur = rand(0,255)."s";
			$ani =& new SvgAnimate($nomAni,"indefinite", "XML", $from, $to, $begin, $dur,"freeze");
			break;
		case "fy":
			// animation fy
			//<animate attributeName="fx" attributeType="XML" begin="0s" dur="10s" fill="freeze" from="0" to="100"/>
			$from = rand(0,255);
			$to = rand(0,255);
			$begin = rand(0,10)."s";
			$dur = rand(0,255)."s";
			$ani =& new SvgAnimate($nomAni,"indefinite", "XML", $from, $to, $begin, $dur,"freeze");
			break;
		case "stop-color":
			//<animateColor attributeName="stop-color" attributeType="XML" from="rgb(254,167,29)" to="rgb(105,84,91)" begin="0s" dur="10s" fill="freeze"/>
			$from = GetRndRGBColor(1);
			$to = GetRndRGBColor(1);
			$begin = rand(0,10)."s";
			$dur = rand(0,255)."s";
			$ani =& new SvgAnimateColor($nomAni,"indefinite", "XML", $from, $to, $begin, $dur,"freeze");
			break;
		case "gradientTransform":
			//<animateTransform repeatCount="indefinite" attributeName="gradientTransform" attributeType="XML" type="translate" from="-10,-10" to="30,30" dur="10s" additive="replace" fill="freeze"/>
			$from = -100;
			$to = 100;
			$begin = rand(0,10)."s";
			$dur = rand(0,255)."s";
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
	$Colors = "";
	if ($nbColor==1){
		$c1 = rand(0,255);
		$c2 = rand(0,255);
		$c3 = rand(0,255);
		$Colors = "rgb(" .$c1 ."," .$c2 ."," .$c3 .")";
		return $Colors;
	} else {
		for ($i = 1; $i <= $nbColor; $i++) {
			$c1 = rand(0,255);
			$c2 = rand(0,255);
			$c3 = rand(0,255);
			$Colors = $Colors ."rgb(" .$c1 ."," .$c2 ."," .$c3 .")/";
		}
		$arrColors = split( "/", $Colors);
		$lastSep = array_pop($arrColors);
		return $arrColors;
	}
}
function GetRndOffset($nbOffset=1,$maxOffset=100)
{
	$Offset="";
	for ($i = 1; $i <= $nbOffset-1; $i++) {
		$n1 = rand(1, $maxOffset);
		$Offset= $Offset."0.".$n1 ."/";
		$maxOffset = $maxOffset - $n1;
	}
	$Offset= $Offset .$maxOffset ."/";
	$arrOffset = split( "/", $Offset);
	$lastSep = array_pop($arrOffset);
	sort($arrOffset);
	return $arrOffset;
}
?>
