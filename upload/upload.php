<?php
$data=$_POST['data'];
$img=base64_decode($data);
file_put_contens('a.jpeg',$img);
?>