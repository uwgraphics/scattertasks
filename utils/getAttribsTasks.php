<?php 

include_once('conn.php');

$tasks = $db->query('select * from abstract_tasks')->fetchAll(PDO::FETCH_ASSOC);
$default_data_attrib = $db->query('select * from data_attributes where is_default_attrib_val = 1')->fetchAll(PDO::FETCH_ASSOC);
$data_attribs = $db->query('select * from data_attributes')->fetchAll(PDO::FETCH_ASSOC);
$rankings = $db->query('select * from task_ranking')->fetchAll(PDO::FETCH_ASSOC);

$ret = [];
$ret['tasks'] = $tasks;
$ret['default_attribs'] = $default_data_attrib;
$ret['attrib_values'] = $data_attribs;
$ret['rankings'] = $rankings;

header('Content-type: application/json');
echo json_encode($ret);

?>