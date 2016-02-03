<?php

$user = '[username]';
$password = '[password]';

$db = new PDO('mysql:host=[server];dbname=scattertasks;charset=utf8', $user, $password);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

?>