<?php
/** 
 *  SvgDefs.php
 *
 * @since 4.1.1
 */

class SvgDefs extends SvgElement
{
    public function __construct($style="", $transform="", $id="")
    {
        // Call the parent class constructor.
        $this->SvgElement();
        
        $this->mStyle = $style;
        $this->mTransform = $transform;
        $this->mId = $id;
        
    }
    
    function printElement()
    {
        print("<defs ");
        $this->printStyle();
        $this->printTransform();
        $this->printId();
        print(">\n");
        parent::printElement();
        print("</defs>\n");
    }
    
}
?>
