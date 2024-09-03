<?php
/** 
 *  SvgGroup.php
 *
 * @since 4.1.1
 */

class SvgGroup extends SvgElement
{
    public function __construct($style="", $transform="", $id="", $js="")
    {
        // Call the parent class constructor.
        $this->SvgElement();
        
        $this->mStyle = $style;
        $this->mTransform = $transform;
        $this->mId = $id;
        $this->mJs = $js;
        
    }
    
    function printElement()
    {
        print("<g ");
        $this->printStyle();
        $this->printTransform();
        $this->printId();
        $this->printJs();
        print(">\n");
        parent::printElement();
        print("</g>\n");
    }
}
?>
