CREATE TABLE IF NOT EXISTS `ingot_log` (
	`id` bigint(11) NOT NULL AUTO_INCREMENT,
	`user_id` int(11) NOT NULL,
	`event_type` int(11) NOT NULL,
	`from` int(11) NOT NULL DEFAULT 0,
	`to` int(11) NOT NULL DEFAULT 0,
	`change_value` int(11) NOT NULL,
	`now_value` int(11) NOT NULL,
	`last_insert_time` int(11) NOT NULL,
	PRIMARY KEY(`id`)
) ENGINE=InnoDB AUTO_INCREMENT =1 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `gold_log` (
	`id` bigint(11) NOT NULL AUTO_INCREMENT,
	`user_id` int(11) NOT NULL,
	`event_type` int(11) NOT NULL,
	`from` int(11) NOT NULL DEFAULT 0,
	`to` int(11) NOT NULL DEFAULT 0,
	`change_value` int(11) NOT NULL,
	`now_value` int(11) NOT NULL,
	`last_insert_time` int(11) NOT NULL,
  PRIMARY KEY(`id`)
) ENGINE=InnoDB AUTO_INCREMENT =1 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `route_log` (
	`id` bigint(11) NOT NULL AUTO_INCREMENT,
	`route_user_id` int(11) NOT NULL,
	`route_time` int(11) NOT NULL,
	`hit_index` int(4) NOT NULL,
	`hit_value` int(11) NOT NULL,
	`route_value` int(11) NOT NULL,
	`gift_mask` varchar(64) NOT NULL DEFAULT '',
	`award_state` int(4) NOT NULL,
  PRIMARY KEY(`id`)
) ENGINE=InnoDB AUTO_INCREMENT =1 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `login_log` (
	`id` bigint(11) NOT NULL AUTO_INCREMENT,
	`user_id` int(11) NOT NULL,
	`platform` varchar(256) NOT NULL,
	`channel` varchar(256) NOT NULL,
	`reg_time` int(11) NOT NULL,
	`login_time` int(11) NOT NULL,
	`last_insert_time` int(11) NOT NULL,
  PRIMARY KEY(`id`)
) ENGINE=InnoDB AUTO_INCREMENT =1 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `reg_log` (
	`id` bigint(11) NOT NULL AUTO_INCREMENT,
	`user_id` int(11) NOT NULL,
	`platform` varchar(256) NOT NULL,
	`channel` varchar(256) NOT NULL,
	`reg_time` int(11) NOT NULL,
	`login_time` int(11) NOT NULL,
	`last_insert_time` int(11) NOT NULL,
  PRIMARY KEY(`id`)
) ENGINE=InnoDB AUTO_INCREMENT =1 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `create_room_log` (
	`id` bigint(11) NOT NULL AUTO_INCREMENT,
	`user_id` int(11) NOT NULL,
	`game_type` int(11) NOT NULL,
	`type_index` int(11) NOT NULL DEFAULT 0,
	`rule_index` int(11) NOT NULL DEFAULT 0,
	`create_time` int(11) NOT NULL,
	`roomid` int(11) NOT NULL,
	`last_insert_time` int(11) NOT NULL,
  PRIMARY KEY(`id`)
) ENGINE=InnoDB AUTO_INCREMENT =1 DEFAULT CHARSET=utf8;
//


DROP PROCEDURE IF EXISTS server_update;
CREATE PROCEDURE server_update()
BEGIN
	DECLARE result int(4);
	DECLARE uDbName varchar(128);
	select database() into uDbName;
	SET result = 0;
	SET result = 1;
	SELECT result;
END;
//

CALL server_update();
//

DROP PROCEDURE IF EXISTS server_update;
//