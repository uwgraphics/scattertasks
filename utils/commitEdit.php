<?php 

include_once('conn.php');
header('Content-type: application/json');

function need_args() {
  $ret['result'] = "error";
  $ret['message'] = "Missing required arguments.";
  echo json_encode($ret);
  die;
}

$ret = [];
if (!isset($_GET['av1']) || !isset($_GET['av2']) || !isset($_GET['task_id'])) {
  need_args();
} else {
  $av1 = intval($_GET['av1']);
  $av2 = intval($_GET['av2']);
  $task_id = intval($_GET['task_id']);
  
  if (isset($_GET['rank_id'])) {
    $paramToSet = intval($_GET['rank_id']);
    
    $query = '
      INSERT INTO rationales(attrib_value1, attrib_value2, task_id, ranking_id)
      VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE ranking_id = ?';
  } else if (isset($_GET['rationale'])) {
    $paramToSet = $_GET['rationale'];
    
    $query = '
      INSERT INTO rationales(attrib_value1, attrib_value2, task_id, rationale)
      VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE rationale = ?';
  } else if (isset($_GET['strategies'])) {
    $paramToSet = $_GET['strategies'];
    
    $query = '
      INSERT INTO rationales(attrib_value1, attrib_value2, task_id, strategies)
      VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE strategies = ?'; 
  } else {
    need_args();
  }
  
  $ret["result"] = "success";
  try {
    $stmt = $db->prepare($query);
    $stmt->execute(array($av1, $av2, $task_id, $paramToSet, $paramToSet));
  } catch (PDOException $ex) {
    $ret["result"] = 'error';
    $ret["message"] = $ex->getMessage();
  }
  
}
echo json_encode($ret);

?>