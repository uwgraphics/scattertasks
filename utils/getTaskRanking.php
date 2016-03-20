<?php 

include_once('conn.php');
header('Content-type: application/json');

if (!isset($_GET['av1']) || !isset($_GET['a2'])) {
  echo '[]';
  die;
}

$av1 = intval($_GET['av1']);
$a2 = intval($_GET['a2']);


$query = 'SELECT attrib_value_id FROM data_attributes WHERE attribute_id = ?';
try {
  $stmt = $db->prepare($query);
  $stmt->execute(array($a2));
} catch (PDOException $ex) {
  echo 'error:';
  echo $ex->getMessage();
}

// with thanks to <http://stackoverflow.com/questions/8991688/pdo-in-array-statement-and-a-placeholder>
$result = $stmt->fetchAll(PDO::FETCH_NUM);
$av2s = array_map(function($item) { return $item[0]; }, $result);
$placeholders = rtrim(str_repeat('?, ', count($av2s)), ', ') ;

if ($av2s[0] < $av1) {
    $query = "
    SELECT t.task_id, t.task_name, a1.attrib_value_name, k.ranking_name, k.value 
    FROM rationales AS r
    JOIN task_ranking AS k
        ON k.ranking_id = r.ranking_id
    JOIN abstract_tasks AS t
        ON t.task_id = r.task_id
    JOIN data_attributes AS a1
        ON a1.attrib_value_id = r.attrib_value1
    WHERE r.attrib_value2 = ?
    AND r.attrib_value1 IN ($placeholders)
    ORDER BY r.attrib_value1, k.value DESC, t.task_id
    ";
} else {
    $query = "
    SELECT t.task_id, t.task_name, a2.attrib_value_name, k.ranking_name, k.value 
    FROM rationales AS r
    JOIN task_ranking AS k
        ON k.ranking_id = r.ranking_id
    JOIN abstract_tasks AS t
        ON t.task_id = r.task_id
    JOIN data_attributes AS a2
        ON a2.attrib_value_id = r.attrib_value2
    WHERE r.attrib_value1 = ?
    AND r.attrib_value2 IN ($placeholders)
    ORDER BY r.attrib_value2, k.value DESC, t.task_id
    ";
}

try {
  $stmt = $db->prepare($query);
  $stmt->execute(array_merge(array($av1), $av2s));
} catch (PDOException $ex) {
  echo 'error:';
  echo $ex->getMessage();
}

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

?>