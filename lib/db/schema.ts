import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Preferences } from "../settings/options";
import { DIFFICULTIES, TEST_MODES } from "../typing/options";
import type { WpmSnapshot } from "../typing/types";

export const testMode = pgEnum("test_mode", TEST_MODES);
export const difficulty = pgEnum("difficulty", DIFFICULTIES);

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const players = pgTable(
  "players",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    nameEdited: boolean().notNull().default(false),
    authUserId: text().unique(),
    email: text(),
    image: text(),
    avatarKey: text(),
    preferences: jsonb().$type<Preferences>(),
    createdAt: createdAt(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("players_name_lower_idx").on(sql`lower(${table.name})`)],
);

export const results = pgTable(
  "results",
  {
    id: uuid().primaryKey().defaultRandom(),
    playerId: uuid()
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    mode: testMode().notNull(),
    modeDetail: text().notNull(),
    punctuation: boolean().notNull().default(false),
    numbers: boolean().notNull().default(false),
    difficulty: difficulty(),
    wpm: integer().notNull(),
    raw: integer().notNull(),
    accuracy: integer().notNull(),
    consistency: integer().notNull(),
    correctChars: integer().notNull(),
    incorrectChars: integer().notNull(),
    extraChars: integer().notNull(),
    missedChars: integer().notNull(),
    correctedErrors: integer().notNull(),
    elapsedSeconds: integer().notNull(),
    history: jsonb().$type<WpmSnapshot[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (table) => [
    index("results_board_idx").on(
      table.mode,
      table.modeDetail,
      table.wpm.desc(),
      table.accuracy.desc(),
    ),
    index("results_player_idx").on(table.playerId, table.createdAt.desc()),
  ],
);

export const rooms = pgTable("rooms", {
  id: uuid().primaryKey().defaultRandom(),
  code: text().notNull().unique(),
  name: text().notNull(),
  ownerId: uuid().references(() => players.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const roomMembers = pgTable(
  "room_members",
  {
    roomId: uuid()
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    playerId: uuid()
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.playerId] }),
    index("room_members_player_idx").on(table.playerId),
  ],
);

export type Player = typeof players.$inferSelect;
export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;
export type Room = typeof rooms.$inferSelect;
