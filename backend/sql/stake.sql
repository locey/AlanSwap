/*
 Navicat Premium Dump SQL

 Source Server         : postgres
 Source Server Type    : PostgreSQL
 Source Server Version : 170006 (170006)
 Source Host           : localhost:5432
 Source Catalog        : web3
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170006 (170006)
 File Encoding         : 65001

 Date: 13/10/2025 19:59:51
*/


-- ----------------------------
-- Table structure for chain
-- ----------------------------
DROP TABLE IF EXISTS "public"."chain";
CREATE TABLE "public"."chain" (
  "id" int8 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "chain_id" int8,
  "chain_name" varchar(255) COLLATE "pg_catalog"."default",
  "last_block_num" int8,
  "address" varchar(255) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."chain"."chain_id" IS '链id';
COMMENT ON COLUMN "public"."chain"."chain_name" IS '链名称';
COMMENT ON COLUMN "public"."chain"."last_block_num" IS '最后监听的区块';
COMMENT ON COLUMN "public"."chain"."address" IS '地址';

-- ----------------------------
-- Table structure for score_rules
-- ----------------------------
DROP TABLE IF EXISTS "public"."score_rules";
CREATE TABLE "public"."score_rules" (
  "id" int8 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "chain_id" int8,
  "token_address" varchar(255) COLLATE "pg_catalog"."default",
  "score" numeric(10,2),
  "decimals" int8
)
;
COMMENT ON COLUMN "public"."score_rules"."score" IS '积分，例子：0.05,单位每小时';
COMMENT ON COLUMN "public"."score_rules"."decimals" IS '合约decimals()';

-- ----------------------------
-- Table structure for user_operation_record
-- ----------------------------
DROP TABLE IF EXISTS "public"."user_operation_record";
CREATE TABLE "public"."user_operation_record" (
  "id" int8 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "chain_id" int8,
  "token_address" varchar(128) COLLATE "pg_catalog"."default",
  "address" varchar(128) COLLATE "pg_catalog"."default",
  "pool_id" int8,
  "amount" int8,
  "operation_time" timestamptz(6),
  "unlock_time" timestamptz(6),
  "tx_hash" varchar(255) COLLATE "pg_catalog"."default",
  "block_number" int8,
  "event_type" varchar(32) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" int8 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1
),
  "chain_id" int4,
  "address" varchar(255) COLLATE "pg_catalog"."default",
  "total_amount" int8,
  "last_block_num" int8,
  "token_address" varchar(255) COLLATE "pg_catalog"."default",
  "jf_amount" int8 NOT NULL DEFAULT 0,
  "jf" numeric(10,2) NOT NULL DEFAULT 0,
  "jf_time" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
COMMENT ON COLUMN "public"."users"."id" IS '主键id';
COMMENT ON COLUMN "public"."users"."chain_id" IS '链id';
COMMENT ON COLUMN "public"."users"."address" IS '用户address';
COMMENT ON COLUMN "public"."users"."total_amount" IS '总金额';
COMMENT ON COLUMN "public"."users"."last_block_num" IS '最后区块';
COMMENT ON COLUMN "public"."users"."token_address" IS 'token地址';
COMMENT ON COLUMN "public"."users"."jf_amount" IS '计算积分时的总金额';
COMMENT ON COLUMN "public"."users"."jf" IS '截止计算积分时的总积分';

-- ----------------------------
-- Primary Key structure for table chain
-- ----------------------------
ALTER TABLE "public"."chain" ADD CONSTRAINT "chain_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table score_rules
-- ----------------------------
ALTER TABLE "public"."score_rules" ADD CONSTRAINT "score_rules_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table user_operation_record
-- ----------------------------
ALTER TABLE "public"."user_operation_record" ADD CONSTRAINT "user_operation_records_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE UNIQUE INDEX "uk" ON "public"."users" USING btree (
  "chain_id" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "token_address" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "address" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");
