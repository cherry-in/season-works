# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.5.5-10.6.13-MariaDB-1:10.6.13+maria~ubu2204)
# Database: works
# Generation Time: 2023-07-21 04:30:28 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table user
# ------------------------------------------------------------

CREATE TABLE `user` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `membership` varchar(8) NOT NULL DEFAULT '' COMMENT 'guest / user / staff / admin',
  `name` varchar(192) NOT NULL DEFAULT '',
  `mobile` varchar(64) DEFAULT NULL,
  `status` varchar(8) NOT NULL,
  `onetimepass` varchar(16) DEFAULT NULL,
  `onetimepass_time` datetime DEFAULT NULL,
  `password` text DEFAULT NULL,
  `profile_image` text DEFAULT NULL,
  `created` datetime NOT NULL,
  `last_access` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`) USING HASH,
  KEY `status` (`status`),
  KEY `membership` (`membership`),
  KEY `created` (`created`),
  KEY `last_access` (`last_access`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table user_authenticator
# ------------------------------------------------------------

CREATE TABLE `user_authenticator` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `user_id` varchar(32) NOT NULL DEFAULT '',
  `key` varchar(16) NOT NULL,
  `value` varchar(192) NOT NULL DEFAULT '',
  `active` varchar(8) NOT NULL DEFAULT '',
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`),
  KEY `user_id` (`user_id`),
  KEY `key` (`key`),
  KEY `active` (`active`),
  KEY `created` (`created`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table wiki_access
# ------------------------------------------------------------

CREATE TABLE `wiki_access` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `book_id` varchar(32) NOT NULL DEFAULT '',
  `type` varchar(8) NOT NULL,
  `key` varchar(32) NOT NULL DEFAULT '',
  `role` varchar(8) NOT NULL DEFAULT '',
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wiki_id` (`book_id`,`id`,`type`),
  KEY `role` (`role`),
  KEY `key` (`key`),
  KEY `type` (`type`),
  KEY `wiki_id_2` (`book_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table wiki_book
# ------------------------------------------------------------

CREATE TABLE `wiki_book` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `namespace` varchar(32) NOT NULL DEFAULT '',
  `title` varchar(64) NOT NULL DEFAULT '',
  `visibility` varchar(16) NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `home` varchar(32) DEFAULT NULL,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `extra` longtext NOT NULL,
  `icon` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `namespace` (`namespace`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table wiki_content
# ------------------------------------------------------------

CREATE TABLE `wiki_content` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `book_id` varchar(32) NOT NULL,
  `type` varchar(8) NOT NULL DEFAULT '',
  `root_id` varchar(32) NOT NULL,
  `title` varchar(192) NOT NULL DEFAULT '',
  `content` longtext NOT NULL,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `root_id` (`root_id`),
  KEY `wiki_id` (`book_id`),
  KEY `created` (`created`),
  KEY `updated` (`updated`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table wiki_content_revision
# ------------------------------------------------------------

CREATE TABLE `wiki_content_revision` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `user_id` varchar(32) NOT NULL,
  `name` varchar(64) NOT NULL DEFAULT '',
  `content_id` varchar(32) NOT NULL DEFAULT '',
  `content` longtext NOT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `content_id` (`content_id`),
  KEY `created` (`created`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_attachment
# ------------------------------------------------------------

CREATE TABLE `works_attachment` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `project_id` varchar(32) NOT NULL,
  `namespace` varchar(192) DEFAULT NULL,
  `user_id` varchar(32) NOT NULL DEFAULT '',
  `filename` varchar(255) NOT NULL DEFAULT '',
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `user_id` (`user_id`),
  KEY `filename` (`filename`(250)),
  KEY `created` (`created`),
  KEY `namespace` (`namespace`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_issueboard_issue
# ------------------------------------------------------------

CREATE TABLE `works_issueboard_issue` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `project_id` varchar(32) NOT NULL DEFAULT '',
  `label_id` varchar(32) NOT NULL DEFAULT '',
  `user_id` varchar(32) NOT NULL,
  `title` varchar(128) NOT NULL,
  `process` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `status` varchar(8) NOT NULL DEFAULT '',
  `description` longtext NOT NULL,
  `planstart` datetime NOT NULL,
  `planend` datetime DEFAULT NULL,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `todo` text NOT NULL,
  `worker` text DEFAULT NULL COMMENT 'cache @issueboard_worker',
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `label_id` (`label_id`),
  KEY `status` (`status`),
  KEY `level` (`level`),
  KEY `planstart` (`planstart`),
  KEY `planend` (`planend`),
  KEY `created` (`created`),
  KEY `updated` (`updated`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_issueboard_label
# ------------------------------------------------------------

CREATE TABLE `works_issueboard_label` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `title` varchar(32) NOT NULL DEFAULT '',
  `project_id` varchar(32) NOT NULL DEFAULT '',
  `order` int(11) unsigned NOT NULL,
  `issues` text NOT NULL,
  `mode` tinyint(4) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `order` (`order`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_issueboard_message
# ------------------------------------------------------------

CREATE TABLE `works_issueboard_message` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `type` varchar(12) NOT NULL DEFAULT '',
  `issue_id` varchar(32) NOT NULL DEFAULT '',
  `user_id` varchar(32) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `attachment` text NOT NULL,
  `images` text DEFAULT NULL,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `favorite` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `todo_id` (`issue_id`),
  KEY `user_id` (`user_id`),
  KEY `updated` (`updated`),
  KEY `created` (`created`),
  KEY `type` (`type`),
  KEY `favorite` (`favorite`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_issueboard_worker
# ------------------------------------------------------------

CREATE TABLE `works_issueboard_worker` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `type` varchar(6) NOT NULL DEFAULT '' COMMENT 'user / group',
  `user_id` varchar(32) NOT NULL DEFAULT '',
  `issue_id` varchar(32) NOT NULL DEFAULT '',
  `role` varchar(16) NOT NULL DEFAULT '' COMMENT 'owner / worker',
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `created` (`created`),
  KEY `type` (`type`,`user_id`,`issue_id`,`role`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_meeting
# ------------------------------------------------------------

CREATE TABLE `works_meeting` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `project_id` varchar(32) NOT NULL DEFAULT '',
  `user_id` varchar(32) NOT NULL,
  `status` varchar(8) DEFAULT NULL,
  `meetdate` datetime DEFAULT NULL,
  `title` varchar(192) NOT NULL,
  `content` longtext NOT NULL,
  `attachment` text DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `updated` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `user_id` (`user_id`),
  KEY `meetdate` (`meetdate`),
  KEY `created` (`created`),
  KEY `updated` (`updated`),
  KEY `status` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_meeting_version
# ------------------------------------------------------------

CREATE TABLE `works_meeting_version` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `meeting_id` varchar(32) NOT NULL DEFAULT '',
  `project_id` varchar(32) NOT NULL DEFAULT '',
  `user_id` varchar(32) NOT NULL,
  `meetdate` datetime DEFAULT NULL,
  `title` varchar(192) NOT NULL,
  `content` longtext NOT NULL,
  `created` datetime DEFAULT NULL,
  `updated` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `user_id` (`user_id`),
  KEY `meetdate` (`meetdate`),
  KEY `created` (`created`),
  KEY `updated` (`updated`),
  KEY `meeting_id` (`meeting_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_member
# ------------------------------------------------------------

CREATE TABLE `works_member` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `project_id` varchar(32) NOT NULL DEFAULT '',
  `user` varchar(255) NOT NULL DEFAULT '' COMMENT '사용자 이메일',
  `role` varchar(16) NOT NULL,
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id_2` (`project_id`,`user`) USING HASH,
  KEY `role` (`role`),
  KEY `project_id` (`project_id`),
  KEY `user_id` (`user`(250)),
  KEY `created` (`created`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_plan
# ------------------------------------------------------------

CREATE TABLE `works_plan` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `parent` varchar(32) DEFAULT '',
  `order` int(10) unsigned NOT NULL,
  `status` varchar(8) NOT NULL,
  `project_id` varchar(32) NOT NULL DEFAULT '',
  `title` varchar(64) NOT NULL DEFAULT '',
  `mm` float DEFAULT NULL,
  `period` int(11) DEFAULT NULL,
  `user` varchar(255) DEFAULT '',
  `start` date DEFAULT NULL,
  `end` date DEFAULT NULL,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `extra` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent` (`parent`),
  KEY `order` (`order`),
  KEY `status` (`status`),
  KEY `project_id` (`project_id`),
  KEY `user` (`user`(250)),
  KEY `created` (`created`),
  KEY `updated` (`updated`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



# Dump of table works_project
# ------------------------------------------------------------

CREATE TABLE `works_project` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `namespace` varchar(32) NOT NULL DEFAULT '',
  `visibility` varchar(16) DEFAULT NULL,
  `title` varchar(64) NOT NULL DEFAULT '',
  `short` varchar(16) NOT NULL DEFAULT '',
  `status` varchar(6) NOT NULL DEFAULT '',
  `start` date NOT NULL,
  `end` date DEFAULT NULL,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `extra` longtext DEFAULT NULL,
  `icon` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `namespace` (`namespace`),
  KEY `status` (`status`),
  KEY `created` (`created`),
  KEY `updated` (`updated`),
  KEY `visibility` (`visibility`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `works_user_project_config` (
  `id` varchar(32) NOT NULL DEFAULT '',
  `user_id` varchar(32) NOT NULL DEFAULT '',
  `project_id` varchar(32) NOT NULL DEFAULT '',
  `key` varchar(32) NOT NULL DEFAULT '',
  `value` varchar(192) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`project_id`,`key`),
  KEY `user_id_2` (`user_id`),
  KEY `project_id` (`project_id`),
  KEY `key` (`key`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
