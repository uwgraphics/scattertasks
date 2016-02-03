<?php 

include_once(conn.php);

$tasks = $db->query('select * from abstract_tasks')->fetchAll(PDO::FETCH_ASSOC);
$default_data_attrib = $db->query('select * from data_attributes where is_default_attrib_val = 1')->fetchAll(PDO::FETCH_ASSOC);
$data_attribs = $db->query('select * from data_attributes');

$ret = [];
$ret['tasks'] = $tasks;
$ret['default_attribs'] = $default_data_attrib;
$ret['data_attribs'] = $data_attribs;

header('Content-type: application/json');
echo json_encode($ret);

?>