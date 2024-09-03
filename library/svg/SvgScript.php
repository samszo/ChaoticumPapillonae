<?php
/** 
 *  SvgScript.php
 *
 */

class SvgScript extends SvgElement
{
	var $mUrl;
	    
    public function __construct($url="")
    {
        // Call the parent class constructor.
        $this->SvgElement();
        
        $this->mUrl = $url;
        
    }
    
    function printElement()
    {
        if ($this->mUrl != "") {
            print(" <script xlink:href=\"$this->mUrl\" />");
        }
    }
    
}
?>
