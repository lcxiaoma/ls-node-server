
CREATE TABLE IF NOT EXISTS `accounts` (
  `account` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `games` (
  `room_uuid` char(20) NOT NULL,
  `game_index` smallint(6) NOT NULL,
  `base_info` varchar(1024) NOT NULL,
  `create_time` int(11) NOT NULL,
  `snapshots` char(255) DEFAULT NULL,
  `action_records` varchar(2048) DEFAULT NULL,
  `result` char(255) DEFAULT NULL,
  PRIMARY KEY (`room_uuid`,`game_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `games_archive` (
  `room_uuid` char(20) NOT NULL,
  `game_index` smallint(6) NOT NULL,
  `base_info` varchar(1024) NOT NULL,
  `create_time` int(11) NOT NULL,
  `snapshots` char(255) DEFAULT NULL,
  `action_records` varchar(2048) DEFAULT NULL,
  `result` char(255) DEFAULT NULL,
  PRIMARY KEY (`room_uuid`,`game_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `guests` (
  `guest_account` varchar(255) NOT NULL,
  PRIMARY KEY (`guest_account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_id` int(4) NOT NULL,
  `sort` int(4) NOT NULL,
  `loop_times` int(4) NOT NULL,
  `start_at` int(11) NOT NULL,
  `end_at` int(11) NOT NULL,
  `msgtext` varchar(2048) NOT NULL,
  `disabled` int(4) NOT NULL,
  `created_at` int(11) NOT NULL,
  `author` int(11) NOT NULL,
  `updated_author` int(11),
  `updated_at` int(11),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `rooms` (
  `uuid` char(20) NOT NULL,
  `id` char(8) NOT NULL,
  `base_info` varchar(256) NOT NULL DEFAULT '0',
  `create_time` int(11) NOT NULL,
  `num_of_turns` int(11) NOT NULL DEFAULT '0',
  `next_button` int(11) NOT NULL DEFAULT '0',
  `seat_info` varchar(2048) NOT NULL DEFAULT '',
  `score_info` varchar(1024) NOT NULL DEFAULT '',
  `ip` varchar(16) DEFAULT NULL,
  `port` int(11) DEFAULT '0',
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `rooms_archive` (
  `uuid` char(20) NOT NULL,
  `id` char(8) NOT NULL,
  `base_info` varchar(256) NOT NULL DEFAULT '0',
  `create_time` int(11) NOT NULL,
  `num_of_turns` int(11) NOT NULL DEFAULT '0',
  `next_button` int(11) NOT NULL DEFAULT '0',
  `seat_info` varchar(2048) NOT NULL DEFAULT '',
  `score_info` varchar(1024) NOT NULL DEFAULT '',
  `ip` varchar(16) DEFAULT NULL,
  `port` int(11) DEFAULT '0',
  `zip_reason` int(4) DEFAULT '0',
  `zip_time` int(11) DEFAULT '0',
  `user_info` varchar(1024) NOT NULL DEFAULT '',
  PRIMARY KEY (`uuid`,`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `users` (
  `userid` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `account` varchar(64) NOT NULL DEFAULT '' COMMENT '账号',
  `name` varchar(256) DEFAULT NULL COMMENT '用户昵称',
  `sex` int(1) DEFAULT NULL,
  `headimg` varchar(256) DEFAULT NULL,
  `lv` smallint(6) DEFAULT '1' COMMENT '用户等级',
  `exp` int(11) DEFAULT '0' COMMENT '用户经验',
  `coins` int(11) DEFAULT '0' COMMENT '用户金币',
  `gems` int(11) DEFAULT '0' COMMENT '用户宝石',
  `roomid` varchar(8) DEFAULT NULL,
  `history` varchar(4096) DEFAULT NULL,
  PRIMARY KEY (`userid`),
  UNIQUE KEY `account` (`account`)
) ENGINE=InnoDB AUTO_INCREMENT=10000 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `games_poker` (
  `room_uuid` char(20) NOT NULL,
  `game_index` smallint(6) NOT NULL,
  `create_time` int(11) NOT NULL,
  `base_info` varchar(2048) DEFAULT NULL,
  `folds` varchar(2048) DEFAULT NULL,
  `actions` varchar(1024) DEFAULT NULL,
  `result` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`room_uuid`,`game_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `games_poker_archive` (
  `room_uuid` char(20) NOT NULL,
  `game_index` smallint(6) NOT NULL,
  `create_time` int(11) NOT NULL,
  `base_info` varchar(2048) DEFAULT NULL,
  `folds` varchar(2048) DEFAULT NULL,
  `actions` varchar(1024) DEFAULT NULL,
  `result` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`room_uuid`,`game_index`,`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;
//

CREATE TABLE IF NOT EXISTS `pay_order` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `pay_platform` varchar(32) NOT NULL,
  `pay_id` varchar(64) NOT NULL,
  `order_id` varchar(64),
  `good_sn` varchar(32) NOT NULL,
  `order_money` int(4) NOT NULL,
  `good_count` int(4) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` int(4) NOT NULL,
  `update_time` int(11) NOT NULL,
  `app_record_time` varchar(32),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `advice_info` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `advice_type` int(4) NOT NULL,
  `advice_game` varchar(16) NOT NULL,
  `advice_platform` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `msg` varchar(1024) NOT NULL,
  `create_time` int(11) NOT NULL,
  `status` int(4) NOT NULL,
  `msg_back` varchar(1024),
  `update_time` int(11),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
//


CREATE TABLE IF NOT EXISTS `mail` (
  `mail_id` bigint(11) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(11) NOT NULL,
  `sender_id` bigint(11) NOT NULL,
  `sender_name` varchar(64) NOT NULL,
  `mail_type` int(4) NOT NULL,
  `mail_tittle` varchar(1024) NOT NULL,
  `mail_content` varchar(2048) NOT NULL,
  `mail_key` varchar(64) NOT NULL,
  `mail_attach` varchar(1024) NOT NULL,
  `send_time` int(11) NOT NULL,
  `end_time` int(11) NOT NULL,
  `status` int(4) not null,
  PRIMARY KEY (`mail_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `mail_archive` (
  `mail_id` bigint(11) NOT NULL,
  `user_id` bigint(11) NOT NULL,
  `sender_id` bigint(11) NOT NULL,
  `sender_name` varchar(64) NOT NULL,
  `mail_type` int(4) NOT NULL,
  `mail_tittle` varchar(1024) NOT NULL,
  `mail_content` varchar(2048) NOT NULL,
  `mail_key` varchar(64) NOT NULL,
  `mail_attach` varchar(1024) NOT NULL,
  `send_time` int(11) NOT NULL,
  `end_time` int(11) NOT NULL,
  `status` int(4) not null,
  `archive_reason` int(4),
  `archive_time` int(11),
  PRIMARY KEY (`mail_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `route_config` (
	`id` int(4) NOT NULL,
	`route_index` int(4) NOT NULL,
	`route_value` int(11) NOT NULL,
	`route_ood` int(11) NOT NULL,
	`max_hit` int(11) NOT NULL,
	`ingot_value` int(11) NOT NULL DEFAULT 0,
	`gold_value` int(11) NOT NULL DEFAULT 0,
	`today_hit` int(11) NOT NULL DEFAULT 0,
	`today_time` int(11) NOT NULL DEFAULT 0,
	`route_name` varchar(128) NOT NULL DEFAULT '',
  PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `user_extro_info` (
	`user_id` int(11) NOT NULL,
	`daily_value` MEDIUMBLOB,
	`statistic` MEDIUMBLOB,
	`route_time` int(11) DEFAULT 0,
	`check_in_time` int(11) DEFAULT 0,
  PRIMARY KEY(`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT =1 DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `global_settings` (
	`global_key` varchar(64) NOT NULL,
	`global_int_value` int(11),
	`global_str_value` varchar(256),
  PRIMARY KEY(`global_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

CREATE TABLE IF NOT EXISTS `platform_invitaton` (
  `platform_key` varchar(64) NOT NULL,
  `platform_award` varchar(1024),
  `invitation_code` varchar(64),
  PRIMARY KEY(`platform_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
//

DROP PROCEDURE IF EXISTS server_update;
CREATE PROCEDURE server_update()
BEGIN
	DECLARE result int(4);
	DECLARE uDbName varchar(128);
	select database() into uDbName;
	SET result = 0;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'accounts' and column_name = 'reg_time') THEN
		ALTER TABLE `accounts` ADD COLUMN  `reg_time` int(11) DEFAULT 0 AFTER `password`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'games_poker' and column_name = 'holds') THEN
		ALTER TABLE `games_poker` ADD COLUMN  `holds` varchar(1024) DEFAULT '' AFTER `base_info`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'rooms' and column_name = 'server_type') THEN
		ALTER TABLE `rooms` ADD COLUMN  `server_type` int(11) DEFAULT '0' AFTER `port`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'rooms' and column_name = 'server_id') THEN
		ALTER TABLE `rooms` ADD COLUMN  `server_id` int(11) DEFAULT '0' AFTER `server_type`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'games_poker' and column_name = 'statistic') THEN
		ALTER TABLE `games_poker` ADD COLUMN  `statistic` varchar(1024) DEFAULT '' AFTER `result`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'games_poker' and column_name = 'change_info') THEN
		ALTER TABLE `games_poker` ADD COLUMN  `change_info` varchar(1024) DEFAULT '' AFTER `statistic`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'games_poker_archive' and column_name = 'holds') THEN
		ALTER TABLE `games_poker_archive` ADD COLUMN  `holds` varchar(1024) DEFAULT '' AFTER `base_info`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'games_poker_archive' and column_name = 'statistic') THEN
		ALTER TABLE `games_poker_archive` ADD COLUMN  `statistic` varchar(1024) DEFAULT '' AFTER `result`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'games_poker_archive' and column_name = 'change_info') THEN
		ALTER TABLE `games_poker_archive` ADD COLUMN  `change_info` varchar(1024) DEFAULT '' AFTER `statistic`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'platform') THEN
		ALTER TABLE `users` ADD COLUMN  `platform` varchar(256) DEFAULT '' AFTER `history`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'login_platform') THEN
		ALTER TABLE `users` ADD COLUMN  `login_platform` varchar(256) DEFAULT '' AFTER `platform`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'channel') THEN
		ALTER TABLE `users` ADD COLUMN  `channel` varchar(256) DEFAULT '' AFTER `login_platform`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'reg_time') THEN
		ALTER TABLE `users` ADD COLUMN  `reg_time` int(11) DEFAULT 0 AFTER `channel`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'login_time') THEN
		ALTER TABLE `users` ADD COLUMN  `login_time` int(11) DEFAULT 0 AFTER `reg_time`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'logout_time') THEN
		ALTER TABLE `users` ADD COLUMN  `logout_time` int(11) DEFAULT 0 AFTER `login_time`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'online_time') THEN
		ALTER TABLE `users` ADD COLUMN  `online_time` int(11) DEFAULT 0 AFTER `logout_time`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'rooms' and column_name = 'change_info') THEN
		ALTER TABLE `rooms` ADD COLUMN  `change_info` varchar(1024) DEFAULT '' AFTER `port`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'rooms' and column_name = 'watch_seat') THEN
		ALTER TABLE `rooms` ADD COLUMN  `watch_seat` varchar(2048) DEFAULT '' AFTER `server_id`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'rooms_archive' and column_name = 'server_type') THEN
		ALTER TABLE `rooms_archive` ADD COLUMN  `server_type` int(11)  AFTER `user_info`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'lock') THEN
		ALTER TABLE `users` ADD COLUMN  `lock` int(4) DEFAULT 0 AFTER `online_time`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'agent') THEN
		ALTER TABLE `users` ADD COLUMN  `agent` int(4) DEFAULT 0  AFTER `lock`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'lucky') THEN
		ALTER TABLE `users` ADD COLUMN  `lucky` int(4) DEFAULT 0  AFTER `agent`;
	END IF;
  IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'users' and column_name = 'invitation_code') THEN
    ALTER TABLE `users` ADD COLUMN  `invitation_code` varchar(64) DEFAULT ''  AFTER `lucky`;
  END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'user_extro_info' and column_name = 'share_time') THEN
		ALTER TABLE `user_extro_info` ADD COLUMN  `share_time` int(11) DEFAULT 0  AFTER `check_in_time`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'pay_order' and column_name = 'gold') THEN
		ALTER TABLE `pay_order` ADD COLUMN  `gold` int(11) DEFAULT 0  AFTER `order_money`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'pay_order' and column_name = 'extro_gold') THEN
		ALTER TABLE `pay_order` ADD COLUMN  `extro_gold` int(11) DEFAULT 0  AFTER `gold`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'pay_order' and column_name = 'ingot') THEN
		ALTER TABLE `pay_order` ADD COLUMN  `ingot` int(11) DEFAULT 0  AFTER `extro_gold`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'pay_order' and column_name = 'extro_ingot') THEN
		ALTER TABLE `pay_order` ADD COLUMN  `extro_ingot` int(11) DEFAULT 0  AFTER `ingot`;
	END IF;
	IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'user_extro_info' and column_name = 'daily_clear_time') THEN
		ALTER TABLE `user_extro_info` ADD COLUMN  `daily_clear_time` int(11) DEFAULT 0  AFTER `share_time`;
	END IF;
  IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'global_settings' and column_name = 'global_str_value2') THEN
    ALTER TABLE `global_settings` ADD COLUMN  `global_str_value2` varchar(1024) DEFAULT ''  AFTER `global_str_value`;
  END IF;
  IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'rooms' and column_name = 'agent_user_id') THEN
    ALTER TABLE `rooms` ADD COLUMN  `agent_user_id` int(11) DEFAULT 0  AFTER `watch_seat`;
  END IF;
  IF NOT EXISTS (select * from information_schema.columns where table_schema = uDbName and table_name = 'rooms' and column_name = 'agent_expires_time') THEN
    ALTER TABLE `rooms` ADD COLUMN  `agent_expires_time` int(11) DEFAULT 0  AFTER `agent_user_id`;
  END IF;
	SET result = 1;
	SELECT result;
END;
//

CALL server_update();
//

DROP PROCEDURE IF EXISTS server_update;
//


DROP FUNCTION IF EXISTS CHECK_ACCOUNT;
CREATE FUNCTION CHECK_ACCOUNT
(account varchar(64))
RETURNS int(4)
BEGIN
	declare result int(4);
	select count(users.userid) into result from users where users.account = account;
RETURN result;
END;
//

DROP PROCEDURE IF EXISTS get_user_info;
CREATE PROCEDURE get_user_info(IN in_uid int(11))
BEGIN
	DECLARE result int(4);
	SET result =0;
	SET result =1;
	SELECT result;
END;
//

DROP PROCEDURE IF EXISTS check_user;
CREATE PROCEDURE check_user(IN in_uname varchar(64),IN in_pass varchar(64))
BEGIN
	DECLARE result int(4);
	DECLARE userId int(11);
	SET result =0;
	SET userId =0;
	SELECT count(account) from accounts where account = in_uname and password = in_pass;
	SELECT result,userId;
END;
//

DROP PROCEDURE IF EXISTS lose_ingot;
CREATE PROCEDURE lose_ingot(IN in_userId int(11),IN in_loseingot int(11))
BEGIN
	declare status int(4);
  declare result int(4);
  declare old_ingot int(11);
	set status =0;
	set old_ingot =0;
	set result =0;
	select count(userid),gems into status,old_ingot from users where userid = in_userId;
	
	if status>0 THEN
		if old_ingot < in_loseingot THEN
			set result = -2;
		ELSE
			update users set gems = gems -in_loseingot where userid = in_userId;
			select gems into old_ingot from users where users.userid = in_userId;
			set result =1;
		end IF;
	ELSE
		set result =-1;
	end if;
	select result,old_ingot as now_ingot;
END;
//

DROP PROCEDURE IF EXISTS lose_gold;
CREATE PROCEDURE lose_gold(IN in_userId int(11),IN in_losegold int(11))
BEGIN
  declare status int(4);
  declare result int(4);
  declare old_gold int(11);
	set status =0;
	set old_gold =0;
	set result =0;
	select count(userid),coins into status,old_gold from users where userid = in_userId;
	
	if status>0 THEN
		if old_gold < in_losegold THEN
			set result = -2;
		ELSE
			update users set coins = coins -in_losegold where userid = in_userId;
			select coins into old_gold from users where userid = in_userId;
			set result =1;
		end IF;
	ELSE
		set result =-1;
	end if;
	select result,old_gold as now_gold;
END;
//

DROP PROCEDURE IF EXISTS poker_dump_game_base;
CREATE PROCEDURE poker_dump_game_base(
	IN in_uuid varchar(20),
	IN in_game_index smallint(6),
	IN in_create_time int(11),
	IN in_base_info varchar(2048),
	IN in_holds varchar(1024),
	IN in_folds varchar(2048),
	IN in_action varchar(1024),
	IN in_result  varchar(255),
	IN in_statistic varchar(1024),
	IN in_change_info varchar(1024)
)
BEGIN
	declare status int(4);
	declare result int(4);
	set status =0;
	set result =0;
	
	select count(games_poker.room_uuid) into status from games_poker where games_poker.room_uuid = in_uuid and game_index = in_game_index;

	if status <> 0 then
			set result =-1;
	ELSE
			INSERT into games_poker(room_uuid,game_index,create_time,base_info,holds,folds,actions,result,statistic,change_info)
			values(in_uuid,in_game_index,in_create_time,in_base_info,in_holds,in_folds,in_action,in_result,in_statistic,in_change_info);
			set result = 1;
	end if;
	
	select result;
END;
//

DROP PROCEDURE IF EXISTS poker_update_game_info;
CREATE PROCEDURE poker_update_game_info(
	IN in_uuid varchar(20),
	IN in_game_index smallint(6),
	IN in_holds varchar(1024),
	IN in_folds varchar(2048),
	IN in_action varchar(1024),
	IN in_change_info varchar(1024)
)
BEGIN
	declare status int(4);
	declare result int(4);
	set status =0;
	set result =0;
	
	select count(games_poker.room_uuid) into status from games_poker where games_poker.room_uuid = in_uuid;

	if status <> 0 then
			update games_poker set holds = in_holds,folds = in_folds,actions = in_action, change_info = in_change_info where room_uuid = in_uuid and game_index = in_game_index;
			set result =1;
	ELSE
			set result =-1;
	end if;
	
	select result;
END;
//

DROP PROCEDURE IF EXISTS poker_load_game;
CREATE PROCEDURE poker_load_game(
	IN in_room_id varchar(20)
)
BEGIN
	select uuid ,id, rooms.base_info as room_base_info,rooms.create_time,num_of_turns, next_button,
	seat_info,score_info,rooms.change_info as room_change_info,watch_seat,
	games_poker.base_info as gamebaseinfo,
	actions,result,statistic,games_poker.change_info as change_info,
	holds,folds,agent_user_id
	from rooms left join games_poker ON rooms.uuid = games_poker.room_uuid and  rooms.num_of_turns = games_poker.game_index
	where id = in_room_id;
END;
//
DROP PROCEDURE IF EXISTS change_room_info;
CREATE PROCEDURE change_room_info(
	IN in_roomid int(11),
	IN in_ip varchar(16),
	IN in_port int(11),
	IN in_serverid int(11)
)
BEGIN
	DECLARE status int(4);
	DECLARE result int(4);
	set result =0;
	set status =0;
	select count(id) into status from rooms where rooms.id = in_roomid;
	if status <> 0 THEN
		update rooms set rooms.ip = in_ip,rooms.`port` = in_port,server_id = in_serverid;
		set result =1;
	end IF;
	select result;
END;
//

DROP PROCEDURE IF EXISTS update_room_info;
CREATE PROCEDURE update_room_info(
	IN in_room_uuid varchar(20),
	IN in_game_index int(11),
	IN in_less_begin int(4),
	IN in_score_list varchar(1024),
	IN in_change_info varchar(1024)
)
BEGIN
	declare status int(4);
	declare result int(4);
	set status =0;
	set result =0;
	
	select count(rooms.uuid) into status from rooms where rooms.uuid = in_room_uuid;

	if status <> 0 then
			update rooms set num_of_turns = in_game_index,next_button = in_less_begin ,score_info = in_score_list,change_info = in_change_info where rooms.uuid = in_room_uuid;
			set result =1;
	ELSE
			set result =-1;
	end if;
	
	select result;
END;
//

DROP PROCEDURE IF EXISTS add_result_achive_game;
CREATE PROCEDURE add_result_achive_game(
	IN in_force int(4),
	IN in_room_uuid varchar(20),
	IN in_game_index int(4),
	IN in_create_time int(11),
	IN in_result varchar(1024)
)
BEGIN
	declare status int(4);
	declare result int(4);
	set status =0;
	set result =0;
	if in_force <>0 THEN
		delete from games_poker where room_uuid = in_room_uuid and game_index = in_game_index;
		set result =1;
		select result;
	ELSE
		select count(room_uuid) into status from games_poker_archive where room_uuid = in_room_uuid and game_index = in_game_index;
		
		if status <> 0 THEN
			set result =-1;
		ELSE
			select count(games_poker.room_uuid) into status from games_poker where games_poker.room_uuid = in_room_uuid and games_poker.game_index = in_game_index;
			if status <>0 THEN
				INSERT into games_poker_archive (SELECT * from games_poker where games_poker.room_uuid = in_room_uuid and games_poker.game_index = in_game_index);
				delete from games_poker where games_poker.room_uuid = in_room_uuid and games_poker.game_index = in_game_index;
				update games_poker_archive set result = in_result where room_uuid = in_room_uuid and game_index = in_game_index;
				set result = 1;
			ELSE
				set result = -2;
			end if;
		end IF;
	end if;
	
	select result;
END;
//

DROP PROCEDURE IF EXISTS create_or_update_user;
CREATE PROCEDURE create_or_update_user(
	IN in_account varchar(64),
	IN in_name VARCHAR(256),
	IN in_sex int(1),
	IN in_headimgurl varchar(256),
	IN in_platform varchar(256),
	IN in_channel varchar(256),
	IN in_now int(11)
)
BEGIN
	declare status int(4);
	declare result int(4);
	declare base_coins int(4);
	declare base_gems int(4);
	declare log_type int(4);
	declare my_user_id int(11);
	declare my_reg_time int(11);
	declare lock_status int(4);
	set status =0;
	set result =0;
	set log_type =0;
	set my_user_id =0;
	set base_coins = 1000;
	set base_gems = 10;
	set lock_status =0;
	select count(userid) into status from users where account = in_account;
	if status <> 0 THEN
		update users 
		set `name`= in_name,sex = in_sex,headimg = in_headimgurl,login_platform = in_platform,login_time = in_now
		where account =in_account;
		select `lock` into lock_status from users where account = in_account;
		if lock_status <> 0 then
			set result = -5;
		else
			select userid,reg_time into my_user_id,my_reg_time from users where account = in_account;
			set result =1;
		end if;
	else
		insert into users(account,`name`,coins,gems,sex,headimg,platform,login_platform,channel,reg_time,login_time)
		values(in_account,in_name,base_coins,base_gems,in_sex,in_headimgurl,in_platform,in_platform,in_channel,in_now,in_now);
		select userid,reg_time into my_user_id,my_reg_time from users where account = in_account;
		insert into user_extro_info (user_id,daily_value,statistic,route_time,check_in_time) values(my_user_id,'','',0,0);
		set result =1;
		set log_type =1;
	end if;
	select result,log_type,my_user_id,my_reg_time;
END;
//

DROP PROCEDURE IF EXISTS get_user_history;
CREATE PROCEDURE get_user_history(
	IN in_userId int(11),
	IN in_page int(11),
	IN in_server_type int(11)
)
BEGIN
	declare status int(4);
	declare result int(4);
	declare all_counts int(11);
	declare begin_index int(11);
	declare page_len int(4);
	set page_len = 10;
	set status =0;
	set result =0;
	set all_counts =0;
	set begin_index =0;
	select count(uuid) into all_counts 
	from rooms_archive 
	where FIND_IN_SET(in_userId,(replace(replace(user_info,'[',''),']',''))) and num_of_turns >0 and server_type = in_server_type;
	if all_counts > in_page *page_len THEN
		set begin_index = in_page *page_len;
		set result =1;
		select result,all_counts,begin_index,in_page as page;
		select *
		from rooms_archive
		where FIND_IN_SET(in_userId,(replace(replace(user_info,'[',''),']',''))) and num_of_turns >0 and server_type = in_server_type
		order by create_time DESC
		limit begin_index,page_len;
	ELSE
		set result = -1;
		select result,all_counts,begin_index,in_page as page;
	end IF;
END;
//

DROP PROCEDURE IF EXISTS get_game_of_room;
CREATE PROCEDURE get_game_of_room(
	IN in_uuid varchar(20)
)
BEGIN
	select room_uuid,game_index,create_time,result from games_poker_archive where room_uuid = in_uuid order by game_index;
END;
//

DROP PROCEDURE IF EXISTS get_detail_of_game;
CREATE PROCEDURE get_detail_of_game(
	IN in_uuid varchar(20),
	IN in_index int(4)
)
BEGIN
	select holds,folds,actions,change_info from games_poker_archive where room_uuid = in_uuid and game_index = in_index;
END;
//

DROP PROCEDURE IF EXISTS achive_room;
CREATE PROCEDURE achive_room(
	IN in_room_uuid varchar(20),
	IN in_create_time int(11),
	IN in_zip_reason int(4),
	IN in_zip_time int(11),
	IN in_user_info varchar(1024)
)
BEGIN
	declare status int(4);
	declare result int(4);
	set status =0;
	set result =0;
	select count(uuid) into status from rooms_archive where uuid = in_room_uuid and create_time = in_create_time;
	if status <> 0 THEN
		set result =-1;
	ELSE
		select count(rooms.uuid) into status from rooms where rooms.uuid = in_room_uuid and rooms.create_time = in_create_time;
		if status <>0 THEN
			INSERT into rooms_archive (uuid,id,base_info,create_time,num_of_turns,next_button,seat_info,score_info,ip,port,server_type)
			SELECT uuid,id,base_info,create_time,num_of_turns,next_button,seat_info,score_info,ip,port,server_type
			from rooms 
			where rooms.uuid =  in_room_uuid and rooms.create_time = in_create_time;
			delete from rooms where uuid = in_room_uuid and create_time = in_create_time;
			update rooms_archive set zip_reason = in_zip_reason,zip_time = in_zip_time,user_info = in_user_info where uuid = in_room_uuid and create_time = in_create_time;
			set result = 1;
		ELSE
			set result = -2;
		end if;
	end IF;
	select result;
END;
//

DROP PROCEDURE IF EXISTS update_seat_info;
CREATE PROCEDURE update_seat_info(
	IN in_room_uuid varchar(20),
	IN in_seats_info varchar(2048),
	IN in_watch_seats_info varchar(2048)
)
BEGIN
	declare status int(4);
	declare result int(4);
	set status =0;
	set result =0;
	
	select count(rooms.uuid) into status from rooms where rooms.uuid = in_room_uuid;

	if status <> 0 then
			update rooms set seat_info = in_seats_info,watch_seat = in_watch_seats_info  where rooms.uuid = in_room_uuid;
			set result =1;
	ELSE
			set result =-1;
	end if;
	
	select result;
END;
//

DROP PROCEDURE IF EXISTS create_pay_order;
CREATE PROCEDURE create_pay_order(
	IN in_account varchar(64),
	IN in_good_sn varchar(32),
	IN in_suffix varchar(32),
	IN in_good_count int(4),
	IN in_order_money int(4),
	IN in_gold int(11),
	IN in_extro_gold int(11),
	IN in_ingot int(11),
	IN in_extro_ingot int(11),
	IN in_pay_platform varchar(32)
)
BEGIN
	declare ex_user_id  int(11);
	declare result int(4);
	declare pay_id varchar(64);
	declare last_pay_time int(11);
	set ex_user_id =0;
	set result =0;
	set pay_id = '';
	set last_pay_time =0;
	select users.userid into ex_user_id from users where users.account = in_account;
	if (ex_user_id =0 or ex_user_id = null) THEN
		set result = -1;
	else
		select count(user_id) into last_pay_time from pay_order where pay_order.user_id = ex_user_id and pay_order.status <> 1 and update_time > UNIX_TIMESTAMP()-5*60;
		if(last_pay_time =0 or last_pay_time = null) THEN
			set pay_id = CONCAT(cast(UNIX_TIMESTAMP() as char),in_good_sn,cast(ex_user_id as char),in_suffix);
			INSERT INTO pay_order set pay_order.pay_platform  = in_pay_platform,pay_order.pay_id = pay_id,good_sn = in_good_sn,order_money =in_order_money,gold = in_gold,extro_gold = in_extro_gold,ingot = in_ingot,extro_ingot = in_extro_ingot,good_count = in_good_count,user_id = ex_user_id,status= 0,update_time = UNIX_TIMESTAMP();
			set result  =1;
		ELSE
			set result =2;
		end if;
	end IF;
	select result,pay_id;
END;
//

DROP PROCEDURE IF EXISTS pay_success;
CREATE PROCEDURE pay_success(
  IN in_account varchar(64),
  IN in_good_sn varchar(32),
  IN in_pay_platform varchar(32),
  IN in_order_id varchar(64),
  IN in_pay_id varchar(64),
  IN in_app_pay_count int(4),
  IN in_app_pay_time varchar(32)
)
BEGIN
  declare ex_user_id  int(11);
  declare result    int(4);
  declare pay_uni_id  int(11);
  declare added_ingot int(11);
  declare total_ingot int(11);
  declare added_gold  int(11);
  declare total_gold  int(11);
  declare invi_userid varchar(64) DEFAULT '';

  set ex_user_id =0;
  set result =0;
  set pay_uni_id =0;
  set added_ingot =0;
  set total_ingot =0;
  set added_gold =0;
  set total_gold =0;

  select users.userid,invitation_code into ex_user_id,invi_userid from users where users.account = in_account;
  if (ex_user_id =0 or ex_user_id = null) THEN
    set result = -1;
  else
    select pay_order.id,(gold+extro_gold),(ingot+extro_ingot) into pay_uni_id,added_gold,added_ingot from pay_order where pay_order.user_id = ex_user_id and pay_order.good_count = in_app_pay_count and good_sn = in_good_sn and pay_platform = in_pay_platform and pay_id = in_pay_id and pay_order.status <> 1;
    if(pay_uni_id =0 or pay_uni_id = null) THEN
      set result =-2;
    ELSE
      update users set gems = gems +added_ingot,coins = coins + added_gold where users.userid = ex_user_id;
      select gems,coins into total_ingot,total_gold from users where users.userid = ex_user_id;
      update pay_order set pay_order.status = 1,app_record_time= in_app_pay_time,pay_order.order_id = in_order_id where  pay_order.user_id = ex_user_id and good_sn = in_good_sn and pay_platform = in_pay_platform and pay_id = in_pay_id;
      set result =1;
    end if;
  end IF;
  select result,total_ingot,total_gold,added_ingot,added_gold,ex_user_id as user_id,invi_userid as invitation_code;
END;
//

DROP PROCEDURE IF EXISTS create_new_advice;
CREATE PROCEDURE create_new_advice(
	IN in_account varchar(64),
	IN in_advice_type  int(4),
	IN in_advice_game varchar(16),
	IN in_advice_platform varchar(64),
	IN in_msg varchar(1024)
)
BEGIN
	declare ex_user_id int(11);
	declare result int(4);
	declare last_update_time int(11);
	declare now int(11);
	set ex_user_id =0;
	set result =0;
	set last_update_time =0;
	
	if (CHECK_ACCOUNT(in_account)<> 1) THEN
		set result = -1;
	ELSE
		set now = UNIX_TIMESTAMP();
		select users.userid into ex_user_id from users where users.account = in_account;
		select MAX(create_time) into last_update_time from advice_info where user_id = ex_user_id;
		if( now -last_update_time) <5 *60 THEN
			set result =2;
		else
			INSERT into advice_info set advice_info.advice_type = in_advice_type,advice_info.advice_game = in_advice_game,advice_info.advice_platform = in_advice_platform,
			advice_info.user_id = ex_user_id ,msg = in_msg,create_time = now,status =0;
			set result =1;
		end if;
	end if;
	select result;
END;
//

DROP PROCEDURE IF EXISTS find_advice;
CREATE PROCEDURE find_advice(
	IN in_account varchar(64),
	IN in_page  int(4)
)
BEGIN
	declare ex_user_id int(11);
	declare result int(4);
	declare all_counts int(11);
	declare begin_index int(11);
	declare page_len int(4);
	set page_len = 10;
	set ex_user_id =0;
	set result =0;
	set all_counts =0;
	set begin_index =0;
	if(CHECK_ACCOUNT(in_account) <>1 ) then
		set result =-1;
		select result;
	else
		select users.userid into ex_user_id from users where users.account = in_account;
		select count(advice_info.id) into all_counts from advice_info where user_id = ex_user_id and advice_info.`status` <> 2;
		if all_counts > in_page *page_len then
			set begin_index = in_page*page_len;
			set result =1;
			select result,all_counts,begin_index,in_page as page;
			select * from advice_info where user_id = ex_user_id and advice_info.`status` <> 2
			order by create_time DESC
			limit begin_index,page_len;
		else
			set result = 2;
			select result;
		end if;
	end if;
END;
//

DROP PROCEDURE IF EXISTS solve_advice;
CREATE PROCEDURE solve_advice(
	IN in_account varchar(64),
	IN in_ad_id  int(11)
)
BEGIN
	declare ex_user_id int(11);
	declare result int(4);
	declare ex_ad_id int(11);
	set ex_user_id =0;
	set result =0;
	
	if (CHECK_ACCOUNT(in_account)<> 1) THEN
		set result = -1;
	ELSE
		select users.userid into ex_user_id from users where users.account = in_account;
		select count(advice_info.id) into ex_ad_id from advice_info where user_id = ex_user_id and id = in_ad_id;
		if(ex_ad_id = null or ex_ad_id =0) then
			set result =2;
		else
			update advice_info set advice_info.`status` = 2 where user_id = ex_user_id and id = in_ad_id;
			set result =1;
		end if;
	end if;
	select result;
END;
//

DROP PROCEDURE IF EXISTS update_room_change_info;
CREATE PROCEDURE update_room_change_info(
	IN in_room_uuid varchar(20),
	IN in_change_info varchar(1024)
)
BEGIN
	declare status int(4);
	declare result int(4);
	set status =0;
	set result =0;
	
	select count(rooms.uuid) into status from rooms where rooms.uuid = in_room_uuid;

	if status <> 0 then
			update rooms set change_info = in_change_info where rooms.uuid = in_room_uuid;
			set result =1;
	ELSE
			set result =-1;
	end if;
	
	select result;
END;
//

DROP PROCEDURE IF EXISTS get_user_mail;
CREATE PROCEDURE get_user_mail(
	IN in_account varchar(64),
	IN in_page int(11)
)
BEGIN
	declare ex_user_id int(11);
	declare result int(4);
	declare all_counts int(11);
	declare begin_index int(11);
	declare page_len int(4);
	set ex_user_id =0;
	set page_len = 10;
	set result =0;
	set all_counts =0;
	set begin_index =0;
	select userid into ex_user_id from users where account = in_account;
	if ex_user_id = 0 or ex_user_id = null then
		set result = -1;
		select result,all_counts,begin_index,in_page as page;
	else
		select count(mail_id) into all_counts from mail where user_id = ex_user_id and mail.status <>3 and end_time > UNIX_TIMESTAMP();
		if all_counts >in_page *page_len then
			set begin_index = in_page *page_len;
			set result = 1;
			select result,all_counts,begin_index,in_page as page;
			select * from mail where user_id = ex_user_id and mail.status <>3 and end_time > UNIX_TIMESTAMP()
			order by send_time desc
			limit begin_index,page_len;
		else
			set result = -2;
			select result,all_counts,begin_index,in_page as page;
		end if;
	end if;
END;
// 

DROP PROCEDURE IF EXISTS add_user_mail;
CREATE PROCEDURE add_user_mail(
	IN in_account varchar(64),
	IN in_user_id int(11),
	IN in_sender_id int(11),
	IN in_sender_name varchar(64),
	IN in_mail_type int(4),
	IN in_mail_tittle varchar(1024),
	IN in_mail_content varchar(2048),
	IN in_mail_key varchar(64),
	IN in_mail_attach varchar(1024),
	IN in_end_time int(11)
)
BEGIN
	declare ex_user_id int(11);
	declare result int(4);
	set ex_user_id =0;
	set result =0;
	if(in_account <> '') then
		select userid into ex_user_id from users where account = in_account;
		if ex_user_id = 0 or ex_user_id = null then
			set result = -1;
			select result;
		else
			insert into mail set user_id = in_user_id,sender_id= in_sender_id,sender_name = in_sender_name,mail_type = in_mail_type,mail_tittle = in_mail_tittle,mail_content = in_mail_content,
			mail_key = in_mail_key,mail_attach = in_mail_attach,send_time = UNIX_TIMESTAMP(),end_time = UNIX_TIMESTAMP()+in_end_time,status =0;
		end if;
	else
		select userid into ex_user_id from users where userid = in_user_id;
		if ex_user_id = 0 or ex_user_id = null then
			set result = -1;
			select result;
		else
			insert into mail set user_id = in_user_id,sender_id= in_sender_id,sender_name = in_sender_name,mail_type = in_mail_type,mail_tittle = in_mail_tittle,mail_content = in_mail_content,
			mail_key = in_mail_key,mail_attach = in_mail_attach,send_time = UNIX_TIMESTAMP(),end_time = UNIX_TIMESTAMP()+in_end_time,status =0;
		end if;
	end if;
END;
//

DROP PROCEDURE IF EXISTS del_user_mail;
CREATE PROCEDURE del_user_mail(
	IN in_account varchar(64),
	IN in_user_id int(11),
	IN in_mail_id int(11),
	IN in_archive_reason int(4)
)
BEGIN
	declare ex_user_id int(11);
	declare ex_mail_id int(11);
	declare result int(4);
	set ex_user_id =0;
	set ex_mail_id =0;
	set result =0;
	if(in_account <> '') then
		select userid into ex_user_id from users where account = in_account;
		if ex_user_id = 0 or ex_user_id = null then
			set result = -1;
		else
			select mail_id into ex_mail_id from mail where mail_id = in_mail_id and user_id = ex_user_id;
			if ex_mail_id =0 or ex_mail_id = null then
				set result =-2;
			else
				insert into mail_archive(mail_id,user_id,sender_id,sender_name,mail_type,mail_tittle,mail_content,mail_key,mail_attach,send_time,end_time,status)
				select * from mail where mail.mail_id = in_mail_id;
				update mail_archive set archive_reason  = in_archive_reason,archive_time = UNIX_TIMESTAMP();
				delete from mail where mail.mail_id = in_mail_id;
				set result = 1;
			end if;
		end if;
	else
		select userid into ex_user_id from users where userid = in_user_id;
		if ex_user_id = 0 or ex_user_id = null then
			set result = -1;
		else
			select mail_id into ex_mail_id from mail where mail_id = in_mail_id and user_id = ex_user_id;
			if ex_mail_id =0 or ex_mail_id = null then
				set result =-2;
				select result;
			else
				insert into mail_archive(mail_id,user_id,sender_id,sender_name,mail_type,mail_tittle,mail_content,mail_key,mail_attach,send_time,end_time,status)
				select * from mail where mail.mail_id = in_mail_id;
				update mail_archive set archive_reason  = in_archive_reason,archive_time = UNIX_TIMESTAMP();
				delete from mail where mail.mail_id = in_mail_id;
				set result = 1;
			end if;
		end if;
	end if;
	select result;
END;
//

DROP PROCEDURE IF EXISTS update_mail_status;
CREATE PROCEDURE update_mail_status(
	IN in_account varchar(64),
	IN in_user_id int(11),
	IN in_mail_id int(11),
	IN in_status int(4)
)
BEGIN
	declare ex_user_id int(11);
	declare ex_mail_id int(11);
	declare result int(4);
	set ex_user_id =0;
	set ex_mail_id =0;
	set result =0;
	if(in_account <> '') then
		select userid into ex_user_id from users where account = in_account;
		if ex_user_id = 0 or ex_user_id = null then
			set result = -1;
		else
			select mail_id into ex_mail_id from mail where mail_id = in_mail_id and user_id = ex_user_id;
			if ex_mail_id =0 or ex_mail_id = null then
				set result =-2;
			else
				update mail set mail.status = in_status where mail_id = in_mail_id;
				set result = 1;
			end if;
		end if;
	else
		select userid into ex_user_id from users where userid = in_user_id;
		if ex_user_id = 0 or ex_user_id = null then
			set result = -1;
		else
			select mail_id into ex_mail_id from mail where mail_id = in_mail_id and user_id = ex_user_id;
			if ex_mail_id =0 or ex_mail_id = null then
				set result =-2;
				select result;
			else
				update mail set mail.status = in_status where mail_id = in_mail_id;
				set result = 1;
			end if;
		end if;
	end if;
	select result;
END;
//

DROP PROCEDURE IF EXISTS add_message;
CREATE PROCEDURE add_message(
	IN in_type int(4),
	IN in_seq int(4),
	IN in_looptimes int(4),
	IN in_open_time int(11),
	IN in_end_time int(11),
	IN in_msgtext varchar(2048),
	IN in_create_id int(11)
)
BEGIN
	declare result int(4);
	set result =0;
	INSERT into message(id,type_id,sort,loop_times,start_at,end_at,msgtext,created_at,author,disabled)
	VALUES(null,in_type,in_seq,in_looptimes,in_open_time,in_end_time,in_msgtext,UNIX_TIMESTAMP(),in_create_id,0);
	set result =1;
	select result;
END;
//


DROP PROCEDURE IF EXISTS get_message;
CREATE PROCEDURE get_message(
	IN in_account varchar(64),
	IN in_page int(11)
)
BEGIN
	declare ex_user_id int(11);
	declare result int(4);
	declare all_counts int(11);
	declare begin_index int(11);
	declare page_len int(4);
	set ex_user_id =0;
	set page_len = 10;
	set result =0;
	set all_counts =0;
	set begin_index =0;
	select userid into ex_user_id from users where account = in_account;
	if ex_user_id = 0 or ex_user_id = null then
		set result = -1;
		select result,all_counts,begin_index,in_page as page;
	else
		select count(id) into all_counts from message where disabled = 0 and ((UNIX_TIMESTAMP() >start_at and UNIX_TIMESTAMP() <end_at) or(start_at =0 and end_at =0));
		if all_counts >in_page *page_len then
			set begin_index = in_page *page_len;
			set result = 1;
			select result,all_counts,begin_index,in_page as page;
			select * from message where disabled =0 and ((UNIX_TIMESTAMP() >start_at and UNIX_TIMESTAMP() <end_at) or(start_at =0 and end_at =0))
			order by created_at desc,sort,id asc
			limit begin_index,page_len;
		else
			set result = -2;
			select result,all_counts,begin_index,in_page as page;
		end if;
	end if;
END;
//


DROP PROCEDURE IF EXISTS web_add_user_ingot;
CREATE PROCEDURE web_add_user_ingot(IN in_sender_id int(11),IN in_userId int(11),IN in_addingot int(11))
BEGIN
	declare status int(4);
  declare result int(4);
  declare old_ingot int(11);
	declare now_ingot int(11);
	set status =0;
	set old_ingot =0;
	set now_ingot =0;
	set result =0;
	select count(userid),gems into status,old_ingot from users where userid = in_userId;
	if status <> 1 then
		set result = -1;
	else
		set result = 1;
		set now_ingot = old_ingot + in_addingot;
		update users set gems = gems +in_addingot where userid = in_userId;
	end if;
	select result,old_ingot,now_ingot;
	select userid,name,headimg,coins,gems,roomid,reg_time from users where userid = in_userId;
END;
//

DROP PROCEDURE IF EXISTS web_add_user_gold;
CREATE PROCEDURE web_add_user_gold(IN in_sender_id int(11),IN in_userId int(11),IN in_addgold int(11))
BEGIN
	declare status int(4);
  declare result int(4);
  declare old_gold int(11);
	declare now_gold int(11);
	set status =0;
	set old_gold =0;
	set now_gold =0;
	set result =0;
	select count(userid),coins into status,old_gold from users where userid = in_userId;
	if status <> 1 then
		set result = -1;
	else
		set result = 1;
		set now_gold = old_gold + in_addgold;
		update users set coins = coins +in_addgold where userid = in_userId;
	end if;
	select result,old_gold,now_gold;
	select userid,name,headimg,coins,gems,roomid,reg_time from users where userid = in_userId;
END;
//

DROP PROCEDURE IF EXISTS route_state;
CREATE PROCEDURE route_state(IN in_account varchar(64))
BEGIN
  	declare result int(4);
	declare last_route_time int(11);
	declare last_share_time int(11);
	declare ex_user_id int(11);
	declare day_offset int(11);
	declare share_offset int(11);
	declare current_lucky int(11);
	set result = 0;
	set last_route_time =0;
	set last_share_time =0;
	set ex_user_id =0;
	set day_offset =0;
	set share_offset =0;
	set current_lucky =0;
	if CHECK_ACCOUNT(in_account) <> 1 THEN
		set result = -1;
	else
		select userid,lucky into ex_user_id,current_lucky from users where account = in_account;
		select route_time,share_time into last_route_time,last_share_time from user_extro_info where user_id = ex_user_id;
		select TIMESTAMPDIFF(DAY,FROM_UNIXTIME(last_route_time),now()) into day_offset;
		select TIMESTAMPDIFF(DAY,FROM_UNIXTIME(last_share_time),now()) into share_offset;
		set result =1;
	end if;
	select result,day_offset,share_offset,ex_user_id as user_id,current_lucky as lucky;
END;
//


DROP PROCEDURE IF EXISTS route_state;
CREATE PROCEDURE route_state(IN in_account varchar(64))
BEGIN
  declare result int(4);
	declare last_route_time int(11);
	declare ex_user_id int(11);
	declare day_offset int(11);
	set result = 0;
	set last_route_time =0;
	set ex_user_id =0;
	set day_offset =0;
	if CHECK_ACCOUNT(in_account) <> 1 THEN
		set result = -1;
	else
		select userid into ex_user_id from users where account = in_account;
		select route_time into last_route_time from user_extro_info where user_id =ex_user_id;
		select TIMESTAMPDIFF(DAY,FROM_UNIXTIME(last_route_time),now()) into day_offset;
		set result =1;
	end if;
	select result,day_offset,ex_user_id as user_id;
END;
//

DROP PROCEDURE IF EXISTS do_route;
CREATE PROCEDURE do_route(IN in_user_id int(11))
BEGIN
  	declare result int(4);
	declare ex_user_id int(11);
	declare hit_index int(4);
	declare hit_offset int(4);
	declare mask_seed  varchar(256);
	declare mask varchar(64);
	
	declare max_route_index int(4);
	declare c_route_index int(4);
	declare day_offset int(4);

	declare tmp_ood  int(11);
	declare sum_ood int(11);
	declare random_ood int(11);
	
	declare c_route_ood int(11);
	declare c_today_hit int(11);
	declare c_max_hit int(11);
	declare c_today_time int(11);
	declare c_ingot_value int(11);
	declare c_gold_value int(11);

	declare action_time int(11);

	declare offset_index int(4);
	set offset_index =1;

	set result = 0;
	set ex_user_id =0;

	set hit_index =0;
	set hit_offset =0;
	set mask_seed ='';
	set mask ='';
	set max_route_index =0;
	set c_route_index =0;
	set tmp_ood =0;
	set sum_ood =0;
	set random_ood =0;

	set c_route_ood =0;
	set c_today_hit =0;
	set c_max_hit =0;
	set c_today_time =0;
	set c_ingot_value =0;
	set c_gold_value =0;

	set action_time = UNIX_TIMESTAMP();
	
	select userid into ex_user_id from users where userid = in_user_id;
	if ex_user_id =0 or ex_user_id = null then
		set result =-1;
	else
		select sum(route_ood),max(route_index),min(route_index),max(today_time) into sum_ood ,max_route_index,c_route_index,c_today_time from route_config;
		select TIMESTAMPDIFF(DAY,FROM_UNIXTIME(c_today_time),now()) into day_offset;
		if day_offset >0 then
			update route_config set today_hit =0,today_time = action_time;
		end if;
		set random_ood = ROUND(RAND()*sum_ood);
		while c_route_index <= max_route_index do
			select route_ood,max_hit,today_hit into c_route_ood,c_max_hit,c_today_hit from route_config where route_index  = c_route_index;
			set tmp_ood = tmp_ood +c_route_ood;
			if tmp_ood >= random_ood then
				if c_max_hit =999 or c_max_hit >c_today_hit then
					set hit_index = c_route_index;
					set c_route_index = 999;
				else
					set hit_offset = hit_offset +1;
					set c_route_index = c_route_index -1;
					select route_ood,max_hit,today_hit into c_route_ood,c_max_hit,c_today_hit from route_config where route_index  = c_route_index;
					if c_max_hit =999 or c_max_hit >c_today_hit then
						set hit_index = c_route_index;
						set c_route_index = 999;
					else
						set hit_index = offset_index;
						set hit_offset = hit_offset +1;
						set c_route_index =999;
					end if;
				end if;
			else
				set c_route_index = c_route_index +1;
			end if;
		end while;
		set result =1;
		update user_extro_info set route_time = action_time where user_id = in_user_id;
		select ingot_value,gold_value into c_ingot_value,c_gold_value from route_config where route_index = hit_index;
		if c_ingot_value >0 then
			update users set users.gems = users.gems+c_ingot_value;
		end if;
		if c_gold_value >0 then
			update users set users.coins = users.coins+c_gold_value;
		end if;
		set mask_seed = CONCAT(in_user_id,'_',action_time,'_',hit_index,'_',hit_offset,'_',random_ood);
		set mask = Upper(MD5(mask_seed));
	end if;
	select result,in_user_id as user_id,hit_index,random_ood,hit_offset,mask,action_time,c_ingot_value as ingot_value,c_gold_value as gold_value;
END;
//

DROP PROCEDURE IF EXISTS try_gold_to_ingot;
CREATE PROCEDURE try_gold_to_ingot(IN in_account varchar(64),IN in_gold int(11), IN in_rate int(4))
BEGIN
  declare result int(4);
	declare ex_user_id int(11);
	declare old_ingot int(11);
	declare old_gold int(11);
	declare new_ingot int(11);
	declare new_gold int(11);
	declare new_add_ingot int(11);
	set result =0;
	set ex_user_id =0;
	set old_ingot =0;
	set old_gold =0;
	set new_add_ingot =0;
	set new_gold =0;
	set new_ingot =0;
	if CHECK_ACCOUNT(in_account) <> 1 then
		set result =-1;
	else
		select userid,gems,coins into ex_user_id,old_ingot,old_gold from users where account = in_account;
		if old_gold < in_gold then
				set result =-2;
		else	
				set new_add_ingot = floor(in_gold/in_rate);
				update users set gems= gems+ new_add_ingot,coins = coins - new_add_ingot*in_rate where userid = ex_user_id;
				select gems,coins into new_ingot,new_gold from users where userid = ex_user_id;
				set result =1;
		end if;
	end if;
	select result,ex_user_id as user_id,new_add_ingot,old_gold,old_ingot,new_gold,new_ingot,in_rate as rate;
END;
//

DROP PROCEDURE IF EXISTS try_ingot_to_gold;
CREATE PROCEDURE try_ingot_to_gold(IN in_account varchar(64),IN in_ingot int(11), IN in_rate int(4))
BEGIN
    declare result int(4);
	declare ex_user_id int(11);
	declare old_ingot int(11);
	declare old_gold int(11);
	declare new_ingot int(11);
	declare new_gold int(11);
	declare new_add_gold int(11);
	set result =0;
	set ex_user_id =0;
	set old_ingot =0;
	set old_gold =0;
	set new_add_gold =0;
	set new_gold =0;
	set new_ingot =0;
	if CHECK_ACCOUNT(in_account) <> 1 then
		set result =-1;
	else
		select userid,gems,coins into ex_user_id,old_ingot,old_gold from users where account = in_account;
		if old_ingot < in_ingot then
				set result =-2;
		else	
				set new_add_gold = in_ingot * in_rate;
				update users set gems= gems-in_ingot,coins = coins+new_add_gold where userid = ex_user_id;
				select gems,coins into new_ingot,new_gold from users where userid = ex_user_id;
				set result =1;
		end if;
	end if;
	select result,ex_user_id as user_id,new_add_gold,old_gold,old_ingot,new_gold,new_ingot,in_rate as rate;
END;
//

DROP PROCEDURE IF EXISTS try_to_give_ingot;
CREATE PROCEDURE try_to_give_ingot(IN in_account varchar(64),IN in_target int(11),IN in_ingot int(11))
BEGIN
  declare result int(4);
  declare status int(4);
  declare ex_user_id int(11);
  declare old_ingot int(11);
  declare new_ingot int(11);
  declare new_target_ingot int(11);
  declare agent_status int(4);

  set result =0;
  set status = 0;
  set old_ingot =0;
  set new_ingot =0;
  set new_target_ingot =0;
  set agent_status =0;

  if CHECK_ACCOUNT(in_account) <> 1 then
    set result =-1;
  else
    select gems,userid,agent into old_ingot,ex_user_id,agent_status from users where account = in_account;
    if agent_status = 0 then
      set result = -5;
    else
      if old_ingot < in_ingot then
        set result = -2;
      else
        select userid into status from users where userid = in_target;
        if  status =0 or status = null then
          set result =-3;
        else
          if status = ex_user_id then
            set result =-4;
          else
            update users set gems = gems -in_ingot where userid = ex_user_id;
            update users set gems = gems +in_ingot where userid = in_target;
            select gems into new_ingot from users where userid = ex_user_id;
            select gems into new_target_ingot from users where userid = in_target;
            set result =1;
          end if;
        end if;
      end if;
    end if;
  end if;
  select result,old_ingot,new_ingot,new_target_ingot,in_target as target,ex_user_id as user_id,in_ingot as ingot;
END;
//

DROP PROCEDURE IF EXISTS web_lock_user;
CREATE PROCEDURE web_lock_user(IN in_user_id int(11),IN in_lock_status int(4))
BEGIN
	declare result int(4);
	declare user_status int(4);
	set result =0;
	set user_status=0;
	select count(userid) into user_status from users where userid = in_user_id;
	if user_status <> 0 then
		update users set `lock` = in_lock_status where userid = in_user_id;
		set result =1;
	else
		set result =-1;
	end if;
	select result,in_lock_status;
END;
//

DROP PROCEDURE IF EXISTS web_agent_status;
CREATE PROCEDURE web_agent_status(IN in_user_id int(11),IN in_agent_status int(4))
BEGIN
	declare result int(4);
	declare user_status int(4);
	set result =0;
	set user_status =0;
	select count(userid) into user_status from users where userid = in_user_id;
	if user_status <> 0 then
		update users set `agent` = in_agent_status where userid = in_user_id;
		set result =1;
	else
		set result =-1;
	end if;
	select result,in_agent_status;
END;
//

DROP PROCEDURE IF EXISTS close_route_data;
CREATE PROCEDURE close_route_data(IN now_time int(11))
BEGIN
	declare result int(4);
	set result =0;
	update route_config set today_hit =0,today_time = now_time;
	set result =1;
	select result;
END;
//

DROP PROCEDURE IF EXISTS daily_share;
CREATE PROCEDURE daily_share(IN in_account varchar(64))
BEGIN
	declare result int(4);
	declare ex_user_id int(11);
	set result =0;
	set ex_user_id =0;
	IF CHECK_ACCOUNT(in_account) <> 1 then
		set result =-1;
	else
		select userid into ex_user_id from users where account = in_account;
		update user_extro_info set share_time = UNIX_TIMESTAMP() where user_id = ex_user_id;
		set result =1;
	end if;
	select result;
END;
//

DROP PROCEDURE IF EXISTS update_user_info;
CREATE PROCEDURE update_user_info(
	IN in_userId int(11),
	IN in_lv SMALLINT(6),
	IN in_exp int(11),
	IN in_lucky int(4),
	IN in_online_time int(11),
	IN in_daily_value MEDIUMBLOB,
	IN in_statitic MEDIUMBLOB,
	IN in_daily_clear_time int(11)
)
BEGIN
	declare reuslt int(4) default 0;
	update users set lv = in_lv ,exp = in_exp,lucky = in_lucky,online_time = in_online_time where userid = in_userId;
	update user_extro_info set daily_value = in_daily_value,statistic = in_statitic,daily_clear_time = in_daily_clear_time where user_id = in_userId;
	set reuslt =1;
END;
//


DROP PROCEDURE IF EXISTS inviation_status;
CREATE PROCEDURE inviation_status(
  IN in_account varchar(64)
)
BEGIN
  declare reuslt int(4) default 0;
  declare inv_code varchar(64) default '';
  IF CHECK_ACCOUNT(in_account) <> 1 then
    set reuslt = -1;
  else
    select invitation_code into inv_code from users where account = in_account;
    set reuslt = 1;
  end if;
  select reuslt,inv_code;
END;
//

DROP PROCEDURE IF EXISTS add_inviation;
CREATE PROCEDURE add_inviation(
  IN in_account varchar(64),
  IN in_invitation varchar(64),
  IN in_kind_type int(4)
)
BEGIN
  declare reuslt int(4) default 0;
  declare inv_code varchar(64) default '';
  declare ex_inv_user_id int(11) default 0;
  declare ex_user_id int(11) default 0;
  declare ex_platform_key varchar(64) default '';
  declare ex_platform_award varchar(1024) default '';
  declare award  int(4) default 0;
  declare my_name varchar(256) default '';
  declare other_name varchar(256) default '';
  if CHECK_ACCOUNT(in_account) <> 1 then
    set reuslt =-1;
  else
    select userid,invitation_code,name into ex_user_id, inv_code,my_name from users where account = in_account;
    if inv_code = null or inv_code = '' then
      set award = 1;
      if ex_user_id = in_invitation then
        set reuslt =2;
      else
        if in_kind_type = 1 then
          select userid,name into ex_inv_user_id,other_name from users where userid = in_invitation; 
          if ex_inv_user_id = null or ex_inv_user_id = 0 then
              set reuslt =3;
          else
            update users set invitation_code = in_invitation where account = in_account;
            set reuslt = 1;
          end if;
        else
          select platform_key,platform_award into ex_platform_key,ex_platform_award from platform_invitaton  where invitation_code = in_invitation;
          if ex_platform_key = null  or ex_platform_key = '' THEN
            set reuslt =4;
          else
            update users set invitation_code = in_invitation,channel = ex_platform_key where account = in_account;
            set reuslt =1;
          end if;
        end if;
      end if;
    else
      set award = 0;
      set reuslt =5;
    end if;
  end if;
  select reuslt,award,ex_user_id,my_name,ex_inv_user_id,other_name,ex_platform_key,ex_platform_award;
END;
//

DROP PROCEDURE IF EXISTS check_mail_award;
CREATE PROCEDURE check_mail_award(
  IN in_account varchar(64),
  IN in_user_id int(11),
  IN in_mail_id int(11)
)
BEGIN
  declare ex_user_id int(11);
  declare ex_mail_id int(11);
  declare result int(4);
  set ex_user_id =0;
  set ex_mail_id =0;
  set result =0;
  if(in_account <> '') then
    select userid into ex_user_id from users where account = in_account;
    if ex_user_id = 0 or ex_user_id = null then
      set result = -1;
    else
      select mail_id into ex_mail_id from mail where mail_id = in_mail_id and user_id = ex_user_id;
      if ex_mail_id =0 or ex_mail_id = null then
        set result =-2;
      else
        set result = 1;
      end if;
    end if;
  else
    select userid into ex_user_id from users where userid = in_user_id;
    if ex_user_id = 0 or ex_user_id = null then
      set result = -1;
    else
      select mail_id into ex_mail_id from mail where mail_id = in_mail_id and user_id = ex_user_id;
      if ex_mail_id =0 or ex_mail_id = null then
        set result =-2;
        select result;
      else
        set result = 1;
      end if;
    end if;
  end if;
  select * from mail where mail_id = in_mail_id and user_id = ex_user_id and status < 1 and end_time > UNIX_TIMESTAMP();
  select result;
END;
//