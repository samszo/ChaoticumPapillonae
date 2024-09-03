<?php
/** 
 *  SvgLinearGradient.php
 *
 *  class pour cr�er des d�grad�s lin�aires
 *
 * lucky semiosis 29/08/04
 */

class SvgLinearGradient extends SvgElement
{
    var $mId;
    var $mOffset;
    var $mColor;

    public function __construct($id="", $offset, $color)
    {
        // Call the parent class constructor.
        $this->SvgElement();
        
        $this->mId = $id;
        $this->mOffset = $offset;
        $this->mColor  = $color;
       
    }
    
    function printElement()
    {
        print("<linearGradient id=\"$this->mId\">\n");
        
        if (is_array($this->mColor)) { // Print children, start and end tag.
            $ct = count($this->mColor)-1;
			for ($i = 0; $i <= $ct; $i++) {
				$os = $this->mOffset[$i];
				$co = $this->mColor[$i];
           		print("<stop offset=\"" .$os ."\" stop-color=\"" .$co ."\" />\n");
			}
            print("\n");
            print("</linearGradient>\n");
            
        } else { // Print short tag.
			print("<stop offset=\"$this->mOffset%\" stop-color=\"$this->mColor\" />\n");
            print(">\n");           
            print("</linearGradient>\n");
            
        } // end else
        
    }
    function setShape($id, $offset, $color)
    {
        $this->mId = $id;
        $this->mOffset = $offset;
        $this->mColor  = $color;
    }
   
}
?>
