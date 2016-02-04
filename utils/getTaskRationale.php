<?php 

include_once('conn.php');
header('Content-type: application/json');

if (!isset($_GET['av1']) || !isset($_GET['av2'])) {
  echo '[]';
  die;
}

$av1 = intval($_GET['av1']);
$av2 = intval($_GET['av2']);

$query = '
 SELECT r.rationale_id, t.task_id, t.task_name, k.ranking_name, r.rationale, r.strategies
   FROM rationales AS r
   JOIN task_ranking AS k
     ON k.ranking_id = r.ranking_id
   JOIN abstract_tasks AS t
     ON t.task_id = r.task_id
  WHERE attrib_value1 = ?
    AND attrib_value2 = ?
  ORDER BY t.task_id';

try {
  $stmt = $db->prepare($query);
  $stmt->execute(array($av1, $av2));
} catch (PDOException $ex) {
  echo 'error:';
  echo $ex->getMessage();
}

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

?>