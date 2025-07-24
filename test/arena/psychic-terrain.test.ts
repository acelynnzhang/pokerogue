import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Arena - Psychic Terrain", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.PSYCHIC_SURGE)
      .ability(AbilityId.PRANKSTER);
  });

  it.each<{ category: string; move: MoveId; effect: () => void }>([
    {
      category: "Field-targeted",
      move: MoveId.RAIN_DANCE,
      effect: () => {
        expect(game.scene.arena.getWeatherType()).toBe(WeatherType.RAIN);
      },
    },
    {
      category: "Enemy-targeting spread",
      move: MoveId.DARK_VOID,
      effect: () => {
        expect(game.field.getEnemyPokemon().status?.effect).toBe(StatusEffect.SLEEP);
      },
    },
  ])("should not block $category moves that become priority", async ({ move, effect }) => {
    await game.classicMode.startBattle([SpeciesId.BLISSEY]);

    game.move.use(move);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    const blissey = game.field.getPlayerPokemon();

    expect(blissey.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    effect();
  });
});
