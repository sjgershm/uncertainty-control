<?php
$post_data = json_decode(file_get_contents('php://input'), true);
// The name of your data folder is experiment-specific and should be
// changed accordingly.
$name = "../pilot_6_data/".$post_data['filename'].".csv";
$data = $post_data['filedata'];
// write the file to disk
file_put_contents($name, $data);
?>
